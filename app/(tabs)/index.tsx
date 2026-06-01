import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { FolderChips } from "../../components/folders/FolderChips";
import { HomeTasksWidget } from "../../components/items/HomeTasksWidget";
import { IdeaCard } from "../../components/items/IdeaCard";
import { NoteCard } from "../../components/items/NoteCard";
import { EmptyState } from "../../components/layout/EmptyState";
import { MainScreenLayout } from "../../components/layout/MainScreenLayout";
import {
  getScrollPositionKey,
  usePersistedScrollPosition,
} from "../../components/layout/usePersistedScrollPosition";
import { spacing } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import {
  ALL_FOLDERS_ID,
  buildFolderChips,
  NO_FOLDER_ID,
  type FolderFilterId,
  matchesFolderFilter,
} from "../../lib/folders";
import { getListEmptyState } from "../../lib/emptyStates";
import { useFoldersStore } from "../../store/foldersStore";
import { useCreateContextStore } from "../../store/createContextStore";
import { useNotesStore } from "../../store/notesStore";
import { IdeaNote, isIdeaNote, isTextNote, Note } from "../../types";

type HomeMasonryItem = Note | IdeaNote;

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesHomeSearch(item: HomeMasonryItem, query: string) {
  if (!query) return true;

  if (isTextNote(item)) {
    return (
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query)
    );
  }

  return (
    item.title.toLowerCase().includes(query) ||
    item.tags.some((tag) => tag.toLowerCase().includes(query))
  );
}

function getEstimatedCardWeight(item: HomeMasonryItem) {
  if (isTextNote(item) && item.imageUri) return 2;
  return 1;
}

function getActivityTime(item: HomeMasonryItem) {
  return (item.updatedAt ?? item.createdAt).getTime();
}

function splitIntoMasonryColumns(items: HomeMasonryItem[]) {
  const left: HomeMasonryItem[] = [];
  const right: HomeMasonryItem[] = [];
  let leftWeight = 0;
  let rightWeight = 0;

  items.forEach((item) => {
    const weight = getEstimatedCardWeight(item);

    if (leftWeight <= rightWeight) {
      left.push(item);
      leftWeight += weight;
    } else {
      right.push(item);
      rightWeight += weight;
    }
  });

  return { left, right };
}

function renderMasonryItem(item: HomeMasonryItem, onPress: () => void) {
  if (isTextNote(item)) {
    return (
      <NoteCard key={item.id} note={item} onPress={onPress} variant="home" />
    );
  }

  if (isIdeaNote(item)) {
    return (
      <IdeaCard key={item.id} idea={item} onPress={onPress} variant="home" />
    );
  }

  return null;
}

export default function HomeScreen() {
  const { theme } = useMinutaTheme();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);

  const widgetAnim = useRef(new Animated.Value(1)).current;

  const folders = useFoldersStore((state) => state.folders);
  const fetchFolders = useFoldersStore((state) => state.fetchFolders);
  const setCreateContext = useCreateContextStore(
    (state) => state.setCreateContext,
  );
  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const tasks = useNotesStore((state) => state.tasks);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const fetchItems = useNotesStore((state) => state.fetchItems);

  const activeNotes = notes.filter((note) => !note.isArchived);
  const activeIdeas = ideas.filter((idea) => !idea.isArchived);
  const activeTasks = tasks.filter((task) => !task.isArchived);
  const folderChips = buildFolderChips(folders, {
    tasks: activeTasks,
    notes: activeNotes,
    ideas: activeIdeas,
  });
  const filteredTasks = activeTasks.filter((task) =>
    matchesFolderFilter(task, selectedFolderId),
  );
  const pendingVisibleTasks = filteredTasks.filter((task) => !task.isCompleted);
  const hasVisibleTasks = pendingVisibleTasks.length > 0;
  const allItems = [
    ...activeNotes.filter((note) =>
      matchesFolderFilter(note, selectedFolderId),
    ),
    ...activeIdeas.filter((idea) =>
      matchesFolderFilter(idea, selectedFolderId),
    ),
  ].sort((a, b) => getActivityTime(b) - getActivityTime(a));

  const normalizedQuery = normalizeSearch(searchQuery);

  const items = allItems.filter((item) =>
    matchesHomeSearch(item, normalizedQuery),
  );
  const emptyState = getListEmptyState({
    hasAnyItems: allItems.length > 0,
    searchQuery,
    selectedFolderId,
    type: "home",
  });

  const { left, right } = splitIntoMasonryColumns(items);
  const scrollKey = getScrollPositionKey("home", selectedFolderId);
  const { saveScrollPosition } = usePersistedScrollPosition({
    listRef: scrollRef,
    scrollKey,
  });

  const shouldHideWidget = isSearchFocused || searchQuery.trim().length > 0;

  useEffect(() => {
    if (
      selectedFolderId !== ALL_FOLDERS_ID &&
      selectedFolderId !== NO_FOLDER_ID &&
      !folders.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(ALL_FOLDERS_ID);
    }
  }, [folders, selectedFolderId]);

  useFocusEffect(
    useCallback(() => {
      setCreateContext({
        folderId:
          selectedFolderId === ALL_FOLDERS_ID ||
          selectedFolderId === NO_FOLDER_ID
            ? null
            : selectedFolderId,
        kind: "note",
      });
    }, [selectedFolderId, setCreateContext]),
  );

  const handleSelectFolder = (folderId: FolderFilterId) => {
    setSelectedFolderId(folderId);
    setCreateContext({
      folderId:
        folderId === ALL_FOLDERS_ID || folderId === NO_FOLDER_ID
          ? null
          : folderId,
      kind: "note",
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([fetchItems(), fetchFolders()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const animatedWidgetHeight = widgetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, widgetHeight],
  });

  const animatedWidgetMarginTop = widgetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    Animated.timing(widgetAnim, {
      toValue: shouldHideWidget ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [shouldHideWidget, widgetAnim]);

  return (
    <MainScreenLayout
      actions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir cuenta"
          onPress={() => router.push("/account")}
          style={[styles.accountButton, { backgroundColor: theme.surface }]}
        >
          <View
            style={[styles.accountAvatar, { backgroundColor: theme.primary }]}
          >
            <Ionicons color={theme.primaryText} name="person" size={18} />
          </View>
        </Pressable>
      }
      chips={
        folderChips.length > 1 ? (
          <FolderChips
            context="home"
            folders={folderChips}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
          />
        ) : null
      }
      searchPlaceholder="Buscar notas e ideas..."
      searchValue={searchQuery}
      title="Minuta"
      onSearchBlur={() => setIsSearchFocused(false)}
      onSearchChange={setSearchQuery}
      onSearchFocus={() => setIsSearchFocused(true)}
    >
      {({
        onMomentumScrollEnd,
        onContentSizeChange,
        onLayout,
        onScroll,
        onScrollBeginDrag,
        onScrollEndDrag,
      }) => (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomTabBarHeight + spacing.md },
          ]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={onContentSizeChange}
          onLayout={onLayout}
          onScroll={(event) => {
            saveScrollPosition(event);
            onScroll(event);
          }}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollEnd={onMomentumScrollEnd}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          scrollEventThrottle={16}
        >
          <View style={styles.header}>
            {hasVisibleTasks ? (
              <Animated.View
                pointerEvents={shouldHideWidget ? "none" : "auto"}
                style={[
                  styles.widgetAnimatedWrapper,
                  widgetHeight > 0
                    ? {
                        height: animatedWidgetHeight,
                        marginTop: animatedWidgetMarginTop,
                        opacity: widgetAnim,
                      }
                    : {
                        opacity: widgetAnim,
                        marginTop: 12,
                      },
                ]}
              >
                <View
                  onLayout={(event) => {
                    const height = event.nativeEvent.layout.height;

                    if (height > 0 && height !== widgetHeight) {
                      setWidgetHeight(height);
                    }
                  }}
                >
                  <HomeTasksWidget
                    onToggleTask={toggleTask}
                    tasks={pendingVisibleTasks}
                  />
                </View>
              </Animated.View>
            ) : null}
          </View>

          <View>
            {items.length === 0 ? (
              <EmptyState title={emptyState.title} text={emptyState.text} />
            ) : (
              <View style={styles.masonryRow}>
                <View style={styles.column}>
                  {left.map((item) => (
                    <View key={item.id} style={styles.cardWrapper}>
                      {renderMasonryItem(item, () =>
                        router.push(`/item/${item.id}`),
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.column}>
                  {right.map((item) => (
                    <View key={item.id} style={styles.cardWrapper}>
                      {renderMasonryItem(item, () =>
                        router.push(`/item/${item.id}`),
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  accountAvatar: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },

  accountButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },

  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  header: {
    marginBottom: 12,
  },

  widgetAnimatedWrapper: {
    overflow: "hidden",
  },

  masonryRow: {
    flexDirection: "row",
    gap: 12,
  },

  column: {
    flex: 1,
  },

  cardWrapper: {
    marginBottom: 12,
  },
});
