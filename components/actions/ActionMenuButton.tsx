import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { ActionMenuItem, ItemAction } from "./actions";

interface ActionMenuButtonProps {
  items: ActionMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (action: ItemAction) => void;
}

export function ActionMenuButton({
  isOpen,
  items,
  onClose,
  onOpen,
  onSelect,
}: ActionMenuButtonProps) {
  const { theme } = useMinutaTheme();

  return (
    <>
      <Pressable
        accessibilityLabel="Abrir acciones"
        onPress={onOpen}
        style={[styles.trigger, { backgroundColor: theme.surface }]}
      >
        <Ionicons color={theme.text} name="ellipsis-horizontal" size={20} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={onClose}
        transparent
        visible={isOpen}
      >
        <Pressable onPress={onClose} style={styles.backdrop}>
          <View style={[styles.menu, { backgroundColor: theme.surface }]}>
            {items.map((item) => (
              <Pressable
                key={item.action}
                onPress={() => {
                  onClose();
                  onSelect(item.action);
                }}
                style={styles.menuItem}
              >
                <Text
                  style={[
                    styles.menuText,
                    { color: item.destructive ? "#DC2626" : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backdrop: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 92,
  },
  menu: {
    alignSelf: "flex-end",
    borderRadius: radius.md,
    elevation: 8,
    minWidth: 220,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  menuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
