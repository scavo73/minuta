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
import { calculateFolderCounts } from "../../lib/folders";
import type { Folder } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";

interface FoldersModalProps {
  archivedFolders?: Folder[];
  folders: Folder[];
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
}

export function FoldersModal({
  archivedFolders = [],
  folders,
  isOpen,
  onClose,
  onCreateFolder,
}: FoldersModalProps) {
  const { theme } = useMinutaTheme();
  const [folderName, setFolderName] = useState("");
  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const tasks = useNotesStore((state) => state.tasks);
  const hasFolderNameDraft = folderName.trim().length > 0;

  const createFolder = () => {
    const nextName = folderName.trim();

    if (!nextName) return;

    onCreateFolder(nextName);
    setFolderName("");
  };

  const getFolderCounts = (folderId: string) =>
    calculateFolderCounts(folderId, { ideas, notes, tasks });

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
                style={[styles.iconButton, { backgroundColor: theme.card }]}
              >
                <Ionicons color={theme.text} name="close" size={22} />
              </Pressable>
              <Text style={[styles.title, { color: theme.text }]}>
                Carpetas
              </Text>
              {hasFolderNameDraft ? (
                <Pressable
                  accessibilityLabel="Guardar carpeta"
                  onPress={createFolder}
                  style={[styles.iconButton, { backgroundColor: "#22C55E" }]}
                >
                  <Ionicons color="#FFFFFF" name="checkmark" size={22} />
                </Pressable>
              ) : (
                <View style={styles.iconButtonPlaceholder} />
              )}
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
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={folderName}
              />
            </View>

            {archivedFolders.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver carpetas archivadas"
                onPress={() => {
                  onClose();
                  router.push("/archived/carpetas");
                }}
                style={[
                  styles.folderRow,
                  { backgroundColor: theme.card },
                ]}
              >
                <Ionicons
                  color={theme.mutedText}
                  name="archive-outline"
                  size={20}
                />
                <Text style={[styles.folderName, { color: theme.text }]}>
                  Ver carpetas archivadas
                </Text>
                <Ionicons
                  color={theme.mutedText}
                  name="chevron-forward"
                  size={18}
                />
              </Pressable>
            ) : null}

            {folders.length > 0 ? (
              <View style={styles.folderList}>
                {folders.map((folder) => {
                  const counts = getFolderCounts(folder.id);
                  const total = counts.tasks + counts.notes + counts.ideas;

                  return (
                    <Pressable
                      key={folder.id}
                      onPress={() => {
                        onClose();
                        router.push(`/folder/${folder.id}`);
                      }}
                      style={[
                        styles.folderRow,
                        { backgroundColor: theme.card },
                      ]}
                    >
                      <Ionicons
                        color={theme.mutedText}
                        name="folder-outline"
                        size={20}
                      />
                      <View style={styles.folderTextBlock}>
                        <View style={styles.folderTitleRow}>
                          <Text
                            numberOfLines={1}
                            style={[styles.folderName, { color: theme.text }]}
                          >
                            {folder.name}
                          </Text>
                          {total > 0 ? (
                            <View style={styles.folderMeta}>
                              <Text
                                style={[
                                  styles.folderMetaCount,
                                  { color: theme.mutedText },
                                ]}
                              >
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
                      <Ionicons
                        color={theme.mutedText}
                        name="chevron-forward"
                        size={18}
                      />
                    </Pressable>
                  );
                })}
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
  iconButtonPlaceholder: {
    height: 40,
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
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: "700",
  },
  folderTextBlock: {
    flex: 1,
  },
  folderTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
  empty: {
    fontSize: typography.body,
  },
});
