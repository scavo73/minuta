import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface TagSuggestionsProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  variant?: "default" | "large";
}

export function TagSuggestions({
  availableTags,
  onChange,
  selectedTags,
  variant = "default",
}: TagSuggestionsProps) {
  const { theme } = useMinutaTheme();
  const selectedKeys = new Set(selectedTags.map((tag) => tag.toLowerCase()));

  if (availableTags.length === 0) {
    return null;
  }

  const toggleTag = (tag: string) => {
    const key = tag.toLowerCase();

    if (selectedKeys.has(key)) {
      onChange(selectedTags.filter((item) => item.toLowerCase() !== key));
      return;
    }

    onChange([...selectedTags, tag]);
  };

  return (
    <View style={styles.chips}>
      {availableTags.map((tag) => {
        const isSelected = selectedKeys.has(tag.toLowerCase());

        return (
          <Pressable
            key={tag}
            accessibilityRole="button"
            onPress={() => toggleTag(tag)}
            style={[
              styles.chip,
              variant === "large" ? styles.largeChip : null,
              {
                backgroundColor: theme.chipBackground,
                borderColor: isSelected ? theme.primary : theme.border,
                opacity: isSelected ? 1 : 0.68,
              },
            ]}
          >
            <Ionicons
              color={isSelected ? theme.primary : theme.mutedText}
              name="checkmark"
              size={14}
            />
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? theme.text : theme.mutedText,
                },
              ]}
            >
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  largeChip: {
    borderRadius: 100,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
