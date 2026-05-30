import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  Animated,
  ActivityIndicator,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";

type AuthIconName = React.ComponentProps<typeof Ionicons>["name"];

interface AuthScaffoldProps {
  children: ReactNode;
  subtitle: string;
  title: string;
}

interface AuthInputProps {
  icon: AuthIconName;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}

export function AuthScaffold({ children, subtitle, title }: AuthScaffoldProps) {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const decorProgress = useRef(new Animated.Value(0)).current;
  const messageProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(messageProgress, {
        duration: 380,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(decorProgress, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [decorProgress, messageProgress]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={[styles.headerButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons color={theme.text} name="arrow-back" size={22} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHero
            decorProgress={decorProgress}
            messageProgress={messageProgress}
          />
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>
              {subtitle}
            </Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthInput({
  icon,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}: AuthInputProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={[styles.inputShell, { backgroundColor: theme.surface }]}>
      <Ionicons color={theme.mutedText} name={icon} size={20} />
      <TextInput
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedText}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { color: theme.text }]}
        value={value}
      />
    </View>
  );
}

export function AuthPrimaryButton({
  disabled = false,
  label,
  loading = false,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.primaryButton,
        {
          backgroundColor:
            disabled || loading ? theme.mutedText : theme.primary,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function AuthTextButton({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.textButton}
    >
      <Text style={[styles.textButtonText, { color: theme.text }]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function AuthLegalText() {
  const { theme } = useMinutaTheme();

  return (
    <Text style={[styles.legalText, { color: theme.mutedText }]}>
      Al continuar aceptas la{" "}
      <Text
        onPress={() => router.push("/privacy")}
        style={[styles.legalLink, { color: theme.text }]}
      >
        Política de privacidad
      </Text>
      .
    </Text>
  );
}

function AuthHero({
  decorProgress,
  messageProgress,
}: {
  decorProgress: Animated.Value;
  messageProgress: Animated.Value;
}) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.hero}>
      <Animated.View
        style={[
          styles.heroBlockLarge,
          { backgroundColor: theme.primary },
          {
            opacity: decorProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.16],
            }),
            transform: [
              {
                translateX: decorProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-140, 0],
                }),
              },
              {
                translateY: decorProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-70, 0],
                }),
              },
              {
                scale: decorProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1],
                }),
              },
              { rotate: "-12deg" },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.heroBlockSmall,
          { backgroundColor: theme.surface },
          {
            opacity: decorProgress,
            transform: [
              {
                translateX: decorProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [120, 0],
                }),
              },
              {
                translateY: decorProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0],
                }),
              },
              {
                scale: decorProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
              { rotate: "14deg" },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.heroCard,
          { backgroundColor: theme.surface },
          {
            opacity: messageProgress,
            transform: [
              {
                translateY: messageProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
              {
                scale: messageProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.heroIcon,
            { backgroundColor: theme.background },
            {
              opacity: messageProgress,
              transform: [
                {
                  scale: messageProgress.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.72, 1.08, 1],
                  }),
                },
                {
                  rotate: messageProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-10deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons color={theme.primary} name="sparkles-outline" size={22} />
        </Animated.View>
        <View style={styles.heroLines}>
          <Animated.View
            style={[
              styles.heroLineWide,
              { backgroundColor: theme.text },
              {
                opacity: messageProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.82],
                }),
                transform: [
                  {
                    scaleX: messageProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.42, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heroLineShort,
              { backgroundColor: theme.mutedText },
              {
                opacity: messageProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.26],
                }),
                transform: [
                  {
                    scaleX: messageProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.34, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  hero: {
    height: 150,
    justifyContent: "center",
    position: "relative",
  },
  heroCard: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 74,
    paddingHorizontal: spacing.md,
    width: "72%",
  },
  heroIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  heroLineShort: {
    borderRadius: 999,
    height: 8,
    opacity: 0.26,
    width: "52%",
  },
  heroLineWide: {
    borderRadius: 999,
    height: 10,
    opacity: 0.82,
    width: "86%",
  },
  heroLines: {
    flex: 1,
    gap: spacing.sm,
  },
  heroBlockLarge: {
    borderRadius: radius.lg,
    height: 92,
    left: 28,
    position: "absolute",
    top: 14,
    width: 92,
  },
  heroBlockSmall: {
    borderRadius: radius.md,
    bottom: 20,
    height: 50,
    position: "absolute",
    right: 42,
    width: 50,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "600",
    minHeight: 46,
    padding: 0,
  },
  inputShell: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  legalLink: {
    fontWeight: "800",
  },
  legalText: {
    fontSize: typography.small,
    lineHeight: 19,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "800",
  },
  screen: {
    flex: 1,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 23,
  },
  textButton: {
    alignItems: "center",
    minHeight: 34,
    justifyContent: "center",
  },
  textButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
    lineHeight: 34,
  },
});
