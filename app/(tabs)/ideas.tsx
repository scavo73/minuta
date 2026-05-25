import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { ArchivedRow } from "../../components/items/ArchivedRow";
import { IdeaCard } from "../../components/items/IdeaCard";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function IdeasScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const ideas = useNotesStore((state) => state.ideas);
  const archiveAllIdeas = useNotesStore((state) => state.archiveAllIdeas);
  const archiveIdea = useNotesStore((state) => state.archiveIdea);
  const deleteAllIdeas = useNotesStore((state) => state.deleteAllIdeas);
  const deleteIdea = useNotesStore((state) => state.deleteIdea);
  const normalizedQuery = normalizeSearch(searchQuery);
  const visibleIdeas = ideas.filter((idea) => !idea.isArchived);
  const archivedIdeas = ideas.filter((idea) => idea.isArchived);
  const filteredIdeas = visibleIdeas.filter((idea) => {
    if (!normalizedQuery) return true;

    return (
      idea.title.toLowerCase().includes(normalizedQuery) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  });

  const handleSectionAction = (action: ItemAction) => {
    if (action === "archive") {
      archiveAllIdeas();
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar ideas",
        message: "¿Seguro que quieres borrar todas las ideas?",
        onConfirm: deleteAllIdeas,
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
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredIdeas}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{ disabled: true }}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.title, { color: theme.text }]}>Ideas</Text>
                <SectionActionsMenu
                  items={[
                    { action: "archive", label: "Archivar todas" },
                    {
                      action: "deleteAll",
                      label: "Borrar todas",
                      destructive: true,
                    },
                  ]}
                  onSelect={handleSectionAction}
                />
              </View>
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Buscar ideas..."
                placeholderTextColor={theme.mutedText}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                  },
                ]}
                value={searchQuery}
              />
              {archivedIdeas.length > 0 ? (
                <ArchivedRow onPress={() => router.push("/archived/ideas")} />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.mutedText }]}>
              {visibleIdeas.length === 0
                ? archivedIdeas.length > 0
                  ? "No hay ideas activas."
                  : "Todavía no hay ideas."
                : "No hay resultados para esta búsqueda."}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          scrollEnabled={!isRowSwiping}
          renderItem={({ item }) => (
            <SwipeableItemCard
              onArchive={() => archiveIdea(item.id)}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  searchInput: {
    borderRadius: 16,
    fontSize: typography.body,
    marginBottom: 12,
    marginTop: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  empty: {
    fontSize: typography.body,
    marginTop: spacing.md,
  },
  separator: {
    height: 12,
  },
});
