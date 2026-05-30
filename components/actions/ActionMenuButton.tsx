import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { ActionMenuItem, ItemAction } from "./actions";

interface ActionMenuButtonProps {
  badgeCount?: number;
  items: ActionMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (action: ItemAction) => void;
}

export function ActionMenuButton({
  badgeCount = 0,
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
        {badgeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        ) : null}
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
                disabled={item.disabled}
                onPress={() => {
                  if (item.disabled) return;

                  onClose();
                  onSelect(item.action);
                }}
                style={[
                  styles.menuItem,
                  item.disabled ? styles.menuItemDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.menuText,
                    { color: item.destructive ? "#DC2626" : theme.text },
                    item.disabled ? { color: theme.mutedText } : null,
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
  badge: {
    alignItems: "center",
    borderRadius: 999,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: -5,
    top: -5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
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
  menuItemDisabled: {
    opacity: 0.62,
  },
  menuText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
