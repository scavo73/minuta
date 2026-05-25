import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { ItemActionsMenu } from "../../components/actions/ItemActionsMenu";
import type {
  ActionMenuItem,
  ItemAction,
} from "../../components/actions/actions";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";
import { isIdeaNote, isTask, isTextNote } from "../../types";

export default function ItemDetailScreen() {
  const { theme } = useMinutaTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Array.isArray(id) ? id[0] : id;
  const getItemById = useNotesStore((state) => state.getItemById);
  const archiveIdea = useNotesStore((state) => state.archiveIdea);
  const archiveNote = useNotesStore((state) => state.archiveNote);
  const convertIdeaToTask = useNotesStore((state) => state.convertIdeaToTask);
  const deleteItem = useNotesStore((state) => state.deleteItem);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const item = itemId ? getItemById(itemId) : undefined;

  const confirmDelete = () => {
    if (!itemId || !item) return;

    const label = isTextNote(item)
      ? "nota"
      : isIdeaNote(item)
        ? "idea"
        : "tarea";

    showDeleteConfirm({
      title: `Borrar ${label}`,
      message: `¿Seguro que quieres borrar esta ${label}?`,
      onConfirm: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deleteItem(itemId);
        router.back();
      },
    });
  };

  const handleToggleTask = async () => {
    if (!item || !isTask(item)) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(item.id);
  };

  const handleArchive = async () => {
    if (!item) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isTextNote(item)) {
      archiveNote(item.id);
      router.back();
      return;
    }

    if (isIdeaNote(item)) {
      archiveIdea(item.id);
      router.back();
    }
  };

  const handleDetailAction = (action: ItemAction) => {
    if (action === "edit") {
      if (itemId) {
        router.push(`/edit/${itemId}`);
      }
      return;
    }

    if (action === "archive") {
      handleArchive();
      return;
    }

    if (action === "delete") {
      confirmDelete();
      return;
    }

    if (action === "convertToTask" && item && isIdeaNote(item)) {
      convertIdeaToTask(item.id);
      Alert.alert("Idea convertida", "Se ha creado una tarea con esta idea.");
      router.back();
      return;
    }

    if (action === "extractTasks") {
      Alert.alert(
        "Extraer tareas",
        "TODO: preparar extracción de tareas desde el contenido de la nota.",
      );
    }
  };

  const detailActions: ActionMenuItem[] = item
    ? [
        { action: "edit", label: "Editar" },
        { action: "archive", label: "Archivar" },
        ...(isIdeaNote(item)
          ? [{ action: "convertToTask" as const, label: "Convertir en tarea" }]
          : []),
        ...(isTextNote(item)
          ? [{ action: "extractTasks" as const, label: "Extraer tareas" }]
          : []),
        { action: "delete", label: "Borrar", destructive: true },
      ]
    : [];

  if (!item) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.background }]}
      >
        <View style={styles.emptyContent}>
          <Text style={[styles.title, { color: theme.text }]}>
            Elemento no encontrado
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Ionicons color="#FFFFFF" name="arrow-back" size={22} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons color={theme.text} name="arrow-back" size={22} />
          </Pressable>
          {!isTask(item) ? (
            <ItemActionsMenu
              items={detailActions}
              onSelect={handleDetailAction}
            />
          ) : null}
        </View>

        {isTextNote(item) ? (
          <>
            {item.imageUri ? (
              <Image
                resizeMode="cover"
                source={{ uri: item.imageUri }}
                style={styles.image}
              />
            ) : null}
            <Text style={[styles.title, { color: theme.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.body, { color: theme.text }]}>
              {item.content}
            </Text>
          </>
        ) : null}

        {isTask(item) ? (
          <>
            <Text style={[styles.typeLabel, { color: theme.mutedText }]}>
              Tarea
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {item.text}
            </Text>
            <Text style={[styles.status, { color: theme.mutedText }]}>
              Estado: {item.isCompleted ? "Hecha" : "Pendiente"}
            </Text>
            <Pressable
              onPress={handleToggleTask}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.primaryButtonText}>
                Marcar como {item.isCompleted ? "pendiente" : "hecha"}
              </Text>
            </Pressable>
          </>
        ) : null}

        {isIdeaNote(item) ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              {item.title}
            </Text>
            <View style={styles.tags}>
              {(item.tags.length > 0 ? item.tags : ["Sin etiquetas"]).map(
                (tag) => (
                  <View
                    key={tag}
                    style={[styles.chip, { backgroundColor: theme.surface }]}
                  >
                    <Text style={[styles.chipText, { color: theme.mutedText }]}>
                      {tag}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </>
        ) : null}

        {isTask(item) ? (
          <Pressable onPress={confirmDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </Pressable>
        ) : null}
      </ScrollView>
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
    justifyContent: "space-between",
  },
  backButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  image: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    width: "100%",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  body: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  typeLabel: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  status: {
    fontSize: typography.body,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  deleteButton: {
    borderRadius: radius.md,
    borderColor: "#DC2626",
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
