import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import type { Task } from "../../types";

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPressText: (id: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const deleteThreshold = 88;
const deleteColor = "#EF4444";

export function TaskRow({
  task,
  onToggle,
  onDelete,
  onPressText,
  onSwipeStart,
  onSwipeEnd,
}: TaskRowProps) {
  const { theme } = useMinutaTheme();
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const hasDeleted = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const isSwiping = useRef(false);
  const taskId = useRef(task.id);
  const deleteTask = useRef(onDelete);
  const swipeStart = useRef(onSwipeStart);
  const swipeEnd = useRef(onSwipeEnd);
  const screenWidthRef = useRef(screenWidth);

  useEffect(() => {
    deleteTask.current = onDelete;
    swipeStart.current = onSwipeStart;
    swipeEnd.current = onSwipeEnd;
    screenWidthRef.current = screenWidth;
  }, [onDelete, onSwipeEnd, onSwipeStart, screenWidth]);

  useEffect(() => {
    taskId.current = task.id;
    hasDeleted.current = false;
    hasTriggeredHaptic.current = false;
    isSwiping.current = false;
    translateX.setValue(0);
  }, [task.id, translateX]);

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

  const resetPosition = () => {
    hasTriggeredHaptic.current = false;

    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
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

  const completeDelete = (direction: 1 | -1) => {
    if (hasDeleted.current) return;

    hasDeleted.current = true;
    Animated.timing(translateX, {
      toValue: direction * (screenWidthRef.current + 80),
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      endSwipe();

      if (finished) {
        deleteTask.current(taskId.current);
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        beginSwipe();
        hasTriggeredHaptic.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);

        if (Math.abs(gesture.dx) >= deleteThreshold) {
          triggerThresholdHaptic();
          return;
        }

        hasTriggeredHaptic.current = false;
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) >= deleteThreshold) {
          completeDelete(gesture.dx > 0 ? 1 : -1);
          return;
        }

        resetPosition();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: resetPosition,
    }),
  ).current;

  const leftIconOpacity = translateX.interpolate({
    inputRange: [0, deleteThreshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const rightIconOpacity = translateX.interpolate({
    inputRange: [-deleteThreshold, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const leftIconScale = translateX.interpolate({
    inputRange: [0, deleteThreshold],
    outputRange: [0.85, 1.15],
    extrapolate: "clamp",
  });
  const rightIconScale = translateX.interpolate({
    inputRange: [-deleteThreshold, 0],
    outputRange: [1.15, 0.85],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.swipeWrapper}>
      <View style={[styles.deleteBackground, { backgroundColor: deleteColor }]}>
        <Animated.View
          style={[
            styles.deleteIcon,
            styles.deleteIconLeft,
            {
              opacity: leftIconOpacity,
              transform: [{ scale: leftIconScale }],
            },
          ]}
        >
          <Ionicons color="#FFFFFF" name="trash-outline" size={24} />
        </Animated.View>
        <Animated.View
          style={[
            styles.deleteIcon,
            styles.deleteIconRight,
            {
              opacity: rightIconOpacity,
              transform: [{ scale: rightIconScale }],
            },
          ]}
        >
          <Ionicons color="#FFFFFF" name="trash-outline" size={24} />
        </Animated.View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.taskRow,
          {
            backgroundColor: theme.surface,
            transform: [{ translateX }],
          },
        ]}
      >
        <Pressable
          onPress={() => onToggle(task.id)}
          style={[
            styles.checkbox,
            {
              backgroundColor: task.isCompleted ? theme.primary : "transparent",
              borderColor: task.isCompleted ? theme.primary : theme.mutedText,
            },
          ]}
        >
          {task.isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
        </Pressable>

        <Pressable
          onPress={() => onPressText(task.id)}
          style={styles.textButton}
        >
          <Text
            numberOfLines={2}
            style={[
              styles.taskText,
              {
                color: theme.text,
                textDecorationLine: task.isCompleted ? "line-through" : "none",
              },
            ]}
          >
            {task.text}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrapper: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    justifyContent: "center",
  },
  deleteIcon: {
    position: "absolute",
  },
  deleteIconLeft: {
    left: spacing.md,
  },
  deleteIconRight: {
    right: spacing.md,
  },
  taskRow: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  checkbox: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: typography.small,
    fontWeight: "700",
  },
  textButton: {
    flex: 1,
  },
  taskText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
