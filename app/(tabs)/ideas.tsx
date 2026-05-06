import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdeaCard } from '../../components/items/IdeaCard';
import { spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import { useNotesStore } from '../../store/notesStore';

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function IdeasScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const ideas = useNotesStore((state) => state.ideas);
  const normalizedQuery = normalizeSearch(searchQuery);
  const filteredIdeas = ideas.filter((idea) => {
    if (!normalizedQuery) return true;

    return (
      idea.title.toLowerCase().includes(normalizedQuery) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredIdeas}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Ideas</Text>
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Buscar ideas..."
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
              {ideas.length === 0
                ? 'Todavía no hay ideas.'
                : 'No hay resultados para esta búsqueda.'}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <IdeaCard
              idea={item}
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
