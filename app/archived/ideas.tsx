import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { IdeaCard } from "../../components/items/IdeaCard";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";

export default function ArchivedIdeasScreen() {
  const { theme } = useMinutaTheme();
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const ideas = useNotesStore((state) => state.ideas);
  const deleteAllArchivedIdeas = useNotesStore(
    (state) => state.deleteAllArchivedIdeas,
  );
  const deleteIdea = useNotesStore((state) => state.deleteIdea);
  const unarchiveAllIdeas = useNotesStore((state) => state.unarchiveAllIdeas);
  const unarchiveIdea = useNotesStore((state) => state.unarchiveIdea);
  const archivedIdeas = ideas.filter((idea) => idea.isArchived);
  const previousArchivedCount = useRef(archivedIdeas.length);

  useEffect(() => {
    if (previousArchivedCount.current > 0 && archivedIdeas.length === 0) {
      router.back();
      return;
    }

    previousArchivedCount.current = archivedIdeas.length;
  }, [archivedIdeas.length]);

  const handleSectionAction = (action: ItemAction) => {
    if (action === "unarchive") {
      unarchiveAllIdeas();
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar ideas archivadas",
        message: "¿Seguro que quieres borrar todas las ideas archivadas?",
        onConfirm: deleteAllArchivedIdeas,
      });
    }
  };

  const confirmDeleteIdea = (id: string) => {
    showDeleteConfirm({
      title: "Borrar idea",
      message: "¿Seguro que quieres borrar esta idea?",
      onConfirm: () => deleteIdea(id),
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <FlashList
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.backButtonText, { color: theme.text }]}>
                  Volver
                </Text>
              </Pressable>
              <SectionActionsMenu
                items={[
                  { action: "unarchive", label: "Desarchivar todas" },
                  {
                    action: "deleteAll",
                    label: "Borrar todas",
                    destructive: true,
                  },
                ]}
                onSelect={handleSectionAction}
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Ideas archivadas
            </Text>
          </View>
        }
        data={archivedIdeas}
        estimatedItemSize={140}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.mutedText }]}>
            No hay ideas archivadas.
          </Text>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        scrollEnabled={!isRowSwiping}
        renderItem={({ item }) => (
          <SwipeableItemCard
            archiveIcon="arrow-undo-outline"
            archiveLabel="Desarchivar"
            onArchive={() => unarchiveIdea(item.id)}
            onDelete={() => confirmDeleteIdea(item.id)}
            onSwipeEnd={() => setIsRowSwiping(false)}
            onSwipeStart={() => setIsRowSwiping(true)}
          >
            <IdeaCard
              idea={item}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          </SwipeableItemCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  empty: {
    fontSize: typography.body,
  },
  separator: {
    height: 12,
  },
});
