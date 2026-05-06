import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteCard } from '../../components/items/NoteCard';
import { spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import { useNotesStore } from '../../store/notesStore';

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function NotasScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const notes = useNotesStore((state) => state.notes);
  const normalizedQuery = normalizeSearch(searchQuery);
  const filteredNotes = notes.filter((note) => {
    if (!normalizedQuery) return true;

    return (
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.content.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredNotes}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Notas</Text>
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Buscar notas..."
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
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.mutedText }]}>
              {notes.length === 0
                ? 'Todavía no hay notas.'
                : 'No hay resultados para esta búsqueda.'}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  searchInput: {
    borderRadius: 16,
    fontSize: typography.body,
    marginBottom: 12,
    marginTop: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  empty: {
    fontSize: typography.body,
    marginTop: spacing.md,
  },
  separator: {
    height: 12,
  },
});
