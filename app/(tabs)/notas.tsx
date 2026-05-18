import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { NoteCard } from "../../components/items/NoteCard";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function NotasScreen() {
  const { theme } = useMinutaTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const notes = useNotesStore((state) => state.notes);
  const archiveNote = useNotesStore((state) => state.archiveNote);
  const archiveAllNotes = useNotesStore((state) => state.archiveAllNotes);
  const deleteAllNotes = useNotesStore((state) => state.deleteAllNotes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const normalizedQuery = normalizeSearch(searchQuery);
  const visibleNotes = notes.filter((note) => !note.isArchived);
  const filteredNotes = visibleNotes.filter((note) => {
    if (!normalizedQuery) return true;

    return (
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.content.toLowerCase().includes(normalizedQuery)
    );
  });

  const handleSectionAction = (action: ItemAction) => {
    if (action === "archive") {
      archiveAllNotes();
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar notas",
        message: "¿Seguro que quieres borrar todas las notas?",
        onConfirm: deleteAllNotes,
      });
    }
  };

  const confirmDeleteNote = (id: string) => {
    showDeleteConfirm({
      title: "Borrar nota",
      message: "¿Seguro que quieres borrar esta nota?",
      onConfirm: () => deleteNote(id),
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.listWrapper}>
        <FlashList
          data={filteredNotes}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{ disabled: true }}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.title, { color: theme.text }]}>Notas</Text>
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
                placeholder="Buscar notas..."
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
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.mutedText }]}>
              {visibleNotes.length === 0
                ? "Todavía no hay notas."
                : "No hay resultados para esta búsqueda."}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          scrollEnabled={!isRowSwiping}
          renderItem={({ item }) => (
            <SwipeableItemCard
              onArchive={() => archiveNote(item.id)}
              onDelete={() => confirmDeleteNote(item.id)}
              onSwipeEnd={() => setIsRowSwiping(false)}
              onSwipeStart={() => setIsRowSwiping(true)}
            >
              <NoteCard
                note={item}
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
