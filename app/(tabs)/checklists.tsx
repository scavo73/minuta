import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
import { FolderSelector } from "../../components/folders/FolderSelector";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { FoldersModal } from "../../components/folders/FoldersModal";
import { TaskRow } from "../../components/items/TaskRow";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import {
  ALL_FOLDERS_ID,
  buildFolderChips,
  NO_FOLDER_ID,
  type FolderFilterId,
  groupItemsByFolder,
  matchesFolderFilter,
} from "../../lib/folders";
import { useFoldersStore } from "../../store/foldersStore";
import { useCreateContextStore } from "../../store/createContextStore";
import { useNotesStore } from "../../store/notesStore";
import type { Task } from "../../types";

type TaskListItem =
  | {
      id: string;
      type: "section";
      count: number;
      title: string;
      variant?: "folder" | "unfiled";
    }
  | { id: string; type: "task"; task: Task };

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function ChecklistsScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [editingTaskFolderId, setEditingTaskFolderId] = useState<string | null>(
    null,
  );
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
  const addFolder = useFoldersStore((state) => state.addFolder);
  const setCreateContext = useCreateContextStore(
    (state) => state.setCreateContext,
  );
  const tasks = useNotesStore((state) => state.tasks);
  const deleteAllTasks = useNotesStore((state) => state.deleteAllTasks);
  const deleteCompletedTasks = useNotesStore(
    (state) => state.deleteCompletedTasks,
  );
  const deleteTask = useNotesStore((state) => state.deleteTask);
  const markAllTasksDone = useNotesStore((state) => state.markAllTasksDone);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const updateTask = useNotesStore((state) => state.updateTask);
  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const normalizedQuery = normalizeSearch(searchQuery);
  const folderChips = buildFolderChips(folders, {
    tasks,
    notes: notes.filter((note) => !note.isArchived),
    ideas: ideas.filter((idea) => !idea.isArchived),
  });
  const searchedTasks = tasks.filter((task) => {
    if (!normalizedQuery) return true;

    return task.text.toLowerCase().includes(normalizedQuery);
  });
  const filteredTasks =
    selectedFolderId === ALL_FOLDERS_ID
      ? searchedTasks
      : searchedTasks.filter((task) =>
          matchesFolderFilter(task, selectedFolderId),
        );
  const groupedTasks = groupItemsByFolder(searchedTasks, folders);
  const taskListData: TaskListItem[] =
    selectedFolderId === ALL_FOLDERS_ID
      ? [
          ...(groupedTasks.unfiledItems.length > 0
            ? [
                {
                  id: "section-unfiled",
                  type: "section" as const,
                  title: "Tareas sin carpeta",
                  count: groupedTasks.unfiledItems.length,
                  variant: "unfiled" as const,
                },
                ...groupedTasks.unfiledItems.map((task) => ({
                  id: task.id,
                  type: "task" as const,
                  task,
                })),
              ]
            : []),
          ...groupedTasks.folderGroups.flatMap((group) => [
            {
              id: `section-${group.folder.id}`,
              type: "section" as const,
              title: group.folder.name,
              count: group.items.length,
              variant: "folder" as const,
            },
            ...group.items.map((task) => ({
              id: task.id,
              type: "task" as const,
              task,
            })),
          ]),
        ]
      : filteredTasks.map((task) => ({
          id: task.id,
          type: "task",
          task,
        }));

  useFocusEffect(
    useCallback(() => {
      setCreateContext({
        folderId:
          selectedFolderId === ALL_FOLDERS_ID ||
          selectedFolderId === NO_FOLDER_ID
            ? null
            : selectedFolderId,
        kind: "task",
      });
    }, [selectedFolderId, setCreateContext]),
  );

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
    setEditingTaskFolderId(task.folderId ?? null);
  };

  const clearEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskText("");
    setEditingTaskFolderId(null);
  };

  const saveEditingTask = () => {
    if (editingTaskId) {
      const nextText = editingTaskText.trim();

      if (nextText) {
        updateTask(editingTaskId, {
          text: nextText,
          folderId: editingTaskFolderId,
        });
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
          data={taskListData}
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
              {editingTaskId ? (
                <FolderSelector
                  folders={folders}
                  selectedFolderId={editingTaskFolderId}
                  onChange={setEditingTaskFolderId}
                />
              ) : null}
              <FolderChips
                folders={folderChips}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
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
          scrollEnabled={!isRowSwiping}
          renderItem={({ item }) =>
            item.type === "section" ? (
              <FolderSectionHeader
                count={item.count}
                title={item.title}
                variant={item.variant}
              />
            ) : (
              <TaskRow
                editText={editingTaskText}
                isEditing={editingTaskId === item.task.id}
                onChangeEditText={setEditingTaskText}
                onDelete={handleDeleteTask}
                onPressText={startEditingTask}
                onSwipeEnd={() => setIsRowSwiping(false)}
                onSwipeStart={() => setIsRowSwiping(true)}
                onToggle={toggleTask}
                task={item.task}
              />
            )
          }
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
