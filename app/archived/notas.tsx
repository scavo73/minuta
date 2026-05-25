import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showDeleteConfirm } from "../../components/actions/DeleteConfirmDialog";
import { SectionActionsMenu } from "../../components/actions/SectionActionsMenu";
import { SwipeableItemCard } from "../../components/actions/SwipeableItemCard";
import type { ItemAction } from "../../components/actions/actions";
import { NoteCard } from "../../components/items/NoteCard";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { useNotesStore } from "../../store/notesStore";

export default function ArchivedNotesScreen() {
  const { theme } = useMinutaTheme();
  const [isRowSwiping, setIsRowSwiping] = useState(false);
  const notes = useNotesStore((state) => state.notes);
  const deleteAllArchivedNotes = useNotesStore(
    (state) => state.deleteAllArchivedNotes,
  );
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const unarchiveAllNotes = useNotesStore((state) => state.unarchiveAllNotes);
  const unarchiveNote = useNotesStore((state) => state.unarchiveNote);
  const archivedNotes = notes.filter((note) => note.isArchived);
  const previousArchivedCount = useRef(archivedNotes.length);

  useEffect(() => {
    if (previousArchivedCount.current > 0 && archivedNotes.length === 0) {
      router.back();
      return;
    }

    previousArchivedCount.current = archivedNotes.length;
  }, [archivedNotes.length]);

  const handleSectionAction = (action: ItemAction) => {
    if (action === "unarchive") {
      unarchiveAllNotes();
      return;
    }

    if (action === "deleteAll") {
      showDeleteConfirm({
        title: "Borrar notas archivadas",
        message: "¿Seguro que quieres borrar todas las notas archivadas?",
        onConfirm: deleteAllArchivedNotes,
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
              Notas archivadas
            </Text>
          </View>
        }
        data={archivedNotes}
        estimatedItemSize={140}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.mutedText }]}>
            No hay notas archivadas.
          </Text>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        scrollEnabled={!isRowSwiping}
        renderItem={({ item }) => (
          <SwipeableItemCard
            archiveIcon="arrow-undo-outline"
            archiveLabel="Desarchivar"
            onArchive={() => unarchiveNote(item.id)}
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
