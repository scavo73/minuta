import { useCallback, useEffect, type RefObject } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

type ScrollableRef = {
  scrollTo?: (options: { animated?: boolean; y?: number }) => void;
  scrollToOffset?: (options: { animated?: boolean; offset: number }) => void;
};

const scrollPositions = new Map<string, number>();

export function getScrollPositionKey(screenName: string, folderId: string) {
  return `${screenName}:${folderId}`;
}

export function usePersistedScrollPosition<T extends ScrollableRef>({
  enabled = true,
  listRef,
  scrollKey,
}: {
  enabled?: boolean;
  listRef: RefObject<T | null>;
  scrollKey: string;
}) {
  const saveScrollPosition = useCallback(
    (event: ScrollEvent) => {
      if (!enabled) return;

      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      scrollPositions.set(scrollKey, y);
    },
    [enabled, scrollKey],
  );

  const restoreScrollPosition = useCallback(() => {
    if (!enabled) return;

    const offset = scrollPositions.get(scrollKey) ?? 0;

    requestAnimationFrame(() => {
      const list = listRef.current;

      if (!list) return;

      if (typeof list.scrollToOffset === "function") {
        list.scrollToOffset({ animated: false, offset });
        return;
      }

      list.scrollTo?.({ animated: false, y: offset });
    });
  }, [enabled, listRef, scrollKey]);

  useEffect(() => {
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  return {
    restoreScrollPosition,
    saveScrollPosition,
  };
}
