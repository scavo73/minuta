import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import type { ItemAction } from "../../components/actions/actions";
import { EmptyState } from "../../components/layout/EmptyState";
import { MainScreenLayout } from "../../components/layout/MainScreenLayout";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { calculateFolderCounts } from "../../lib/folders";
import { deleteFolderOnly, unarchiveFolder } from "../../lib/foldersService";
import { type Folder, useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";

export default function ArchivedFoldersScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const archivedFolders = useFoldersStore((state) => state.archivedFolders);
  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const tasks = useNotesStore((state) => state.tasks);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const previousArchivedCount = useRef(archivedFolders.length);

  useEffect(() => {
    if (previousArchivedCount.current > 0 && archivedFolders.length === 0) {
      router.back();
      return;
    }
    previousArchivedCount.current = archivedFolders.length;
  }, [archivedFolders.length]);

  const fetchArchivedFolders = useFoldersStore(
    (state) => state.fetchArchivedFolders,
  );

  useEffect(() => {
    fetchArchivedFolders();
  }, [fetchArchivedFolders]);

  const toggleFolderSelection = (folderId: string) => {
    setSelectedFolderIds((currentIds) =>
      currentIds.includes(folderId)
        ? currentIds.filter((id) => id !== folderId)
        : [...currentIds, folderId],
    );
  };

  const getFolderCounts = (folderId: string) =>
    calculateFolderCounts(folderId, { ideas, notes, tasks });

  const selectAllFolders = () => {
    setIsSelecting(true);
    setSelectedFolderIds(archivedFolders.map((folder) => folder.id));
  };

  const unarchiveSelectedFolders = async () => {
    await Promise.all(selectedFolderIds.map((folderId) => unarchiveFolder(folderId)));
    setSelectedFolderIds([]);
    setIsSelecting(false);
  };

  const deleteSelectedFolders = () => {
    showDeleteConfirm({
      title: "Borrar carpetas archivadas",
      message:
        "Eliminar estas carpetas no borrará sus tareas, notas ni ideas. Los items pasarán a Sin carpeta.",
      onConfirm: async () => {
        await Promise.all(
          selectedFolderIds.map((folderId) => deleteFolderOnly(folderId)),
        );
        setSelectedFolderIds([]);
        setIsSelecting(false);
      },
    });
  };

  const handleAction = (action: ItemAction) => {
    if (action === "select") {
      setIsSelecting((value) => !value);
      setSelectedFolderIds([]);
      return;
    }

    if (action === "selectAll") {
      selectAllFolders();
      return;
    }

    if (action === "unarchive") {
      unarchiveSelectedFolders();
      return;
    }

    if (action === "deleteAll") {
      deleteSelectedFolders();
    }
  };

  const menuItems = [
    { action: "select" as const, label: isSelecting ? "Cancelar selección" : "Seleccionar" },
    { action: "selectAll" as const, label: "Seleccionar todas" },
    ...(selectedFolderIds.length > 0
      ? [
        { action: "unarchive" as const, label: "Desarchivar seleccionadas" },
        {
          action: "deleteAll" as const,
          label: "Borrar seleccionadas",
          destructive: true,
        },
      ]
      : []),
  ];

  const renderFolderCard = (folder: Folder) => {
    const isSelected = selectedFolderIds.includes(folder.id);
    const counts = getFolderCounts(folder.id);
    const total = counts.tasks + counts.notes + counts.ideas;

    return (
      <Pressable
        accessibilityRole="button"
        key={folder.id}
        onPress={() => {
          if (isSelecting) {
            toggleFolderSelection(folder.id);
            return;
          }

          router.push(`/folder/${folder.id}`);
        }}
        style={[
          styles.folderRow,
          {
            backgroundColor: theme.surface,
            borderColor: isSelected ? theme.primary : "transparent",
          },
        ]}
      >
        {isSelecting ? (
          <View
            style={[
              styles.selectionBadge,
              {
                backgroundColor: isSelected ? theme.primary : theme.background,
                borderColor: isSelected ? theme.primary : theme.mutedText,
              },
            ]}
          >
            {isSelected ? (
              <Ionicons color="#FFFFFF" name="checkmark" size={14} />
            ) : null}
          </View>
        ) : null}
        <Ionicons color={theme.mutedText} name="folder-outline" size={20} />
        <View style={styles.folderTextBlock}>
          <View style={styles.folderTitleRow}>
            <Text numberOfLines={1} style={[styles.folderTitle, { color: theme.text }]}>
              {folder.name}
            </Text>
            {total > 0 ? (
              <View style={styles.folderMeta}>
                <Text style={[styles.folderMetaCount, { color: theme.mutedText }]}>
                  {total}
                </Text>
                <View style={styles.folderMetaIcons}>
                  {counts.tasks > 0 ? (
                    <Ionicons
                      color={theme.mutedText}
                      name="checkbox-outline"
                      size={15}
                    />
                  ) : null}
                  {counts.notes > 0 ? (
                    <Ionicons
                      color={theme.mutedText}
                      name="document-text-outline"
                      size={15}
                    />
                  ) : null}
                  {counts.ideas > 0 ? (
                    <Ionicons
                      color={theme.mutedText}
                      name="bulb-outline"
                      size={15}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </View>
        {!isSelecting ? (
          <Ionicons color={theme.mutedText} name="chevron-forward" size={18} />
        ) : null}
      </Pressable>
    );
  };

  return (
    <MainScreenLayout
      actions={
        <SectionActionsMenu items={menuItems} onSelect={handleAction} />
      }
      centerHeaderTitle
      compactHeader
      leadingAction={
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons color={theme.text} name="arrow-back" size={22} />
        </Pressable>
      }
      title="Carpetas archivadas"
    >
      {({ onScroll }) => (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {archivedFolders.length === 0 ? (
            <EmptyState
              title="Sin carpetas archivadas"
              text="Cuando archives carpetas, aparecerán aquí."
            />
          ) : (
            <View style={styles.folderList}>
              {archivedFolders.map((folder) => renderFolderCard(folder))}
            </View>
          )}
        </ScrollView>
      )}
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  folderList: {
    gap: spacing.md,
  },
  folderRow: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "relative",
  },
  folderTextBlock: {
    flex: 1,
  },
  folderTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  folderTitle: {
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: "700",
  },
  folderMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  folderMetaCount: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  folderMetaIcons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  selectionBadge: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: 24,
  },
});
