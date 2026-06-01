import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import type { ItemAction } from "../../components/actions/actions";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { calculateFolderCounts } from "../../lib/folders";
import {
  archiveFolder,
  deleteFolderIdeas,
  deleteFolderNotes,
  deleteFolderOnly,
  deleteFolderTasks,
  deleteFolderWithContent,
  unarchiveFolder,
  updateFolderName,
} from "../../lib/foldersService";
import { useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";

type FolderAction =
  | "archiveFolder"
  | "editFolder"
  | "deleteFolder"
  | "unarchive"
  | "deleteFolderContent"
  | "deleteFolderTasks"
  | "deleteFolderNotes"
  | "deleteFolderIdeas";

const folderActionItems = [
  { action: "editFolder", label: "Editar nombre" },
  { action: "archiveFolder", label: "Archivar" },
  { action: "deleteFolder", label: "Borrar carpeta", destructive: true },
  { action: "deleteFolderTasks", label: "Borrar tareas", destructive: true },
  { action: "deleteFolderNotes", label: "Borrar notas", destructive: true },
  { action: "deleteFolderIdeas", label: "Borrar ideas", destructive: true },
  { action: "deleteFolderContent", label: "Borrar todo", destructive: true },
] as const;

const archivedFolderActionItems = [
  { action: "unarchive", label: "Desarchivar" },
  { action: "deleteFolder", label: "Borrar carpeta", destructive: true },
] as const;

export default function FolderDetailScreen() {
  const { theme } = useMinutaTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = Array.isArray(id) ? id[0] : id;
  const folders = useFoldersStore((state) => state.folders);
  const archivedFolders = useFoldersStore((state) => state.archivedFolders);
  const notes = useNotesStore((state) => state.notes);
  const ideas = useNotesStore((state) => state.ideas);
  const tasks = useNotesStore((state) => state.tasks);
  const activeFolder = folders.find((item) => item.id === folderId);
  const archivedFolder = archivedFolders.find((item) => item.id === folderId);
  const folder = activeFolder ?? archivedFolder;
  const isArchivedFolder = archivedFolder != null;
  const [isEditingName, setIsEditingName] = useState(false);
  const [folderName, setFolderName] = useState(folder?.name ?? "");

  if (!folder || !folderId) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.background }]}
      >
        <View style={styles.emptyContent}>
          <Text style={[styles.title, { color: theme.text }]}>
            Carpeta no encontrada
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: theme.card }]}
          >
            <Ionicons color={theme.text} name="arrow-back" size={22} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const counts = calculateFolderCounts(folder.id, { ideas, notes, tasks });
  const total = counts.tasks + counts.notes + counts.ideas;

  const removeFolderOnly = async () => {
    await deleteFolderOnly(folder.id);
    router.back();
  };

  const removeFolderWithContent = async () => {
    await deleteFolderWithContent(folder.id);
    router.back();
  };

  const archiveCurrentFolder = async () => {
    await archiveFolder(folder.id);
    router.back();
  };

  const unarchiveCurrentFolder = async () => {
    await unarchiveFolder(folder.id);
  };

  const handleAction = (action: ItemAction) => {
    const folderAction = action as FolderAction;

    if (folderAction === "editFolder") {
      if (isArchivedFolder) return;

      setFolderName(folder.name);
      setIsEditingName(true);
      return;
    }

    if (folderAction === "deleteFolder") {
      showDeleteConfirm({
        title: "Borrar carpeta",
        message:
          "Eliminar esta carpeta no borrará sus tareas, notas ni ideas. Los items pasarán a Sin carpeta.",
        onConfirm: removeFolderOnly,
      });
      return;
    }

    if (folderAction === "unarchive") {
      unarchiveCurrentFolder();
      return;
    }

    if (folderAction === "archiveFolder") {
      if (isArchivedFolder) return;

      archiveCurrentFolder();
      return;
    }

    if (folderAction === "deleteFolderContent") {
      showDeleteConfirm({
        title: "Borrar todo",
        message:
          "Esto eliminará la carpeta y todas las tareas, notas e ideas dentro. Esta acción no se puede deshacer.",
        onConfirm: removeFolderWithContent,
      });
      return;
    }

    if (folderAction === "deleteFolderTasks") {
      showDeleteConfirm({
        title: "Borrar tareas",
        message:
          "Esto eliminará todas las tareas de esta carpeta. Esta acción no se puede deshacer.",
        onConfirm: () => deleteFolderTasks(folder.id),
      });
      return;
    }

    if (folderAction === "deleteFolderNotes") {
      showDeleteConfirm({
        title: "Borrar notas",
        message:
          "Esto eliminará todas las notas de esta carpeta. Esta acción no se puede deshacer.",
        onConfirm: () => deleteFolderNotes(folder.id),
      });
      return;
    }

    if (folderAction === "deleteFolderIdeas") {
      showDeleteConfirm({
        title: "Borrar ideas",
        message:
          "Esto eliminará todas las ideas de esta carpeta. Esta acción no se puede deshacer.",
        onConfirm: () => deleteFolderIdeas(folder.id),
      });
    }
  };

  const saveFolderName = () => {
    updateFolderName(folder.id, folderName);
    setIsEditingName(false);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: theme.card }]}
          >
            <Ionicons color={theme.text} name="arrow-back" size={22} />
          </Pressable>
          <Text
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.text }]}
          >
            {folder.name}
          </Text>
          <SectionActionsMenu
            items={
              (isArchivedFolder
                ? archivedFolderActionItems
                : folderActionItems) as unknown as {
                action: ItemAction;
                label: string;
                destructive?: boolean;
              }[]
            }
            onSelect={handleAction}
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{folder.name}</Text>

        <View style={[styles.summary, { backgroundColor: theme.card }]}>
          <View style={styles.summaryRow}>
            <Ionicons color={theme.mutedText} name="folder-outline" size={20} />
            <Text style={[styles.summaryText, { color: theme.text }]}>
              Total
            </Text>
            <Text style={[styles.summaryCount, { color: theme.mutedText }]}>
              {total}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons
              color={theme.mutedText}
              name="checkbox-outline"
              size={20}
            />
            <Text style={[styles.summaryText, { color: theme.text }]}>
              Tareas
            </Text>
            <Text style={[styles.summaryCount, { color: theme.mutedText }]}>
              {counts.tasks}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons
              color={theme.mutedText}
              name="document-text-outline"
              size={20}
            />
            <Text style={[styles.summaryText, { color: theme.text }]}>
              Notas
            </Text>
            <Text style={[styles.summaryCount, { color: theme.mutedText }]}>
              {counts.notes}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons color={theme.mutedText} name="bulb-outline" size={20} />
            <Text style={[styles.summaryText, { color: theme.text }]}>
              Ideas
            </Text>
            <Text style={[styles.summaryCount, { color: theme.mutedText }]}>
              {counts.ideas}
            </Text>
          </View>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={isEditingName}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: theme.modalBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Editar nombre
            </Text>
            <TextInput
              autoFocus
              onChangeText={setFolderName}
              placeholder="Nombre de carpeta"
              placeholderTextColor={theme.mutedText}
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
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsEditingName(false)}
                style={[
                  styles.secondaryButton,
                  { backgroundColor: theme.card },
                ]}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: theme.text }]}
                >
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={saveFolderName}
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.primaryText },
                  ]}
                >
                  Guardar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  emptyContent: {
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  summary: {
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 36,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
  },
  summaryCount: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
  modal: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    width: "100%",
  },
  modalTitle: {
    fontSize: typography.subtitle,
    fontWeight: "700",
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: typography.body,
    padding: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryButton: {
    borderRadius: radius.md,
    flex: 1,
    padding: spacing.md,
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryButton: {
    borderRadius: radius.md,
    flex: 1,
    padding: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
