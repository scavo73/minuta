import { StyleSheet, View } from "react-native";

import { spacing } from "../../constants/theme";
import type { Folder } from "../../store/foldersStore";
import { FolderChip } from "./FolderChip";

interface FolderChipsProps {
  folders: Folder[];
}

export function FolderChips({ folders }: FolderChipsProps) {
  if (folders.length === 0) {
    return null;
  }

  const visibleFolders: Folder[] = [
    {
      id: "all-folders",
      name: "Todos",
      counts: {
        tasks: 0,
        notes: 0,
        ideas: 0,
      },
      createdAt: 0,
    },
    ...folders,
  ];

  return (
    <View style={styles.chips}>
      {visibleFolders.map((folder) => (
        <FolderChip folder={folder} key={folder.id} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: 12,
  },
});
