import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface FixedHeaderProps {
  actions?: ReactNode;
  title: string;
}

export function FixedHeader({ actions, title }: FixedHeaderProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {actions ? (
        <View style={styles.actions}>{actions}</View>
      ) : (
        <View style={styles.actionsPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
  },
  actionsPlaceholder: {
    height: 40,
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 40,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
});
