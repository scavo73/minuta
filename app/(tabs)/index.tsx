import { useEffect, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FolderChips } from "../../components/folders/FolderChips";
import { HomeTasksWidget } from "../../components/items/HomeTasksWidget";
import { IdeaCard } from "../../components/items/IdeaCard";
import { NoteCard } from "../../components/items/NoteCard";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import {
  ALL_FOLDERS_ID,
  buildFolderChips,
  NO_FOLDER_ID,
  type FolderFilterId,
  matchesFolderFilter,
} from "../../lib/folders";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState(0);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);

  const widgetAnim = useRef(new Animated.Value(1)).current;

  const folders = useFoldersStore((state) => state.folders);
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
  const folderChips = buildFolderChips(folders, {
    tasks,
    notes: activeNotes,
    ideas: activeIdeas,
  });
  const filteredTasks = tasks.filter((task) =>
    matchesFolderFilter(task, selectedFolderId),
  );
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

  const { left, right } = splitIntoMasonryColumns(items);

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
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          styles.contentWithTabBarPadding,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Minuta</Text>

          <TextInput
            onBlur={() => setIsSearchFocused(false)}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Buscar notas e ideas..."
            placeholderTextColor={theme.mutedText}
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
              },
            ]}
            value={searchQuery}
          />
          {folderChips.length > 1 ? (
            <View style={styles.folderChipsWrapper}>
              <FolderChips
                folders={folderChips}
                selectedFolderId={selectedFolderId}
                onSelectFolder={handleSelectFolder}
              />
            </View>
          ) : null}

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
                tasks={filteredTasks}
              />
            </View>
          </Animated.View>
        </View>

        <View>
          {allItems.length === 0 ? (
            <Text style={[styles.empty, { color: theme.mutedText }]}>
              Todavía no hay notas ni ideas.
            </Text>
          ) : items.length === 0 ? (
            <Text style={[styles.empty, { color: theme.mutedText }]}>
              No hay resultados para esta búsqueda.
            </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  contentWithTabBarPadding: {
    paddingBottom: 120,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: typography.title,
    fontWeight: "700",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },

  searchInput: {
    borderRadius: 16,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },

  folderChipsWrapper: {
    marginTop: 12,
  },

  widgetAnimatedWrapper: {
    overflow: "hidden",
  },

  empty: {
    fontSize: typography.body,
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
