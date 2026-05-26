import { useEffect, useRef } from "react";
import { Animated, StyleSheet, TextInput } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface CollapsibleSearchProps {
  collapsed: boolean;
  onBlur?: () => void;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
  value: string;
}

const SEARCH_HEIGHT = 48;

export function CollapsibleSearch({
  collapsed,
  onBlur,
  onChangeText,
  onFocus,
  placeholder,
  value,
}: CollapsibleSearchProps) {
  const { theme } = useMinutaTheme();
  const progress = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: 180,
      toValue: collapsed ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [collapsed, progress]);

  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SEARCH_HEIGHT],
  });
  const marginTop = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <Animated.View
      pointerEvents={collapsed ? "none" : "auto"}
      style={[styles.wrapper, { height, marginTop, opacity: progress }]}
    >
      <TextInput
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedText}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            color: theme.text,
          },
        ]}
        value={value}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 16,
    fontSize: typography.body,
    height: SEARCH_HEIGHT,
    paddingHorizontal: spacing.md,
  },
  wrapper: {
    overflow: "hidden",
  },
});
