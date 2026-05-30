import { FlashList } from "@shopify/flash-list";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { FolderButton } from "../../components/folders/FolderButton";
import { FolderChips } from "../../components/folders/FolderChips";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { FoldersModal } from "../../components/folders/FoldersModal";
import { ArchivedRow } from "../../components/items/ArchivedRow";
import { IdeaCard } from "../../components/items/IdeaCard";
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
import type { IdeaNote } from "../../types";

type IdeaListItem =
  | {
      id: string;
      type: "section";
      count: number;
      title: string;
      variant?: "folder" | "unfiled";
    }
  | { id: string; type: "idea"; idea: IdeaNote };

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function IdeasScreen() {
  const bottomTabBarHeight = useBottomTabBarHeight();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [isFoldersModalOpen, setIsFoldersModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
  const archivedFolders = useFoldersStore((state) => state.archivedFolders);
  const fetchFolders = useFoldersStore((state) => state.fetchFolders);
  const setCreateContext = useCreateContextStore(
    (state) => state.setCreateContext,
  );
  const ideas = useNotesStore((state) => state.ideas);
  const archiveAllIdeas = useNotesStore((state) => state.archiveAllIdeas);
  const archiveIdea = useNotesStore((state) => state.archiveIdea);
  const deleteAllIdeas = useNotesStore((state) => state.deleteAllIdeas);
  const deleteIdea = useNotesStore((state) => state.deleteIdea);
  const tasks = useNotesStore((state) => state.tasks);
  const notes = useNotesStore((state) => state.notes);
  const fetchItems = useNotesStore((state) => state.fetchItems);
  const normalizedQuery = normalizeSearch(searchQuery);
  const visibleIdeas = ideas.filter((idea) => !idea.isArchived);
  const archivedIdeas = ideas.filter((idea) => idea.isArchived);
  const emptyState = getListEmptyState({
    hasAnyItems: visibleIdeas.length > 0,
    searchQuery,
    selectedFolderId,
    type: "ideas",
  });
  const folderChips = buildFolderChips(folders, {
    tasks,
    notes: notes.filter((note) => !note.isArchived),
    ideas: visibleIdeas,
  });
  const searchedIdeas = visibleIdeas.filter((idea) => {
    if (!normalizedQuery) return true;

    return (
      idea.title.toLowerCase().includes(normalizedQuery) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  });
  const filteredIdeas =
    selectedFolderId === ALL_FOLDERS_ID
      ? searchedIdeas
      : searchedIdeas.filter((idea) =>
          matchesFolderFilter(idea, selectedFolderId),
        );
  const groupedIdeas = groupItemsByFolder(searchedIdeas, folders);
  const ideaListData: IdeaListItem[] =
    selectedFolderId === ALL_FOLDERS_ID
      ? [
          ...(groupedIdeas.unfiledItems.length > 0
            ? [
                {
                  id: "section-unfiled",
                  type: "section" as const,
                  title: "General",
                  count: groupedIdeas.unfiledItems.length,
                  variant: "unfiled" as const,
                },
                ...groupedIdeas.unfiledItems.map((idea) => ({
                  id: idea.id,
                  type: "idea" as const,
                  idea,
                })),
              ]
            : []),
          ...groupedIdeas.folderGroups.flatMap((group) => [
            {
              id: `section-${group.folder.id}`,
              type: "section" as const,
              title: group.folder.name,
              count: group.items.length,
              variant: "folder" as const,
            },
            ...group.items.map((idea) => ({
              id: idea.id,
              type: "idea" as const,
              idea,
            })),
          ]),
        ]
      : filteredIdeas.map((idea) => ({
          id: idea.id,
          type: "idea",
          idea,
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
        kind: "idea",
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
      kind: "idea",
    });
  };

  const handleSectionAction = (action: ItemAction) => {
    if (action === "archive") {
      archiveAllIdeas();
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar ideas",
        message: "¿Seguro que quieres borrar todas las ideas?",
        onConfirm: deleteAllIdeas,
      });
    }
  };

  const confirmDeleteIdea = (id: string) => {
    showDeleteConfirm({
      title: "Borrar idea",
      message: "¿Seguro que quieres borrar esta idea?",
      onConfirm: () => deleteIdea(id),
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([fetchItems(), fetchFolders()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <MainScreenLayout
        actions={
          <>
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
          </>
        }
        chips={
          <FolderChips
            context="ideas"
            folders={folderChips}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
          />
        }
        searchPlaceholder="Buscar ideas..."
        searchValue={searchQuery}
        title="Ideas"
        onSearchChange={setSearchQuery}
      >
        {({ onScroll }) => (
          <FlashList
            data={ideaListData}
            estimatedItemSize={140}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ disabled: true }}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                {archivedIdeas.length > 0 ? (
                  <ArchivedRow onPress={() => router.push("/archived/ideas")} />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <EmptyState title={emptyState.title} text={emptyState.text} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: bottomTabBarHeight + spacing.md },
            ]}
            onScroll={onScroll}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }
            scrollEventThrottle={16}
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
                  onArchive={() => archiveIdea(item.idea.id)}
                  onDelete={() => confirmDeleteIdea(item.idea.id)}
                  onSwipeEnd={() => setIsRowSwiping(false)}
                  onSwipeStart={() => setIsRowSwiping(true)}
                >
                  <IdeaCard
                    idea={item.idea}
                    onPress={() => router.push(`/item/${item.idea.id}`)}
                  />
                </SwipeableItemCard>
              )
            }
          />
        )}
      </MainScreenLayout>
      <FoldersModal
        archivedFolders={archivedFolders}
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
    gap: spacing.md,
  },
  separator: {
    height: 12,
  },
});
