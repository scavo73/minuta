import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { Folder } from "../../store/foldersStore";

interface FoldersModalProps {
  folders: Folder[];
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
}

export function FoldersModal({
  folders,
  isOpen,
  onClose,
  onCreateFolder,
}: FoldersModalProps) {
  const { theme } = useMinutaTheme();
  const [folderName, setFolderName] = useState("");

  const createFolder = () => {
    const nextName = folderName.trim();

    if (!nextName) return;

    onCreateFolder(nextName);
    setFolderName("");
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Cerrar carpetas"
                onPress={onClose}
                style={[styles.iconButton, { backgroundColor: theme.surface }]}
              >
                <Ionicons color={theme.text} name="close" size={22} />
              </Pressable>
              <Text style={[styles.title, { color: theme.text }]}>
                Carpetas
              </Text>
              <Pressable
                accessibilityLabel="Guardar carpeta"
                onPress={createFolder}
                style={[styles.iconButton, { backgroundColor: "#22C55E" }]}
              >
                <Ionicons color="#FFFFFF" name="checkmark" size={22} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <TextInput
                onChangeText={setFolderName}
                onSubmitEditing={createFolder}
                placeholder="Nueva carpeta"
                placeholderTextColor={theme.mutedText}
                returnKeyType="done"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.mutedText,
                    color: theme.text,
                  },
                ]}
                value={folderName}
              />
            </View>

            {folders.length > 0 ? (
              <View style={styles.folderList}>
                {folders.map((folder) => (
                  <Pressable
                    key={folder.id}
                    onPress={() => {
                      onClose();
                      router.push(`/folder/${folder.id}`);
                    }}
                    style={[
                      styles.folderRow,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Ionicons
                      color={theme.mutedText}
                      name="folder-outline"
                      size={20}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.folderName, { color: theme.text }]}
                    >
                      {folder.name}
                    </Text>
                    <Ionicons
                      color={theme.mutedText}
                      name="chevron-forward"
                      size={18}
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={[styles.empty, { color: theme.mutedText }]}>
                Aún no hay carpetas.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
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
  form: {
    gap: spacing.sm,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: typography.body,
    padding: spacing.md,
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
  empty: {
    fontSize: typography.body,
  },
});
