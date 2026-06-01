import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type ScrollGestureHandler = () => void;
type SearchBarStateListener = (isCollapsed: boolean) => void;
type ContentSizeHandler = (width: number, height: number) => void;
type LayoutHandler = (event: LayoutChangeEvent) => void;

const SCROLL_DIRECTION_THRESHOLD = 6;
const SCROLL_STATE_CHANGE_COOLDOWN_MS = 90;
const SCROLLABLE_CONTENT_THRESHOLD = 16;
const TOP_OVERSCROLL_THRESHOLD = 18;
const TOP_BOUNCE_DELTA_THRESHOLD = 18;
const BOTTOM_OVERSCROLL_THRESHOLD = 28;
const BOTTOM_BOUNCE_DELTA_THRESHOLD = 18;

let sharedIsCollapsed = false;
const searchBarStateListeners = new Set<SearchBarStateListener>();

function setSharedIsCollapsed(nextIsCollapsed: boolean) {
  if (sharedIsCollapsed === nextIsCollapsed) return;

  sharedIsCollapsed = nextIsCollapsed;
  searchBarStateListeners.forEach((listener) => listener(sharedIsCollapsed));
}

export function useSearchBarScrollBehavior({
  disabled = false,
  bottomBounceDeltaThreshold = BOTTOM_BOUNCE_DELTA_THRESHOLD,
  bottomOverscrollThreshold = BOTTOM_OVERSCROLL_THRESHOLD,
  stateChangeCooldownMs = SCROLL_STATE_CHANGE_COOLDOWN_MS,
  scrollableContentThreshold = SCROLLABLE_CONTENT_THRESHOLD,
  threshold = SCROLL_DIRECTION_THRESHOLD,
  topBounceDeltaThreshold = TOP_BOUNCE_DELTA_THRESHOLD,
  topOverscrollThreshold = TOP_OVERSCROLL_THRESHOLD,
}: {
  bottomBounceDeltaThreshold?: number;
  bottomOverscrollThreshold?: number;
  disabled?: boolean;
  scrollableContentThreshold?: number;
  stateChangeCooldownMs?: number;
  threshold?: number;
  topBounceDeltaThreshold?: number;
  topOverscrollThreshold?: number;
} = {}) {
  const previousScrollY = useRef(0);
  const hasPreviousScrollY = useRef(false);
  const contentHeight = useRef(0);
  const isScrollGestureActive = useRef(false);
  const isScrollable = useRef(true);
  const lastStateChangeAt = useRef(0);
  const layoutHeight = useRef(0);
  const [isCollapsed, setIsCollapsed] = useState(sharedIsCollapsed);

  useEffect(() => {
    searchBarStateListeners.add(setIsCollapsed);

    return () => {
      searchBarStateListeners.delete(setIsCollapsed);
    };
  }, []);

  useEffect(() => {
    hasPreviousScrollY.current = false;
  }, [disabled]);

  const updateScrollability = useCallback(() => {
    if (layoutHeight.current <= 0 || contentHeight.current <= 0) return;

    const nextIsScrollable =
      contentHeight.current > layoutHeight.current + scrollableContentThreshold;

    isScrollable.current = nextIsScrollable;

    if (!nextIsScrollable) {
      hasPreviousScrollY.current = false;
      isScrollGestureActive.current = false;
    }
  }, [scrollableContentThreshold]);

  const expand = useCallback(() => {
    setSharedIsCollapsed(false);
    hasPreviousScrollY.current = false;
    isScrollGestureActive.current = false;
  }, []);

  const collapse = useCallback(() => {
    setSharedIsCollapsed(true);
    hasPreviousScrollY.current = false;
    isScrollGestureActive.current = false;
  }, []);

  const onLayout = useCallback<LayoutHandler>(
    (event) => {
      layoutHeight.current = event.nativeEvent.layout.height;
      updateScrollability();
    },
    [updateScrollability],
  );

  const onContentSizeChange = useCallback<ContentSizeHandler>(
    (_width, height) => {
      contentHeight.current = height;
      updateScrollability();
    },
    [updateScrollability],
  );

  const onScrollBeginDrag = useCallback<ScrollGestureHandler>(() => {
    if (disabled || !isScrollable.current) return;

    isScrollGestureActive.current = true;
    hasPreviousScrollY.current = false;
  }, [disabled]);

  const onScrollEndDrag = useCallback<ScrollGestureHandler>(() => {
    isScrollGestureActive.current = false;
    hasPreviousScrollY.current = false;
  }, []);

  const onScroll = useCallback<ScrollHandler>(
    (event) => {
      if (disabled || !isScrollGestureActive.current) return;

      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const currentScrollY = Math.max(0, contentOffset.y);
      const maxScrollY = Math.max(
        0,
        contentSize.height - layoutMeasurement.height,
      );

      if (maxScrollY <= scrollableContentThreshold) {
        isScrollable.current = false;
        return;
      }

      isScrollable.current = true;
      const boundedScrollY = Math.min(currentScrollY, maxScrollY);
      const scrollDelta = boundedScrollY - previousScrollY.current;
      const distanceFromBottom = maxScrollY - boundedScrollY;
      const isAtTop = boundedScrollY <= topOverscrollThreshold;
      const isNearBottom = distanceFromBottom <= bottomOverscrollThreshold;
      const isPastTop = contentOffset.y < 0;
      const isPastBottom = currentScrollY > maxScrollY;
      const isTopBounce =
        isPastTop ||
        (isAtTop && Math.abs(scrollDelta) <= topBounceDeltaThreshold);
      const isBottomBounce =
        isPastBottom ||
        (isNearBottom && Math.abs(scrollDelta) <= bottomBounceDeltaThreshold);

      if (!hasPreviousScrollY.current) {
        previousScrollY.current = boundedScrollY;
        hasPreviousScrollY.current = true;
        return;
      }

      if (Math.abs(scrollDelta) < threshold) {
        return;
      }

      if (isTopBounce || isBottomBounce) {
        return;
      }

      previousScrollY.current = boundedScrollY;

      const now = Date.now();

      if (now - lastStateChangeAt.current < stateChangeCooldownMs) {
        return;
      }

      if (scrollDelta > 0) {
        if (sharedIsCollapsed) return;

        setSharedIsCollapsed(true);
        lastStateChangeAt.current = now;
        return;
      }

      if (!sharedIsCollapsed) return;

      setSharedIsCollapsed(false);
      lastStateChangeAt.current = now;
    },
    [
      bottomBounceDeltaThreshold,
      bottomOverscrollThreshold,
      disabled,
      scrollableContentThreshold,
      stateChangeCooldownMs,
      threshold,
      topBounceDeltaThreshold,
      topOverscrollThreshold,
    ],
  );

  return {
    collapse,
    isCollapsed,
    expand,
    onMomentumScrollEnd: onScrollEndDrag,
    onContentSizeChange,
    onLayout,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
  };
}
