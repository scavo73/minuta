import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import type { ItemAction } from "../../components/actions/actions";
import { FolderChips } from "../../components/folders/FolderChips";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { TaskRow } from "../../components/items/TaskRow";
import { EmptyState } from "../../components/layout/EmptyState";
import { MainScreenLayout } from "../../components/layout/MainScreenLayout";
import { radius, spacing } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import {
  ALL_FOLDERS_ID,
  buildFolderChips,
  type FolderFilterId,
  groupItemsByFolder,
  matchesFolderFilter,
} from "../../lib/folders";
import { getArchivedEmptyState } from "../../lib/emptyStates";
import { useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";
import type { Task } from "../../types";

type ArchivedTaskListItem =
  | {
      id: string;
      type: "section";
      count: number;
      title: string;
      variant?: "folder" | "unfiled";
    }
  | { id: string; type: "task"; task: Task };

export default function ArchivedTasksScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
  const tasks = useNotesStore((state) => state.tasks);
  const deleteAllArchivedTasks = useNotesStore(
    (state) => state.deleteAllArchivedTasks,
  );
  const deleteTask = useNotesStore((state) => state.deleteTask);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const unarchiveTask = useNotesStore((state) => state.unarchiveTask);
  const allArchivedTasks = tasks.filter((task) => task.isArchived);
  const folderChips = buildFolderChips(folders, { tasks: allArchivedTasks });
  const archivedTasks = allArchivedTasks.filter((task) =>
    matchesFolderFilter(task, selectedFolderId),
  );
  const groupedArchivedTasks = groupItemsByFolder(allArchivedTasks, folders);
  const emptyState = getArchivedEmptyState();
  const archivedTaskListData: ArchivedTaskListItem[] =
    selectedFolderId === ALL_FOLDERS_ID
      ? [
          ...(groupedArchivedTasks.unfiledItems.length > 0
            ? [
                {
                  id: "section-unfiled",
                  type: "section" as const,
                  title: "General",
                  count: groupedArchivedTasks.unfiledItems.length,
                  variant: "unfiled" as const,
                },
                ...groupedArchivedTasks.unfiledItems.map((task) => ({
                  id: task.id,
                  type: "task" as const,
                  task,
                })),
              ]
            : []),
          ...groupedArchivedTasks.folderGroups.flatMap((group) => [
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
      : archivedTasks.map((task) => ({
          id: task.id,
          type: "task",
          task,
        }));
  const previousArchivedCount = useRef(allArchivedTasks.length);

  useEffect(() => {
    if (
      selectedFolderId !== ALL_FOLDERS_ID &&
      !folders.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(ALL_FOLDERS_ID);
    }
  }, [folders, selectedFolderId]);

  useEffect(() => {
    if (previousArchivedCount.current > 0 && allArchivedTasks.length === 0) {
      router.back();
      return;
    }

    previousArchivedCount.current = allArchivedTasks.length;
  }, [allArchivedTasks.length]);

  const handleSectionAction = (action: ItemAction) => {
    if (action === "unarchive") {
      archivedTasks.forEach((task) => unarchiveTask(task.id));
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar tareas archivadas",
        message: "¿Seguro que quieres borrar todas las tareas archivadas?",
        onConfirm: () => {
          if (selectedFolderId === ALL_FOLDERS_ID) {
            deleteAllArchivedTasks();
            return;
          }

          archivedTasks.forEach((task) => {
            deleteTask(task.id);
          });
        },
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
    <MainScreenLayout
      actions={
        <SectionActionsMenu
          items={[
            { action: "unarchive", label: "Desarchivar todas" },
            {
              action: "deleteAll",
              label: "Borrar todas",
              destructive: true,
            },
          ]}
          onSelect={handleSectionAction}
        />
      }
      centerHeaderTitle
      chips={
        <FolderChips
          context="tasks"
          folders={folderChips}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
        />
      }
      leadingAction={
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons color={theme.text} name="arrow-back" size={22} />
        </Pressable>
      }
      title="Tareas archivadas"
    >
      {({ onScroll }) => (
        <FlashList
          data={archivedTaskListData}
          estimatedItemSize={96}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState title={emptyState.title} text={emptyState.text} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
          onScroll={onScroll}
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
              <TaskRow
                archiveIcon="arrow-undo-outline"
                onArchive={unarchiveTask}
                onDelete={confirmDeleteTask}
                onPressText={() => undefined}
                onSwipeEnd={() => setIsRowSwiping(false)}
                onSwipeStart={() => setIsRowSwiping(true)}
                onToggle={toggleTask}
                task={item.task}
              />
            )
          }
        />
      )}
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  separator: {
    height: 12,
  },
});
