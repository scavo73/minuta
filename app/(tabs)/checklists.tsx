import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskCard } from '../../components/items/TaskCard';
import { spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import { useNotesStore } from '../../store/notesStore';

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function ChecklistsScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const tasks = useNotesStore((state) => state.tasks);
  const normalizedQuery = normalizeSearch(searchQuery);
  const filteredTasks = tasks.filter((task) => {
    if (!normalizedQuery) return true;

    return task.text.toLowerCase().includes(normalizedQuery);
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredTasks}
          estimatedItemSize={160}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Tareas</Text>
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Buscar tareas..."
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
              {tasks.length === 0
                ? 'Todavía no hay tareas.'
                : 'No hay resultados para esta búsqueda.'}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <TaskCard
              onPress={() => router.push(`/item/${item.id}`)}
              task={item}
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
