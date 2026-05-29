import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { FolderChips } from "../../components/folders/FolderChips";
import { FolderSectionHeader } from "../../components/folders/FolderSectionHeader";
import { IdeaCard } from "../../components/items/IdeaCard";
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
import type { IdeaNote } from "../../types";

type ArchivedIdeaListItem =
  | {
    id: string;
    type: "section";
    count: number;
    title: string;
    variant?: "folder" | "unfiled";
  }
  | { id: string; type: "idea"; idea: IdeaNote };

export default function ArchivedIdeasScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const [selectedFolderId, setSelectedFolderId] =
    useState<FolderFilterId>(ALL_FOLDERS_ID);
  const folders = useFoldersStore((state) => state.folders);
  const ideas = useNotesStore((state) => state.ideas);
  const fetchArchivedItems = useNotesStore((state) => state.fetchArchivedItems);
  const deleteAllArchivedIdeas = useNotesStore(
    (state) => state.deleteAllArchivedIdeas,
  );
  const deleteIdea = useNotesStore((state) => state.deleteIdea);
  const unarchiveAllIdeas = useNotesStore((state) => state.unarchiveAllIdeas);
  const unarchiveIdea = useNotesStore((state) => state.unarchiveIdea);
  const allArchivedIdeas = ideas.filter((idea) => idea.isArchived);
  const folderChips = buildFolderChips(folders, { ideas: allArchivedIdeas });
  const archivedIdeas = allArchivedIdeas.filter((idea) =>
    matchesFolderFilter(idea, selectedFolderId),
  );
  const groupedArchivedIdeas = groupItemsByFolder(allArchivedIdeas, folders);
  const emptyState = getArchivedEmptyState();
  const archivedIdeaListData: ArchivedIdeaListItem[] =
    selectedFolderId === ALL_FOLDERS_ID
      ? [
        ...(groupedArchivedIdeas.unfiledItems.length > 0
          ? [
            {
              id: "section-unfiled",
              type: "section" as const,
              title: "General",
              count: groupedArchivedIdeas.unfiledItems.length,
              variant: "unfiled" as const,
            },
            ...groupedArchivedIdeas.unfiledItems.map((idea) => ({
              id: idea.id,
              type: "idea" as const,
              idea,
            })),
          ]
          : []),
        ...groupedArchivedIdeas.folderGroups.flatMap((group) => [
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
      : archivedIdeas.map((idea) => ({
        id: idea.id,
        type: "idea",
        idea,
      }));
  const previousArchivedCount = useRef(allArchivedIdeas.length);

  useEffect(() => {
    fetchArchivedItems();
  }, [fetchArchivedItems]);

  useEffect(() => {
    if (
      selectedFolderId !== ALL_FOLDERS_ID &&
      !folders.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(ALL_FOLDERS_ID);
    }
  }, [folders, selectedFolderId]);

  useEffect(() => {
    if (previousArchivedCount.current > 0 && allArchivedIdeas.length === 0) {
      router.back();
      return;
    }

    previousArchivedCount.current = allArchivedIdeas.length;
  }, [allArchivedIdeas.length]);

  const handleSectionAction = (action: ItemAction) => {
    if (action === "unarchive") {
      if (selectedFolderId === ALL_FOLDERS_ID) {
        unarchiveAllIdeas();
        return;
      }

      archivedIdeas.forEach((idea) => unarchiveIdea(idea.id));
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar ideas archivadas",
        message: "¿Seguro que quieres borrar todas las ideas archivadas?",
        onConfirm: () => {
          if (selectedFolderId === ALL_FOLDERS_ID) {
            deleteAllArchivedIdeas();
            return;
          }

          archivedIdeas.forEach((idea) => {
            deleteIdea(idea.id);
          });
        },
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
          context="ideas"
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
      title="Ideas archivadas"
    >
      {({ onScroll }) => (
        <FlashList
          data={archivedIdeaListData}
          estimatedItemSize={140}
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
                archiveIcon="arrow-undo-outline"
                archiveLabel="Desarchivar"
                onArchive={() => unarchiveIdea(item.idea.id)}
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
