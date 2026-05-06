import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import type { Task } from '../../types';

interface HomeTasksWidgetProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export function HomeTasksWidget({
  tasks,
  onToggleTask,
}: HomeTasksWidgetProps) {
  const { theme } = useMinutaTheme();
  const pendingTasks = tasks.filter((task) => !task.isCompleted);
  const visibleTasks = tasks.slice(0, 3);
  const subtitle =
    pendingTasks.length > 0
      ? `Hoy tienes ${pendingTasks.length} tareas pendientes`
      : 'No tienes tareas pendientes';

  return (
    <View style={[styles.widget, { backgroundColor: theme.taskCard }]}>
      <Text style={[styles.title, { color: theme.text }]}>Tareas</Text>
      <Text style={[styles.subtitle, { color: theme.mutedText }]}>
        {subtitle}
      </Text>

      <View style={styles.rows}>
        {visibleTasks.length === 0 ? (
          <View style={[styles.emptyRow, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>
              Sin tareas por ahora
            </Text>
          </View>
        ) : (
          visibleTasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => onToggleTask(task.id)}
              style={[styles.taskRow, { backgroundColor: theme.surface }]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: task.isCompleted
                      ? theme.primary
                      : 'transparent',
                    borderColor: task.isCompleted
                      ? theme.primary
                      : theme.mutedText,
                  },
                ]}
              >
                {task.isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>
              <Text
                numberOfLines={2}
                style={[
                  styles.taskText,
                  {
                    color: theme.text,
                    textDecorationLine: task.isCompleted
                      ? 'line-through'
                      : 'none',
                  },
                ]}
              >
                {task.text}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  rows: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  taskRow: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '700',
  },
  taskText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
  },
  emptyRow: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: typography.body,
  },
});
