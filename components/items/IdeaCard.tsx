import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { IdeaNote } from "../../types";

interface IdeaCardProps {
  idea: IdeaNote;
  variant?: "default" | "home";
  onPress?: () => void;
}

export function IdeaCard({
  idea,
  onPress,
  variant = "default",
}: IdeaCardProps) {
  const { theme } = useMinutaTheme();
  const tags = idea.tags.length > 0 ? idea.tags : ["Sin etiquetas"];
  const isHome = variant === "home";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        isHome ? styles.homeCard : null,
        { backgroundColor: idea.color || theme.ideaCard },
      ]}
    >
      <View style={styles.header}>
        <Ionicons color={theme.ideaText} name="bulb-outline" size={18} />
        <Text style={[styles.date, { color: theme.ideaText }]}>
          {idea.updatedAt.toLocaleDateString()}
        </Text>
      </View>
      <Text
        numberOfLines={isHome ? 3 : undefined}
        style={[
          styles.title,
          isHome ? styles.homeTitle : null,
          { color: theme.ideaText },
        ]}
      >
        {idea.title}
      </Text>
      <View style={[styles.tags, isHome ? styles.homeTags : null]}>
        {tags.map((tag) => (
          <View
            key={tag}
            style={[styles.chip, { backgroundColor: theme.chipBackground }]}
          >
            <Text style={[styles.chipText, { color: theme.mutedText }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  homeCard: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: typography.small,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  homeTitle: {
    fontSize: typography.body,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  homeTags: {
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
