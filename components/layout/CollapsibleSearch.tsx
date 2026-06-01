import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, TextInput, View } from "react-native";

import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

interface CollapsibleSearchProps {
  collapsed: boolean;
  focusRequest?: number;
  onBlur?: () => void;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
  value: string;
}

const SEARCH_HEIGHT = 48;

export function CollapsibleSearch({
  collapsed,
  focusRequest = 0,
  onBlur,
  onChangeText,
  onFocus,
  placeholder,
  value,
}: CollapsibleSearchProps) {
  const { theme } = useMinutaTheme();
  const inputRef = useRef<TextInput>(null);
  const handledFocusRequest = useRef(0);
  const progress = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: 180,
      toValue: collapsed ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [collapsed, progress]);

  useEffect(() => {
    if (
      collapsed ||
      focusRequest === 0 ||
      focusRequest === handledFocusRequest.current
    ) {
      return;
    }

    handledFocusRequest.current = focusRequest;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [collapsed, focusRequest]);

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
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedText}
          style={[styles.input, { color: theme.text }]}
          value={value}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            onPress={() => onChangeText("")}
            style={styles.clearButton}
          >
            <Ionicons color={theme.mutedText} name="close-circle" size={20} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    height: "100%",
    padding: 0,
  },
  inputShell: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    height: SEARCH_HEIGHT,
    paddingHorizontal: spacing.md,
  },
  wrapper: {
    overflow: "hidden",
  },
});
