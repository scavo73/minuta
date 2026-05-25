import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { FolderChips } from "../../components/folders/FolderChips";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { NoteCard } from "../../components/items/NoteCard";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import {
  ALL_FOLDERS_ID,
  buildFolderChips,
  type FolderFilterId,
  groupItemsByFolder,
  matchesFolderFilter,
} from "../../lib/folders";
import { useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";
import type { Note } from "../../types";

type ArchivedNoteListItem =
  | {
      id: string;
      type: "section";
      count: number;
      title: string;
      variant?: "folder" | "unfiled";
    }
  | { id: string; type: "note"; note: Note };

export default function ArchivedNotesScreen() {
  const { theme } = useMinutaTheme();
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
  const notes = useNotesStore((state) => state.notes);
  const deleteAllArchivedNotes = useNotesStore(
    (state) => state.deleteAllArchivedNotes,
  );
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const unarchiveAllNotes = useNotesStore((state) => state.unarchiveAllNotes);
  const unarchiveNote = useNotesStore((state) => state.unarchiveNote);
  const allArchivedNotes = notes.filter((note) => note.isArchived);
  const folderChips = buildFolderChips(folders, { notes: allArchivedNotes });
  const archivedNotes = allArchivedNotes.filter((note) =>
    matchesFolderFilter(note, selectedFolderId),
  );
  const groupedArchivedNotes = groupItemsByFolder(allArchivedNotes, folders);
  const archivedNoteListData: ArchivedNoteListItem[] =
    selectedFolderId === ALL_FOLDERS_ID
      ? [
          ...(groupedArchivedNotes.unfiledItems.length > 0
            ? [
                {
                  id: "section-unfiled",
                  type: "section" as const,
                  title: "Notas sin carpeta",
                  count: groupedArchivedNotes.unfiledItems.length,
                  variant: "unfiled" as const,
                },
                ...groupedArchivedNotes.unfiledItems.map((note) => ({
                  id: note.id,
                  type: "note" as const,
                  note,
                })),
              ]
            : []),
          ...groupedArchivedNotes.folderGroups.flatMap((group) => [
            {
              id: `section-${group.folder.id}`,
              type: "section" as const,
              title: group.folder.name,
              count: group.items.length,
              variant: "folder" as const,
            },
            ...group.items.map((note) => ({
              id: note.id,
              type: "note" as const,
              note,
            })),
          ]),
        ]
      : archivedNotes.map((note) => ({
          id: note.id,
          type: "note",
          note,
        }));
  const previousArchivedCount = useRef(allArchivedNotes.length);

  useEffect(() => {
    if (previousArchivedCount.current > 0 && allArchivedNotes.length === 0) {
      router.back();
      return;
    }

    previousArchivedCount.current = allArchivedNotes.length;
  }, [allArchivedNotes.length]);

  const handleSectionAction = (action: ItemAction) => {
    if (action === "unarchive") {
      if (selectedFolderId === ALL_FOLDERS_ID) {
        unarchiveAllNotes();
        return;
      }

      archivedNotes.forEach((note) => unarchiveNote(note.id));
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar notas archivadas",
        message: "¿Seguro que quieres borrar todas las notas archivadas?",
        onConfirm: () => {
          if (selectedFolderId === ALL_FOLDERS_ID) {
            deleteAllArchivedNotes();
            return;
          }

          archivedNotes.forEach((note) => {
            deleteNote(note.id);
          });
        },
      });
    }
  };

  const confirmDeleteNote = (id: string) => {
    showDeleteConfirm({
      title: "Borrar nota",
      message: "¿Seguro que quieres borrar esta nota?",
      onConfirm: () => deleteNote(id),
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <FlashList
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.surface }]}
              >
                <Ionicons color={theme.text} name="arrow-back" size={22} />
              </Pressable>
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
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Notas archivadas
            </Text>
            <FolderChips
              folders={folderChips}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
            />
          </View>
        }
        data={archivedNoteListData}
        estimatedItemSize={140}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.mutedText }]}>
            No hay notas archivadas.
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
            <SwipeableItemCard
              archiveIcon="arrow-undo-outline"
              archiveLabel="Desarchivar"
              onArchive={() => unarchiveNote(item.note.id)}
              onDelete={() => confirmDeleteNote(item.note.id)}
              onSwipeEnd={() => setIsRowSwiping(false)}
              onSwipeStart={() => setIsRowSwiping(true)}
            >
              <NoteCard
                note={item.note}
                onPress={() => router.push(`/item/${item.note.id}`)}
              />
            </SwipeableItemCard>
          )
        }
      />
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
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  empty: {
    fontSize: typography.body,
  },
  separator: {
    height: 12,
  },
});
