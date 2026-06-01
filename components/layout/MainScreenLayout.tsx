import type { ReactNode } from "react";
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
import { useSearchBarScrollBehavior } from "./useSearchBarScrollBehavior";

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type ScrollGestureHandler = () => void;

interface MainScreenLayoutProps {
  actions?: ReactNode;
  centerHeaderTitle?: boolean;
  children: (props: {
    onMomentumScrollEnd: ScrollGestureHandler;
    onScroll: ScrollHandler;
    onScrollBeginDrag: ScrollGestureHandler;
    onScrollEndDrag: ScrollGestureHandler;
  }) => ReactNode;
  chips?: ReactNode;
  compactHeader?: boolean;
  leadingAction?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  title: string;
  onSearchBlur?: () => void;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
}

export function MainScreenLayout({
  actions,
  centerHeaderTitle = false,
  children,
  chips,
  compactHeader = false,
  leadingAction,
  onSearchBlur,
  onSearchChange,
  onSearchFocus,
  searchPlaceholder,
  searchValue,
  title,
}: MainScreenLayoutProps) {
  const { theme } = useMinutaTheme();
  const {
    isCollapsed: isSearchCollapsed,
    onMomentumScrollEnd,
    onScroll: handleScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
  } = useSearchBarScrollBehavior({
    disabled: compactHeader || !searchPlaceholder || !onSearchChange,
  });

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.fixedArea}>
        <FixedHeader
          actions={actions}
          centerTitle={centerHeaderTitle}
          leadingAction={leadingAction}
          title={title}
        />
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
      <View style={styles.content}>
        {children({
          onMomentumScrollEnd,
          onScroll: handleScroll,
          onScrollBeginDrag,
          onScrollEndDrag,
        })}
      </View>
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
