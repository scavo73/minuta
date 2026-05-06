import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import { useNotesStore } from '../../store/notesStore';
import { isIdeaNote, isTask, isTextNote } from '../../types';

export default function ItemDetailScreen() {
  const { theme } = useMinutaTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Array.isArray(id) ? id[0] : id;
  const getItemById = useNotesStore((state) => state.getItemById);
  const deleteItem = useNotesStore((state) => state.deleteItem);
  const toggleTask = useNotesStore((state) => state.toggleTask);
  const item = itemId ? getItemById(itemId) : undefined;

  const confirmDelete = () => {
    if (!itemId) return;

    Alert.alert('Eliminar elemento', 'Esta acción no se puede deshacer.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          deleteItem(itemId);
          router.back();
        },
      },
    ]);
  };

  const handleToggleTask = async () => {
    if (!item || !isTask(item)) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(item.id);
  };

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
            <Text style={styles.primaryButtonText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.backButtonText, { color: theme.text }]}>
              Volver
            </Text>
          </Pressable>
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
              Estado: {item.isCompleted ? 'Hecha' : 'Pendiente'}
            </Text>
            <Pressable
              onPress={handleToggleTask}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.primaryButtonText}>
                Marcar como {item.isCompleted ? 'pendiente' : 'hecha'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {isIdeaNote(item) ? (
          <>
            <View
              style={[
                styles.colorBlock,
                { backgroundColor: item.color || theme.ideaCard },
              ]}
            />
            <Text style={[styles.title, { color: theme.text }]}>
              {item.title}
            </Text>
            <View style={styles.tags}>
              {(item.tags.length > 0 ? item.tags : ['Sin etiquetas']).map(
                (tag) => (
                  <View
                    key={tag}
                    style={[styles.chip, { backgroundColor: theme.surface }]}
                  >
                    <Text style={[styles.chipText, { color: theme.mutedText }]}>
                      {tag}
                    </Text>
                  </View>
                )
              )}
            </View>
          </>
        ) : null}

        <Pressable onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </Pressable>
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
    justifyContent: 'center',
    padding: spacing.md,
  },
  topBar: {
    alignItems: 'flex-start',
  },
  backButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  image: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    width: '100%',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  body: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  typeLabel: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  status: {
    fontSize: typography.body,
  },
  primaryButton: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  colorBlock: {
    borderRadius: radius.lg,
    height: 120,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: radius.md,
    borderColor: '#DC2626',
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
