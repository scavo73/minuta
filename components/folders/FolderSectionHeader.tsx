import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface FolderSectionHeaderProps {
  count: number;
  title: string;
  variant?: "folder" | "unfiled";
}

export function FolderSectionHeader({
  count,
  title,
  variant = "folder",
}: FolderSectionHeaderProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.header}>
      {variant === "folder" ? (
        <Ionicons color={theme.mutedText} name="folder-outline" size={18} />
      ) : null}
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.count, { color: theme.mutedText }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: "700",
  },
  count: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
