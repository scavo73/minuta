import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface EmptyStateProps {
  text: string;
  title: string;
}

export function EmptyState({ text, title }: EmptyStateProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.text, { color: theme.mutedText }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  text: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: "700",
  },
});
