import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import type { ItemAction } from "../../components/actions/actions";
import { FolderButton } from "../../components/folders/FolderButton";
import { FolderChips } from "../../components/folders/FolderChips";
import { FolderSelector } from "../../components/folders/FolderSelector";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { FoldersModal } from "../../components/folders/FoldersModal";
import { TaskRow } from "../../components/items/TaskRow";
import { EmptyState } from "../../components/layout/EmptyState";
import { MainScreenLayout } from "../../components/layout/MainScreenLayout";
import { spacing } from "../../constants/theme";
import {
  ALL_FOLDERS_ID,
  buildFolderChips,
  NO_FOLDER_ID,
  type FolderFilterId,
  groupItemsByFolder,
  matchesFolderFilter,
} from "../../lib/folders";
import { getListEmptyState } from "../../lib/emptyStates";
import { createFolder } from "../../lib/foldersService";
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
  const bottomTabBarHeight = useBottomTabBarHeight();
  const listRef = useRef<FlashListRef<TaskListItem>>(null);
  const currentScrollY = useRef(0);
  const taskLayouts = useRef(new Map<string, { height: number; y: number }>());
  const [searchQuery, setSearchQuery] = useState("");
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [editingTaskFolderId, setEditingTaskFolderId] = useState<string | null>(
    null,
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
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
  const emptyState = getListEmptyState({
    hasAnyItems: tasks.length > 0,
    searchQuery,
    selectedFolderId,
    type: "tasks",
  });
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
                  title: "General",
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
  const displayedTaskListData = editingTaskId
    ? taskListData.filter(
        (item) => item.type === "task" && item.task.id === editingTaskId,
      )
    : taskListData;

  const ensureEditingTaskVisible = useCallback(() => {
    if (!editingTaskId) return;

    const layout = taskLayouts.current.get(editingTaskId);

    if (!layout || listHeight <= 0) {
      const editingIndex = displayedTaskListData.findIndex(
        (item) => item.type === "task" && item.task.id === editingTaskId,
      );

      if (editingIndex < 0) return;

      void listRef.current
        ?.scrollToIndex({
          animated: true,
          index: editingIndex,
          viewPosition: 0.28,
        })
        .catch(() => undefined);
      return;
    }

    const margin = spacing.xl;
    const keyboardInset = editingTaskId ? keyboardHeight : 0;
    const visibleTop = currentScrollY.current + margin;
    const visibleBottom =
      currentScrollY.current + listHeight - keyboardInset - margin;
    const rowTop = layout.y;
    const rowBottom = layout.y + layout.height;

    if (rowBottom > visibleBottom) {
      const nextOffset = Math.max(
        0,
        rowBottom - (listHeight - keyboardInset - margin),
      );

      listRef.current?.scrollToOffset({
        animated: true,
        offset: nextOffset,
      });
      return;
    }

    if (rowTop < visibleTop) {
      listRef.current?.scrollToOffset({
        animated: true,
        offset: Math.max(0, rowTop - margin),
      });
    }
  }, [displayedTaskListData, editingTaskId, keyboardHeight, listHeight]);

  const handleListScroll = useCallback(
    (
      event: NativeSyntheticEvent<NativeScrollEvent>,
      onLayoutScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    ) => {
      currentScrollY.current = event.nativeEvent.contentOffset.y;
      onLayoutScroll(event);
    },
    [],
  );

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
        kind: "task",
      });
    }, [selectedFolderId, setCreateContext]),
  );

  useEffect(() => {
    if (!editingTaskId) return;

    const timers = [
      setTimeout(ensureEditingTaskVisible, 60),
      setTimeout(ensureEditingTaskVisible, 220),
      setTimeout(ensureEditingTaskVisible, 480),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [editingTaskId, ensureEditingTaskVisible]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);

      if (editingTaskId) {
        setTimeout(ensureEditingTaskVisible, 80);
        setTimeout(ensureEditingTaskVisible, 260);
      }
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [editingTaskId, ensureEditingTaskVisible]);

  useEffect(() => {
    if (!editingTaskId) return;

    const timer = setTimeout(ensureEditingTaskVisible, 80);

    return () => clearTimeout(timer);
  }, [editingTaskId, keyboardHeight, ensureEditingTaskVisible]);

  const handleSelectFolder = (folderId: FolderFilterId) => {
    setSelectedFolderId(folderId);
    setCreateContext({
      folderId:
        folderId === ALL_FOLDERS_ID || folderId === NO_FOLDER_ID
          ? null
          : folderId,
      kind: "task",
    });
  };

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
    <>
      <MainScreenLayout
        actions={
          <>
            <FolderButton onPress={() => setIsFoldersModalOpen(true)} />
            {editingTaskId ? (
              <Pressable
                accessibilityLabel="Guardar tarea"
                onPress={saveEditingTask}
                style={[styles.saveButton, { backgroundColor: "#22C55E" }]}
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
          </>
        }
        chips={
          <FolderChips
            context="tasks"
            folders={folderChips}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
          />
        }
        searchPlaceholder="Buscar tareas..."
        searchValue={searchQuery}
        title="Tareas"
        compactHeader={editingTaskId != null}
        onSearchChange={setSearchQuery}
      >
        {({ onScroll }) => (
          <FlashList
            ref={listRef}
            data={displayedTaskListData}
            estimatedItemSize={160}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.id}
            maintainVisibleContentPosition={{ disabled: true }}
            onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
            ListHeaderComponent={
              editingTaskId ? (
                <View style={styles.listHeader}>
                  <FolderSelector
                    folders={folders}
                    selectedFolderId={editingTaskFolderId}
                    onChange={setEditingTaskFolderId}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState title={emptyState.title} text={emptyState.text} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom:
                  bottomTabBarHeight +
                  spacing.md +
                  (editingTaskId ? keyboardHeight + spacing.xl : 0),
              },
            ]}
            onScroll={(event) => handleListScroll(event, onScroll)}
            scrollEnabled={!isRowSwiping}
            scrollEventThrottle={16}
            renderItem={({ item }) =>
              item.type === "section" ? (
                <FolderSectionHeader
                  count={item.count}
                  title={item.title}
                  variant={item.variant}
                />
              ) : (
                <View
                  onLayout={(event) => {
                    taskLayouts.current.set(item.task.id, {
                      height: event.nativeEvent.layout.height,
                      y: event.nativeEvent.layout.y,
                    });

                    if (editingTaskId === item.task.id) {
                      setTimeout(ensureEditingTaskVisible, 40);
                    }
                  }}
                >
                  <TaskRow
                    editText={editingTaskText}
                    isEditing={editingTaskId === item.task.id}
                    onChangeEditText={setEditingTaskText}
                    onDelete={handleDeleteTask}
                    onEditingFocus={ensureEditingTaskVisible}
                    onPressText={startEditingTask}
                    onSwipeEnd={() => setIsRowSwiping(false)}
                    onSwipeStart={() => setIsRowSwiping(true)}
                    onToggle={toggleTask}
                    task={item.task}
                  />
                </View>
              )
            }
          />
        )}
      </MainScreenLayout>
      <FoldersModal
        folders={folders}
        isOpen={isFoldersModalOpen}
        onClose={() => setIsFoldersModalOpen(false)}
        onCreateFolder={createFolder}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  separator: {
    height: 12,
  },
});
