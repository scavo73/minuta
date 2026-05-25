import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { FolderChipItem } from "../../lib/folders";

interface FolderChipProps {
  folder: FolderChipItem;
  isSelected?: boolean;
  onPress?: () => void;
}

export function FolderChip({
  folder,
  isSelected = false,
  onPress,
}: FolderChipProps) {
  const { theme } = useMinutaTheme();
  const total = folder.counts.tasks + folder.counts.notes + folder.counts.ideas;
  const Container = onPress ? Pressable : View;

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
      {folder.counts.tasks > 0 ? (
        <Ionicons
          color={isSelected ? "#FFFFFF" : theme.mutedText}
          name="checkbox-outline"
          size={13}
        />
      ) : null}
      {folder.counts.notes > 0 ? (
        <Ionicons
          color={isSelected ? "#FFFFFF" : theme.mutedText}
          name="document-text-outline"
          size={13}
        />
      ) : null}
      {folder.counts.ideas > 0 ? (
        <Ionicons
          color={isSelected ? "#FFFFFF" : theme.mutedText}
          name="bulb-outline"
          size={13}
        />
      ) : null}
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
});
