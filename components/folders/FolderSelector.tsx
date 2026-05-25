import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { Folder } from "../../store/foldersStore";

interface FolderSelectorProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onChange: (folderId: string | null) => void;
}

export function FolderSelector({
  folders,
  onChange,
  selectedFolderId,
}: FolderSelectorProps) {
  const { theme } = useMinutaTheme();

  if (folders.length === 0) {
    return null;
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>Carpeta</Text>
      <View style={styles.options}>
        {folders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;

          return (
            <Pressable
              key={folder.id}
              onPress={() => onChange(isSelected ? null : folder.id)}
              style={[
                styles.option,
                {
                  backgroundColor: theme.surface,
                  borderColor: isSelected ? theme.primary : theme.mutedText,
                  opacity: isSelected ? 1 : 0.72,
                },
              ]}
            >
              <Ionicons
                color={isSelected ? theme.primary : theme.mutedText}
                name="folder-outline"
                size={15}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.optionText,
                  { color: isSelected ? theme.text : theme.mutedText },
                ]}
              >
                {folder.name}
              </Text>
              <Ionicons
                color={isSelected ? theme.primary : theme.mutedText}
                name="checkmark-sharp"
                size={17}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
