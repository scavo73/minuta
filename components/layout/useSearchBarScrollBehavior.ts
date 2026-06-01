import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type ScrollGestureHandler = () => void;
type SearchBarStateListener = (isCollapsed: boolean) => void;

const SCROLL_DIRECTION_THRESHOLD = 6;
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
  threshold = SCROLL_DIRECTION_THRESHOLD,
}: {
  bottomBounceDeltaThreshold?: number;
  bottomOverscrollThreshold?: number;
  disabled?: boolean;
  threshold?: number;
} = {}) {
  const previousScrollY = useRef(0);
  const hasPreviousScrollY = useRef(false);
  const isScrollGestureActive = useRef(false);
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

  const onScrollBeginDrag = useCallback<ScrollGestureHandler>(() => {
    if (disabled) return;

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
      const boundedScrollY = Math.min(currentScrollY, maxScrollY);
      const scrollDelta = boundedScrollY - previousScrollY.current;
      const distanceFromBottom = maxScrollY - boundedScrollY;
      const isNearBottom = distanceFromBottom <= bottomOverscrollThreshold;
      const isPastBottom = currentScrollY > maxScrollY;
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

      if (isBottomBounce) {
        return;
      }

      previousScrollY.current = boundedScrollY;

      if (scrollDelta > 0) {
        setSharedIsCollapsed(true);
        return;
      }

      setSharedIsCollapsed(false);
    },
    [bottomBounceDeltaThreshold, bottomOverscrollThreshold, disabled, threshold],
  );

  return {
    isCollapsed,
    onMomentumScrollEnd: onScrollEndDrag,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
  };
}
