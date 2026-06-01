import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface FixedHeaderProps {
  actions?: ReactNode;
  centerTitle?: boolean;
  leadingAction?: ReactNode;
  title: string;
}

export function FixedHeader({
  actions,
  centerTitle = false,
  leadingAction,
  title,
}: FixedHeaderProps) {
  const { theme } = useMinutaTheme();

  if (centerTitle) {
    return (
      <View style={[styles.header, styles.centeredHeader]}>
        <View style={styles.leading}>
          {leadingAction ?? <View style={styles.actionsPlaceholder} />}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.centeredTitle, { color: theme.text }]}
        >
          {title}
        </Text>
        <View style={styles.trailing}>
          {actions ? (
            <View style={styles.actions}>{actions}</View>
          ) : (
            <View style={styles.actionsPlaceholder} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        {leadingAction ? (
          <View style={styles.inlineLeading}>{leadingAction}</View>
        ) : null}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
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
  centeredHeader: {
    justifyContent: "center",
    position: "relative",
  },
  centeredTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    maxWidth: "62%",
    textAlign: "center",
  },
  leading: {
    left: 0,
    position: "absolute",
  },
  inlineLeading: {
    flexShrink: 0,
  },
  trailing: {
    position: "absolute",
    right: 0,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  titleBlock: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
});
