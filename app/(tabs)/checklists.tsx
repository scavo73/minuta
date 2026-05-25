import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import type { ItemAction } from "../../components/actions/actions";
import { FolderButton } from "../../components/folders/FolderButton";
import { FolderChips } from "../../components/folders/FolderChips";
import { FoldersModal } from "../../components/folders/FoldersModal";
import { TaskRow } from "../../components/items/TaskRow";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";
import type { Task } from "../../types";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function ChecklistsScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const folders = useFoldersStore((state) => state.folders);
  const addFolder = useFoldersStore((state) => state.addFolder);
  const tasks = useNotesStore((state) => state.tasks);
  const deleteAllTasks = useNotesStore((state) => state.deleteAllTasks);
  const deleteCompletedTasks = useNotesStore(
    (state) => state.deleteCompletedTasks,
  );
  const deleteTask = useNotesStore((state) => state.deleteTask);
  const markAllTasksDone = useNotesStore((state) => state.markAllTasksDone);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const updateTask = useNotesStore((state) => state.updateTask);
  const normalizedQuery = normalizeSearch(searchQuery);
  const filteredTasks = tasks.filter((task) => {
    if (!normalizedQuery) return true;

    return task.text.toLowerCase().includes(normalizedQuery);
  });

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const clearEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const saveEditingTask = () => {
    if (editingTaskId) {
      const nextText = editingTaskText.trim();

      if (nextText) {
        updateTask(editingTaskId, { text: nextText });
      }
    }

    clearEditingTask();
    Keyboard.dismiss();
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);

    if (editingTaskId === id) {
      clearEditingTask();
    }
  };

  const handleSectionAction = (action: ItemAction) => {
    if (action === "markAll") {
      markAllTasksDone();
      return;
    }

    if (action === "deleteCompleted") {
      showDeleteConfirm({
        title: "Borrar tareas completadas",
        message: "¿Seguro que quieres borrar todas las tareas completadas?",
        onConfirm: () => {
          deleteCompletedTasks();
          clearEditingTask();
        },
      });
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar tareas",
        message: "¿Seguro que quieres borrar todas las tareas?",
        onConfirm: () => {
          deleteAllTasks();
          clearEditingTask();
        },
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredTasks}
          estimatedItemSize={160}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{ disabled: true }}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.title, { color: theme.text }]}>
                  Tareas
                </Text>
                <View style={styles.headerActions}>
                  <FolderButton onPress={() => setIsFoldersModalOpen(true)} />
                  {editingTaskId ? (
                    <Pressable
                      accessibilityLabel="Guardar tarea"
                      onPress={saveEditingTask}
                      style={[
                        styles.saveButton,
                        { backgroundColor: "#22C55E" },
                      ]}
                    >
                      <Ionicons color="#FFFFFF" name="checkmark" size={22} />
                    </Pressable>
                  ) : (
                    <SectionActionsMenu
                      items={[
                        {
                          action: "markAll",
                          label: "Marcar todas como hechas",
                        },
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
                  )}
                </View>
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
              <FolderChips folders={folders} />
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
          scrollEnabled={!isRowSwiping}
          renderItem={({ item }) => (
            <TaskRow
              editText={editingTaskText}
              isEditing={editingTaskId === item.id}
              onChangeEditText={setEditingTaskText}
              onDelete={handleDeleteTask}
              onPressText={startEditingTask}
              onSwipeEnd={() => setIsRowSwiping(false)}
              onSwipeStart={() => setIsRowSwiping(true)}
              onToggle={toggleTask}
              task={item}
            />
          )}
        />
      </View>
      <FoldersModal
        folders={folders}
        isOpen={isFoldersModalOpen}
        onClose={() => setIsFoldersModalOpen(false)}
        onCreateFolder={addFolder}
      />
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
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    width: 40,
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
