import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { Folder } from "../../store/foldersStore";

interface MoveToFolderModalProps {
  folders: Folder[];
  isOpen: boolean;
  selectedFolderId: string | null;
  onClose: () => void;
  onSelectFolder: (folderId: string | null) => void;
}

export function MoveToFolderModal({
  folders,
  isOpen,
  onClose,
  onSelectFolder,
  selectedFolderId,
}: MoveToFolderModalProps) {
  const { theme } = useMinutaTheme();

  const selectFolder = (folderId: string | null) => {
    onSelectFolder(folderId);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={isOpen}
    >
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.background }]}
      >
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Cerrar mover a carpeta"
              onPress={onClose}
              style={[styles.iconButton, { backgroundColor: theme.card }]}
            >
              <Ionicons color={theme.text} name="close" size={22} />
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>
              Mover a carpeta
            </Text>
            <View style={styles.iconButtonPlaceholder} />
          </View>

          <View style={styles.folderList}>
            <FolderMoveRow
              icon="remove-circle-outline"
              isSelected={selectedFolderId == null}
              label="Sin carpeta"
              onPress={() => selectFolder(null)}
            />
            {folders.map((folder) => (
              <FolderMoveRow
                icon="folder-outline"
                isSelected={selectedFolderId === folder.id}
                key={folder.id}
                label={folder.name}
                onPress={() => selectFolder(folder.id)}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface FolderMoveRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

function FolderMoveRow({
  icon,
  isSelected,
  label,
  onPress,
}: FolderMoveRowProps) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.folderRow, { backgroundColor: theme.card }]}
    >
      <Ionicons
        color={isSelected ? theme.primary : theme.mutedText}
        name={icon}
        size={20}
      />
      <Text
        numberOfLines={1}
        style={[styles.folderName, { color: theme.text }]}
      >
        {label}
      </Text>
      {isSelected ? (
        <Ionicons color={theme.primary} name="checkmark-sharp" size={20} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: "700",
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  iconButtonPlaceholder: {
    height: 40,
    width: 40,
  },
  folderList: {
    gap: spacing.sm,
  },
  folderRow: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  folderName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
