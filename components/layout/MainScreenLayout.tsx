import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
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
type ContentSizeHandler = (width: number, height: number) => void;
type LayoutHandler = (event: LayoutChangeEvent) => void;

function SearchHeaderControl({
  mode,
  onPress,
}: {
  mode: "cancel" | "search";
  onPress: () => void;
}) {
  const { theme } = useMinutaTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const isCancel = mode === "cancel";

  useEffect(() => {
    progress.setValue(0);
    Animated.spring(progress, {
      damping: 15,
      mass: 0.85,
      stiffness: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [mode, progress]);

  return (
    <Animated.View
      key={mode}
      style={{
        opacity: progress,
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.82, 1],
            }),
          },
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-4, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isCancel ? "Cancelar búsqueda" : "Mostrar búsqueda"}
        onPress={onPress}
        style={({ pressed }) => [
          isCancel ? styles.cancelButton : styles.searchButton,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        {isCancel ? (
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>
            Cancelar
          </Text>
        ) : (
          <Ionicons color={theme.text} name="search-outline" size={20} />
        )}
      </Pressable>
    </Animated.View>
  );
}

interface MainScreenLayoutProps {
  actions?: ReactNode;
  centerHeaderTitle?: boolean;
  children: (props: {
    onMomentumScrollEnd: ScrollGestureHandler;
    onContentSizeChange: ContentSizeHandler;
    onLayout: LayoutHandler;
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
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFocusRequest, setSearchFocusRequest] = useState(0);
  const normalizedSearchValue = searchValue ?? "";
  const {
    collapse: collapseSearchBar,
    expand: expandSearchBar,
    isCollapsed: isSearchCollapsed,
    onMomentumScrollEnd,
    onContentSizeChange,
    onLayout,
    onScroll: handleScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
  } = useSearchBarScrollBehavior({
    disabled: compactHeader || !searchPlaceholder || !onSearchChange,
  });
  const shouldShowSearchButton =
    !compactHeader && Boolean(searchPlaceholder && onSearchChange);
  const shouldShowCancelButton =
    shouldShowSearchButton &&
    !isSearchCollapsed &&
    (isSearchActive || normalizedSearchValue.length > 0);
  const searchControl =
    shouldShowSearchButton && (isSearchCollapsed || shouldShowCancelButton) ? (
    <SearchHeaderControl
      mode={isSearchCollapsed ? "search" : "cancel"}
      onPress={() => {
        if (isSearchCollapsed) {
          expandSearchBar();
          setSearchFocusRequest((value) => value + 1);
          return;
        }

        onSearchChange?.("");
        setIsSearchActive(false);
        Keyboard.dismiss();
        collapseSearchBar();
      }}
    />
  ) : null;
  const resolvedActions =
    actions || searchControl ? (
      <>
        {searchControl}
        {actions}
      </>
    ) : undefined;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.fixedArea}>
        <FixedHeader
          actions={resolvedActions}
          centerTitle={centerHeaderTitle}
          leadingAction={leadingAction}
          title={title}
        />
        {!compactHeader && searchPlaceholder && onSearchChange ? (
          <CollapsibleSearch
            collapsed={isSearchCollapsed}
            focusRequest={searchFocusRequest}
            onBlur={() => {
              setIsSearchActive(false);
              onSearchBlur?.();
            }}
            onChangeText={onSearchChange}
            onFocus={() => {
              setIsSearchActive(true);
              onSearchFocus?.();
            }}
            placeholder={searchPlaceholder}
            value={normalizedSearchValue}
          />
        ) : null}
        {!compactHeader ? <StickyChips>{chips}</StickyChips> : null}
      </View>
      <View style={styles.content}>
        {children({
          onMomentumScrollEnd,
          onContentSizeChange,
          onLayout,
          onScroll: handleScroll,
          onScrollBeginDrag,
          onScrollEndDrag,
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    minWidth: 86,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  content: {
    flex: 1,
  },
  fixedArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  screen: {
    flex: 1,
  },
});
