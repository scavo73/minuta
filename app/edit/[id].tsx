import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditItemForm } from "../../components/edit/EditItemForm";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";
import { isIdeaNote, isTask, isTextNote } from "../../types";

export default function EditItemScreen() {
  const { theme } = useMinutaTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Array.isArray(id) ? id[0] : id;
  const getItemById = useNotesStore((state) => state.getItemById);
  const updateIdea = useNotesStore((state) => state.updateIdea);
  const updateNote = useNotesStore((state) => state.updateNote);
  const item = itemId ? getItemById(itemId) : undefined;

  if (!item || isTask(item)) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.background }]}
      >
        <View style={styles.emptyContent}>
          <Text style={[styles.title, { color: theme.text }]}>
            Elemento no editable
          </Text>
          <Text style={[styles.body, { color: theme.mutedText }]}>
            Solo se pueden editar notas e ideas.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <EditItemForm
          item={item}
          kind={isTextNote(item) ? "note" : "idea"}
          onCancel={() => router.back()}
          onSave={async (values) => {
            if (values.kind === "note" && isTextNote(item)) {
              await updateNote(item.id, {
                title: values.title,
                content: values.content,
                imageUri: values.imageUri,
              });
              router.back();
              return;
            }

            if (values.kind === "idea" && isIdeaNote(item)) {
              await updateIdea(item.id, {
                title: values.title,
                tags: values.tags,
                color: values.color,
              });
              router.back();
            }
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  body: {
    fontSize: typography.body,
    lineHeight: 22,
  },
});
