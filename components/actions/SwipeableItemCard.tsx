import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { radius, spacing, typography } from "../../constants/theme";

interface SwipeableItemCardProps {
  onArchive: () => void;
  onDelete: () => void;
}

const actionWidth = 88;
const maxSwipe = actionWidth * 2;

export function SwipeableItemCard({
  children,
  onArchive,
  onDelete,
}: PropsWithChildren<SwipeableItemCardProps>) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const open = () => {
    Animated.spring(translateX, {
      toValue: -maxSwipe,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dy) < 12,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          startX.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = Math.min(
          0,
          Math.max(-maxSwipe, startX.current + gesture.dx),
        );
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50 || startX.current < -actionWidth) {
          open();
          return;
        }

        close();
      },
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            close();
            onArchive();
          }}
          style={[styles.action, styles.archiveAction]}
        >
          <Ionicons color="#FFFFFF" name="archive-outline" size={20} />
          <Text style={styles.actionText}>Archivar</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            close();
            onDelete();
          }}
          style={[styles.action, styles.deleteAction]}
        >
          <Ionicons color="#FFFFFF" name="trash-outline" size={20} />
          <Text style={styles.actionText}>Borrar</Text>
        </Pressable>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform: [{ translateX }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  actions: {
    bottom: 0,
    flexDirection: "row",
    position: "absolute",
    right: 0,
    top: 0,
    width: maxSwipe,
  },
  action: {
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    width: actionWidth,
  },
  archiveAction: {
    backgroundColor: "#0EA5E9",
  },
  deleteAction: {
    backgroundColor: "#DC2626",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: typography.small,
    fontWeight: "700",
  },
  card: {
    borderRadius: radius.lg,
  },
});
