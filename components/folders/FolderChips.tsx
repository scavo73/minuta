import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "../../constants/theme";
import {
  ALL_FOLDERS_ID,
  type FolderChipItem,
  type FolderChipsContext,
  type FolderFilterId,
} from "../../lib/folders";
import { FolderChip } from "./FolderChip";

interface FolderChipsProps {
  context: FolderChipsContext;
  folders: FolderChipItem[];
  selectedFolderId: FolderFilterId;
  onSelectFolder: (folderId: FolderFilterId) => void;
}

function getContextTotal(folder: FolderChipItem, context: FolderChipsContext) {
  if (context === "tasks") return folder.counts.tasks;
  if (context === "notes") return folder.counts.notes;
  if (context === "ideas") return folder.counts.ideas;

  return folder.counts.tasks + folder.counts.notes + folder.counts.ideas;
}

export function FolderChips({
  context,
  folders,
  onSelectFolder,
  selectedFolderId,
}: FolderChipsProps) {
  const visibleFolders = folders.filter(
    (folder) =>
      folder.id === ALL_FOLDERS_ID ||
      folder.id === selectedFolderId ||
      getContextTotal(folder, context) > 0,
  );

  if (visibleFolders.length === 0) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.chips}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {visibleFolders.map((folder) => (
        <FolderChip
          context={context}
          folder={folder}
          isSelected={selectedFolderId === folder.id}
          key={folder.id}
          onPress={() => onSelectFolder(folder.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: 12,
  },
});
