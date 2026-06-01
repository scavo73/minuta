import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { radius } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface FolderButtonProps {
  onPress: () => void;
}

export function FolderButton({ onPress }: FolderButtonProps) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      accessibilityLabel="Abrir carpetas"
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.card }]}
    >
      <Ionicons color={theme.text} name="folder-outline" size={22} />
      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
        <Ionicons color={theme.primaryText} name="add" size={12} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  badge: {
    alignItems: "center",
    borderRadius: 999,
    bottom: 7,
    height: 15,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    width: 15,
  },
});
