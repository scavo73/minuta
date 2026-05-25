import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "../../constants/theme";
import type { FolderChipItem, FolderFilterId } from "../../lib/folders";
import { FolderChip } from "./FolderChip";

interface FolderChipsProps {
  folders: FolderChipItem[];
  selectedFolderId: FolderFilterId;
  onSelectFolder: (folderId: FolderFilterId) => void;
}

export function FolderChips({
  folders,
  onSelectFolder,
  selectedFolderId,
}: FolderChipsProps) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.chips}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {folders.map((folder) => (
        <FolderChip
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
