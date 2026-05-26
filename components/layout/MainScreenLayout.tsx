import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { CollapsibleSearch } from "./CollapsibleSearch";
import { FixedHeader } from "./FixedHeader";
import { StickyChips } from "./StickyChips";

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

interface MainScreenLayoutProps {
  actions?: ReactNode;
  children: (props: { onScroll: ScrollHandler }) => ReactNode;
  chips?: ReactNode;
  compactHeader?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  title: string;
  onSearchBlur?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
}

export function MainScreenLayout({
  actions,
  children,
  chips,
  compactHeader = false,
  onSearchBlur,
  onSearchChange,
  onSearchFocus,
  searchPlaceholder,
  searchValue,
  title,
}: MainScreenLayoutProps) {
  const { theme } = useMinutaTheme();
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsSearchCollapsed(false);
    }, []),
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (compactHeader) return;

    const y = event.nativeEvent.contentOffset.y;

    if (y > 24 && !isSearchCollapsed) {
      setIsSearchCollapsed(true);
      return;
    }

    if (y < 8 && isSearchCollapsed) {
      setIsSearchCollapsed(false);
    }
  }, [compactHeader, isSearchCollapsed]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.fixedArea}>
        <FixedHeader actions={actions} title={title} />
        {!compactHeader && searchPlaceholder && onSearchChange ? (
          <CollapsibleSearch
            collapsed={isSearchCollapsed}
            onBlur={onSearchBlur}
            onChangeText={onSearchChange}
            onFocus={onSearchFocus}
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
          />
        ) : null}
        {!compactHeader ? <StickyChips>{chips}</StickyChips> : null}
      </View>
      <View style={styles.content}>{children({ onScroll: handleScroll })}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  fixedArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  screen: {
    flex: 1,
  },
});
