import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { FolderChipItem, FolderChipsContext } from "../../lib/folders";

interface FolderChipProps {
  context: FolderChipsContext;
  folder: FolderChipItem;
  isSelected?: boolean;
  onPress?: () => void;
}

function getVisibleCounts(folder: FolderChipItem, context: FolderChipsContext) {
  if (context === "tasks") {
    return [{ key: "tasks" as const, count: folder.counts.tasks }];
  }

  if (context === "notes") {
    return [{ key: "notes" as const, count: folder.counts.notes }];
  }

  if (context === "ideas") {
    return [{ key: "ideas" as const, count: folder.counts.ideas }];
  }

  return [
    { key: "tasks" as const, count: folder.counts.tasks },
    { key: "notes" as const, count: folder.counts.notes },
    { key: "ideas" as const, count: folder.counts.ideas },
  ];
}

const typeIcons = {
  tasks: "checkbox-outline",
  notes: "document-text-outline",
  ideas: "bulb-outline",
} as const;

export function FolderChip({
  context,
  folder,
  isSelected = false,
  onPress,
}: FolderChipProps) {
  const { theme } = useMinutaTheme();
  const visibleCounts = getVisibleCounts(folder, context);
  const total = visibleCounts.reduce((sum, item) => sum + item.count, 0);
  const Container = onPress ? Pressable : View;
  const iconColor = isSelected ? "#FFFFFF" : theme.mutedText;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
        },
      ]}
    >
      <Ionicons color={theme.mutedText} name="folder-outline" size={15} />
      <Text
        style={[styles.name, { color: isSelected ? "#FFFFFF" : theme.text }]}
        numberOfLines={1}
      >
        {folder.name}
      </Text>
      <Text
        style={[
          styles.total,
          { color: isSelected ? "#FFFFFF" : theme.mutedText },
        ]}
      >
        {total}
      </Text>
      {visibleCounts.map((item) =>
        item.count > 0 ? (
          <View key={item.key} style={styles.typeCount}>
            <Ionicons color={iconColor} name={typeIcons[item.key]} size={13} />
            {context === "archived" ? (
              <Text style={[styles.typeCountText, { color: iconColor }]}>
                {item.count}
              </Text>
            ) : null}
          </View>
        ) : null,
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 40,
    maxWidth: 220,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontSize: typography.small,
    fontWeight: "700",
  },
  total: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  typeCount: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  typeCountText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
