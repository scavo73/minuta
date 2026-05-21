import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import type { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  variant?: 'default' | 'home';
  onPress?: () => void;
}

export function NoteCard({ note, onPress, variant = 'default' }: NoteCardProps) {
  const { theme } = useMinutaTheme();
  const isHome = variant === 'home';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        isHome ? styles.homeCard : null,
        { backgroundColor: theme.noteCard || theme.surface },
      ]}
    >
      {note.imageUri ? (
        <Image
          resizeMode="cover"
          source={{ uri: note.imageUri }}
          style={[styles.noteImage, isHome ? styles.homeImage : null]}
        />
      ) : null}
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.primary }]}>Nota</Text>
        <Text style={[styles.date, { color: theme.mutedText }]}>
          {note.updatedAt.toLocaleDateString()}
        </Text>
      </View>
      <Text
        numberOfLines={isHome ? 2 : undefined}
        style={[
          styles.title,
          isHome ? styles.homeTitle : null,
          { color: theme.text },
        ]}
      >
        {note.title}
      </Text>
      <Text
        numberOfLines={isHome ? 5 : 2}
        style={[
          styles.preview,
          isHome ? styles.homePreview : null,
          { color: theme.mutedText },
        ]}
      >
        {note.content}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  homeCard: {
    padding: spacing.md,
  },
  noteImage: {
    borderRadius: radius.md,
    height: 160,
    marginBottom: spacing.sm,
    width: '100%',
  },
  homeImage: {
    aspectRatio: 1,
    borderRadius: radius.md,
    height: undefined,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '700',
  },
  date: {
    fontSize: typography.small,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  homeTitle: {
    fontSize: typography.body,
  },
  preview: {
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  homePreview: {
    fontSize: typography.small,
    lineHeight: 18,
  },
});
