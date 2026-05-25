import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface ManageTagsButtonProps {
  onPress?: () => void;
}

export function ManageTagsButton({ onPress }: ManageTagsButtonProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.button}
      >
        <Text style={[styles.text, { color: theme.primary }]}>
          Gestionar tags
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-end",
    marginTop: spacing.xs,
  },
  button: {
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
