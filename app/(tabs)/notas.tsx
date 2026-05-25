import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { FolderButton } from "../../components/folders/FolderButton";
import { FolderChips } from "../../components/folders/FolderChips";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { FoldersModal } from "../../components/folders/FoldersModal";
import { ArchivedRow } from "../../components/items/ArchivedRow";
import { NoteCard } from "../../components/items/NoteCard";
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
import { createFolder } from "../../lib/foldersService";
import { useFoldersStore } from "../../store/foldersStore";
import { useCreateContextStore } from "../../store/createContextStore";
import { useNotesStore } from "../../store/notesStore";
import type { Note } from "../../types";

type NoteListItem =
  | {
      id: string;
      type: "section";
      count: number;
      title: string;
      variant?: "folder" | "unfiled";
    }
  | { id: string; type: "note"; note: Note };

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function NotasScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
  const setCreateContext = useCreateContextStore(
    (state) => state.setCreateContext,
  );
  const notes = useNotesStore((state) => state.notes);
  const archiveNote = useNotesStore((state) => state.archiveNote);
  const archiveAllNotes = useNotesStore((state) => state.archiveAllNotes);
  const deleteAllNotes = useNotesStore((state) => state.deleteAllNotes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const tasks = useNotesStore((state) => state.tasks);
  const ideas = useNotesStore((state) => state.ideas);
  const normalizedQuery = normalizeSearch(searchQuery);
  const visibleNotes = notes.filter((note) => !note.isArchived);
  const archivedNotes = notes.filter((note) => note.isArchived);
  const folderChips = buildFolderChips(folders, {
    tasks,
    notes: visibleNotes,
    ideas: ideas.filter((idea) => !idea.isArchived),
  });
  const searchedNotes = visibleNotes.filter((note) => {
    if (!normalizedQuery) return true;

    return (
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.content.toLowerCase().includes(normalizedQuery)
    );
  });
  const filteredNotes =
    selectedFolderId === ALL_FOLDERS_ID
      ? searchedNotes
      : searchedNotes.filter((note) =>
          matchesFolderFilter(note, selectedFolderId),
        );
  const groupedNotes = groupItemsByFolder(searchedNotes, folders);
  const noteListData: NoteListItem[] =
    selectedFolderId === ALL_FOLDERS_ID
      ? [
          ...(groupedNotes.unfiledItems.length > 0
            ? [
                {
                  id: "section-unfiled",
                  type: "section" as const,
                  title: "Notas sin carpeta",
                  count: groupedNotes.unfiledItems.length,
                  variant: "unfiled" as const,
                },
                ...groupedNotes.unfiledItems.map((note) => ({
                  id: note.id,
                  type: "note" as const,
                  note,
                })),
              ]
            : []),
          ...groupedNotes.folderGroups.flatMap((group) => [
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
      : filteredNotes.map((note) => ({
          id: note.id,
          type: "note",
          note,
        }));

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
        kind: "note",
      });
    }, [selectedFolderId, setCreateContext]),
  );

  const handleSelectFolder = (folderId: FolderFilterId) => {
    setSelectedFolderId(folderId);
    setCreateContext({
      folderId:
        folderId === ALL_FOLDERS_ID || folderId === NO_FOLDER_ID
          ? null
          : folderId,
      kind: "note",
    });
  };

  const handleSectionAction = (action: ItemAction) => {
    if (action === "archive") {
      archiveAllNotes();
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar notas",
        message: "¿Seguro que quieres borrar todas las notas?",
        onConfirm: deleteAllNotes,
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
      <View style={styles.listWrapper}>
        <FlashList
          data={noteListData}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{ disabled: true }}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.title, { color: theme.text }]}>Notas</Text>
                <View style={styles.headerActions}>
                  <FolderButton onPress={() => setIsFoldersModalOpen(true)} />
                  <SectionActionsMenu
                    items={[
                      { action: "archive", label: "Archivar todas" },
                      {
                        action: "deleteAll",
                        label: "Borrar todas",
                        destructive: true,
                      },
                    ]}
                    onSelect={handleSectionAction}
                  />
                </View>
              </View>
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
              <FolderChips
                folders={folderChips}
                selectedFolderId={selectedFolderId}
                onSelectFolder={handleSelectFolder}
              />
              {archivedNotes.length > 0 ? (
                <ArchivedRow onPress={() => router.push("/archived/notas")} />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.mutedText }]}>
              {visibleNotes.length === 0
                ? archivedNotes.length > 0
                  ? "No hay notas activas."
                  : "Todavía no hay notas."
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
              <SwipeableItemCard
                onArchive={() => archiveNote(item.note.id)}
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
      </View>
      <FoldersModal
        folders={folders}
        isOpen={isFoldersModalOpen}
        onClose={() => setIsFoldersModalOpen(false)}
        onCreateFolder={createFolder}
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
