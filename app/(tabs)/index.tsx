import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Reanimated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeTasksWidget } from "../../components/items/HomeTasksWidget";
import { IdeaCard } from "../../components/items/IdeaCard";
import { NoteCard } from "../../components/items/NoteCard";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";
import { IdeaNote, isIdeaNote, isTextNote, Note } from "../../types";

type HomeMasonryItem = Note | IdeaNote;

const gridLayoutTransition = LinearTransition.springify()
  .damping(16)
  .stiffness(180);

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

  const widgetAnim = useRef(new Animated.Value(1)).current;

  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const tasks = useNotesStore((state) => state.tasks);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const seedDemoData = useNotesStore((state) => state.seedDemoData);

  const allItems = [
    ...notes.filter((note) => !note.isArchived),
    ...ideas.filter((idea) => !idea.isArchived),
  ].sort((a, b) => getActivityTime(b) - getActivityTime(a));

  const normalizedQuery = normalizeSearch(searchQuery);

  const items = allItems.filter((item) =>
    matchesHomeSearch(item, normalizedQuery),
  );

  const { left, right } = splitIntoMasonryColumns(items);

  const shouldHideWidget = isSearchFocused || searchQuery.trim().length > 0;

  const animatedWidgetHeight = widgetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, widgetHeight],
  });

  const animatedWidgetMarginTop = widgetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  useEffect(() => {
    seedDemoData();
  }, [seedDemoData]);

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
              <HomeTasksWidget onToggleTask={toggleTask} tasks={tasks} />
            </View>
          </Animated.View>
        </View>

        <Reanimated.View layout={gridLayoutTransition}>
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
        </Reanimated.View>
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
