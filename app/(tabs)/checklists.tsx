import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import type { ItemAction } from "../../components/actions/actions";
import { TaskRow } from "../../components/items/TaskRow";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function ChecklistsScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const tasks = useNotesStore((state) => state.tasks);
  const deleteAllTasks = useNotesStore((state) => state.deleteAllTasks);
  const deleteCompletedTasks = useNotesStore(
    (state) => state.deleteCompletedTasks,
  );
  const deleteTask = useNotesStore((state) => state.deleteTask);
  const markAllTasksDone = useNotesStore((state) => state.markAllTasksDone);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const normalizedQuery = normalizeSearch(searchQuery);
  const filteredTasks = tasks.filter((task) => {
    if (!normalizedQuery) return true;

    return task.text.toLowerCase().includes(normalizedQuery);
  });

  const handleSectionAction = (action: ItemAction) => {
    if (action === "markAll") {
      markAllTasksDone();
      return;
    }

    if (action === "deleteCompleted") {
      showDeleteConfirm({
        title: "Borrar tareas completadas",
        message: "¿Seguro que quieres borrar todas las tareas completadas?",
        onConfirm: deleteCompletedTasks,
      });
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar tareas",
        message: "¿Seguro que quieres borrar todas las tareas?",
        onConfirm: deleteAllTasks,
      });
    }
  };

  const confirmDeleteTask = (id: string) => {
    showDeleteConfirm({
      title: "Borrar tarea",
      message: "¿Seguro que quieres borrar esta tarea?",
      onConfirm: () => deleteTask(id),
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredTasks}
          estimatedItemSize={160}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.title, { color: theme.text }]}>
                  Tareas
                </Text>
                <SectionActionsMenu
                  items={[
                    { action: "markAll", label: "Marcar todas como hechas" },
                    {
                      action: "deleteCompleted",
                      label: "Borrar completadas",
                      destructive: true,
                    },
                    {
                      action: "deleteAll",
                      label: "Borrar todas",
                      destructive: true,
                    },
                  ]}
                  onSelect={handleSectionAction}
                />
              </View>
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
                ? "Todavía no hay tareas."
                : "No hay resultados para esta búsqueda."}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <TaskRow
              onDelete={confirmDeleteTask}
              onPressText={(id) => router.push(`/item/${id}`)}
              onToggle={toggleTask}
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
    fontWeight: "700",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
