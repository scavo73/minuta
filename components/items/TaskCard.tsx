import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onToggle?: (id: string) => void;
  onPress?: () => void;
}

export function TaskCard({ onPress, task, onToggle }: TaskCardProps) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }

        onToggle?.(task.id);
      }}
      style={[styles.card, { backgroundColor: theme.taskCard }]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: task.isCompleted ? theme.primary : 'transparent',
              borderColor: task.isCompleted ? theme.primary : theme.mutedText,
            },
          ]}
        >
          {task.isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <View style={styles.content}>
          <Text style={[styles.label, { color: theme.mutedText }]}>
            {task.isCompleted ? 'Hecha' : 'Pendiente'}
          </Text>
          <Text
            style={[
              styles.text,
              {
                color: theme.text,
                textDecorationLine: task.isCompleted ? 'line-through' : 'none',
              },
            ]}
          >
            {task.text}
          </Text>
          <Text style={[styles.date, { color: theme.mutedText }]}>
            {task.updatedAt.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    marginTop: 2,
    width: 28,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  date: {
    fontSize: typography.small,
    marginTop: spacing.sm,
  },
});
