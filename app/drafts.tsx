import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { radius, spacing, typography } from "../constants/theme";
import { useMinutaTheme } from "../constants/useMinutaTheme";
import { useDraftsStore, type ItemDraft } from "../store/draftsStore";

const kindLabels = {
  note: "Nota",
  task: "Tarea",
  idea: "Idea",
} as const;

const kindIcons = {
  note: "document-text-outline",
  task: "checkbox-outline",
  idea: "bulb-outline",
} as const;

function getDraftPreview(draft: ItemDraft) {
  if (draft.kind === "note") {
    const values = draft.values;

    return values.title.trim() || values.content.trim() || "Nota sin titulo";
  }

  if (draft.kind === "task") {
    const values = draft.values;
    const firstTask = values.taskRows.find((row) => row.text.trim().length > 0);

    return firstTask?.text.trim() || "Tarea sin texto";
  }

  const values = draft.values;

  return values.title.trim() || values.tags.join(", ") || "Idea sin titulo";
}

function DraftRow({ draft }: { draft: ItemDraft }) {
  const { theme } = useMinutaTheme();
  const date = new Date(draft.updatedAt).toLocaleDateString();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar borrador ${kindLabels[draft.kind]}`}
      onPress={() =>
        router.push({
          pathname: "/new-item",
          params: {
            draftId: draft.id,
            kind: draft.kind,
            mode: "locked",
          },
        })
      }
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
        <Ionicons
          color={theme.primary}
          name={kindIcons[draft.kind]}
          size={22}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.kind, { color: theme.mutedText }]}>
          {kindLabels[draft.kind]}
        </Text>
        <Text numberOfLines={1} style={[styles.preview, { color: theme.text }]}>
          {getDraftPreview(draft)}
        </Text>
      </View>
      <Text style={[styles.date, { color: theme.mutedText }]}>{date}</Text>
    </Pressable>
  );
}

export default function DraftsScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const drafts = useDraftsStore((state) => state.drafts);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={[styles.headerButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons color={theme.text} name="arrow-back" size={22} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Borradores</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <FlashList
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.md,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
        }}
        data={drafts}
        estimatedItemSize={72}
        keyExtractor={(draft) => draft.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No hay borradores
            </Text>
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>
              Los items guardados como borrador apareceran aqui.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <DraftRow draft={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  date: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  empty: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.body,
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerButtonPlaceholder: {
    height: 40,
    width: 40,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  kind: {
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  preview: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  row: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  screen: {
    flex: 1,
  },
  separator: {
    height: spacing.sm,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
