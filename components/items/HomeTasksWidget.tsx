import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { radius, spacing, typography } from '../../constants/theme';
import { useMinutaTheme } from '../../constants/useMinutaTheme';
import type { Task } from '../../types';

interface HomeTasksWidgetProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

interface HomeTaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
}

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function HomeTaskRow({ onComplete, task }: HomeTaskRowProps) {
  const { theme } = useMinutaTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const isCompleting = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const completeTask = () => {
    if (isCompleting.current) return;

    isCompleting.current = true;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -10,
        duration: 170,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onComplete(task.id);
    });
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={completeTask}
        style={[styles.taskRow, { backgroundColor: theme.surface }]}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: 'transparent',
              borderColor: theme.mutedText,
            },
          ]}
        />
        <Text
          numberOfLines={2}
          style={[
            styles.taskText,
            {
              color: theme.text,
              textDecorationLine: 'none',
            },
          ]}
        >
          {task.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function HomeTasksWidget({
  tasks,
  onToggleTask,
}: HomeTasksWidgetProps) {
  const { theme } = useMinutaTheme();
  const pendingTasks = tasks.filter((task) => !task.isCompleted);
  const visibleTasks = pendingTasks.slice(0, 3);
  const hasMoreTasks = pendingTasks.length > visibleTasks.length;
  const subtitle =
    pendingTasks.length > 0
      ? `Tienes ${pendingTasks.length} tareas pendientes`
      : 'No tienes tareas pendientes';

  return (
    <View style={[styles.widget, { backgroundColor: theme.taskCard }]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>Tareas</Text>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            {subtitle}
          </Text>
        </View>

        {hasMoreTasks ? (
          <Pressable
            accessibilityLabel="Ver todas las tareas"
            onPress={() => router.push('/checklists')}
            style={[styles.moreButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              color={theme.text}
              name="arrow-forward"
              size={20}
              style={styles.moreIcon}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.rows}>
        {visibleTasks.length === 0 ? (
          <View style={[styles.emptyRow, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>
              Sin tareas por ahora
            </Text>
          </View>
        ) : (
          visibleTasks.map((task) => (
            <HomeTaskRow
              key={task.id}
              onComplete={onToggleTask}
              task={task}
            />
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
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  heading: {
    flex: 1,
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
  moreButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  moreIcon: {
    transform: [{ rotate: '40deg' }],
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
