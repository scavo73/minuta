import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ComponentProps, PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface SwipeableItemCardProps {
  onArchive: () => void;
  onDelete: () => void;
  archiveIcon?: ComponentProps<typeof Ionicons>["name"];
  archiveLabel?: string;
  onSwipeEnd?: () => void;
  onSwipeStart?: () => void;
}

const actionWidth = 88;
const maxSwipe = actionWidth * 2;
const openThreshold = actionWidth;

export function SwipeableItemCard({
  children,
  archiveIcon = "archive-outline",
  archiveLabel = "Archivar",
  onArchive,
  onDelete,
  onSwipeEnd,
  onSwipeStart,
}: PropsWithChildren<SwipeableItemCardProps>) {
  const { theme } = useMinutaTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const isOpen = useRef(false);
  const isSwiping = useRef(false);
  const swipeEnd = useRef(onSwipeEnd);
  const swipeStart = useRef(onSwipeStart);

  useEffect(() => {
    swipeEnd.current = onSwipeEnd;
    swipeStart.current = onSwipeStart;
  }, [onSwipeEnd, onSwipeStart]);

  const beginSwipe = () => {
    if (isSwiping.current) return;

    isSwiping.current = true;
    swipeStart.current?.();
  };

  const endSwipe = () => {
    if (!isSwiping.current) return;

    isSwiping.current = false;
    swipeEnd.current?.();
  };

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      isOpen.current = false;
      endSwipe();
    });
  };

  const open = () => {
    Animated.spring(translateX, {
      toValue: -maxSwipe,
      useNativeDriver: true,
    }).start(() => {
      isOpen.current = true;
      endSwipe();
    });
  };

  const triggerThresholdHaptic = () => {
    if (hasTriggeredHaptic.current) return;

    hasTriggeredHaptic.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
  };

  const shouldSetPanResponder = (
    _: unknown,
    gesture: PanResponderGestureState,
  ) =>
    Math.abs(gesture.dx) > 12 &&
    Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
    (gesture.dx < 0 || isOpen.current);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: shouldSetPanResponder,
      onMoveShouldSetPanResponder: shouldSetPanResponder,
      onPanResponderGrant: () => {
        beginSwipe();
        hasTriggeredHaptic.current = false;
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

        if (!isOpen.current && nextX <= -openThreshold) {
          triggerThresholdHaptic();
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const nextX = Math.min(
          0,
          Math.max(-maxSwipe, startX.current + gesture.dx),
        );

        if (isOpen.current) {
          if (gesture.dx > 0) {
            close();
            return;
          }

          open();
          return;
        }

        if (nextX <= -openThreshold) {
          open();
          return;
        }

        close();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: close,
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
          <Ionicons color="#FFFFFF" name={archiveIcon} size={20} />
          <Text style={styles.actionText}>{archiveLabel}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            close();
            onDelete();
          }}
          style={[styles.action, { backgroundColor: theme.danger }]}
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
  actionText: {
    color: "#FFFFFF",
    fontSize: typography.small,
    fontWeight: "700",
  },
  card: {
    borderRadius: radius.lg,
  },
});
