import { useEffect } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { HomeTasksWidget } from '../../components/items/HomeTasksWidget';
import { IdeaCard } from '../../components/items/IdeaCard';
import { NoteCard } from '../../components/items/NoteCard';
import { spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import { useNotesStore } from '../../store/notesStore';
import { IdeaNote, isIdeaNote, isTextNote, Note } from '../../types';

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
    return <NoteCard key={item.id} note={item} onPress={onPress} variant="home" />;
  }

  if (isIdeaNote(item)) {
    return <IdeaCard key={item.id} idea={item} onPress={onPress} variant="home" />;
  }

  return null;
}

export default function HomeScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const tasks = useNotesStore((state) => state.tasks);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const seedDemoData = useNotesStore((state) => state.seedDemoData);
  const allItems = [...notes, ...ideas].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
  const normalizedQuery = normalizeSearch(searchQuery);
  const items = allItems.filter((item) =>
    matchesHomeSearch(item, normalizedQuery)
  );
  const { left, right } = splitIntoMasonryColumns(items);

  useEffect(() => {
    seedDemoData();
  }, [seedDemoData]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Minuta</Text>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            Todo lo que has guardado, en un solo sitio.
          </Text>
          <TextInput
            onChangeText={setSearchQuery}
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
          <HomeTasksWidget onToggleTask={toggleTask} tasks={tasks} />
        </View>

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
                  {renderMasonryItem(item, () => router.push(`/item/${item.id}`))}
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {right.map((item) => (
                <View key={item.id} style={styles.cardWrapper}>
                  {renderMasonryItem(item, () => router.push(`/item/${item.id}`))}
                </View>
              ))}
            </View>
          </View>
        )}
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
    paddingVertical: spacing.md,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
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
  empty: {
    fontSize: typography.body,
  },
  masonryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 12,
  },
});
