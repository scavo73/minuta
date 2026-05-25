import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface ArchivedRowProps {
  onPress: () => void;
}

export function ArchivedRow({ onPress }: ArchivedRowProps) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver archivados"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
        <Ionicons color={theme.primary} name="archive-outline" size={22} />
      </View>
      <Text style={[styles.label, { color: theme.text }]}>Archivados</Text>
      <Ionicons color={theme.mutedText} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: 12,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  label: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
