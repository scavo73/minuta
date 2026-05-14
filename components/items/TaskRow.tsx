import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { Task } from "../../types";

interface TaskRowProps {
  task: Task;
  onDelete: (id: string) => void;
  onPressText: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TaskRow({
  onDelete,
  onPressText,
  onToggle,
  task,
}: TaskRowProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.taskCard }]}>
      <Pressable
        accessibilityLabel={
          task.isCompleted ? "Marcar como pendiente" : "Marcar como hecha"
        }
        onPress={() => onToggle(task.id)}
        style={[
          styles.checkbox,
          {
            backgroundColor: task.isCompleted ? theme.primary : "transparent",
            borderColor: task.isCompleted ? theme.primary : theme.mutedText,
          },
        ]}
      >
        {task.isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
      </Pressable>

      <Pressable onPress={() => onPressText(task.id)} style={styles.textButton}>
        <Text
          numberOfLines={3}
          style={[
            styles.text,
            {
              color: theme.text,
              textDecorationLine: task.isCompleted ? "line-through" : "none",
            },
          ]}
        >
          {task.text}
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel="Borrar tarea"
        onPress={() => onDelete(task.id)}
        style={[styles.deleteButton, { backgroundColor: theme.surface }]}
      >
        <Ionicons color="#DC2626" name="trash-outline" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  checkbox: {
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  textButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  text: {
    fontSize: typography.subtitle,
    fontWeight: "700",
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
