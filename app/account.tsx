import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  darkTheme,
  lightTheme,
  radius,
  spacing,
  typography,
  type MinutaTheme,
  type ThemePreference,
} from "../constants/theme";
import { useMinutaTheme } from "../constants/useMinutaTheme";
import { useFirebaseAuthStore } from "../store/firebaseAuthStore";
import { useFoldersStore } from "../store/foldersStore";
import { useNotesStore } from "../store/notesStore";

type AccountIconName = React.ComponentProps<typeof Ionicons>["name"];

function getUserInitial(name?: string, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";

  return source.charAt(0).toUpperCase();
}

interface AccountSectionProps {
  children: React.ReactNode;
  title: string;
}

interface AppearanceOptionCardProps {
  label: string;
  mode: ThemePreference;
  previewTheme: MinutaTheme;
  selected: boolean;
  onPress: (mode: ThemePreference) => void;
}

function AppearanceOptionCard({
  label,
  mode,
  onPress,
  previewTheme,
  selected,
}: AppearanceOptionCardProps) {
  const { theme } = useMinutaTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(mode)}
      style={[
        styles.appearanceCard,
        {
          backgroundColor: theme.card,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.previewFrame,
          { backgroundColor: previewTheme.background },
        ]}
      >
        <View
          style={[
            styles.previewHeader,
            { backgroundColor: previewTheme.surface },
          ]}
        >
          <View
            style={[
              styles.previewDot,
              { backgroundColor: previewTheme.primary },
            ]}
          />
          <View
            style={[
              styles.previewLine,
              { backgroundColor: previewTheme.mutedText },
            ]}
          />
        </View>
        <View style={styles.previewBody}>
          <View
            style={[
              styles.previewPanel,
              { backgroundColor: previewTheme.card },
            ]}
          />
          <View
            style={[
              styles.previewPanelSmall,
              { backgroundColor: previewTheme.chipBackground },
            ]}
          />
        </View>
      </View>
      <View style={styles.appearanceFooter}>
        <Text style={[styles.appearanceLabel, { color: theme.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.appearanceCheck,
            {
              backgroundColor: selected ? theme.primary : "transparent",
              borderColor: selected ? theme.primary : theme.border,
            },
          ]}
        >
          {selected ? (
            <Ionicons color={theme.primaryText} name="checkmark" size={13} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

interface AccountRowProps {
  destructive?: boolean;
  icon: AccountIconName;
  label: string;
  rightElement?: React.ReactNode;
  subtitle?: string;
  onPress?: () => void;
}

function AccountSection({ children, title }: AccountSectionProps) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.mutedText }]}>
        {title}
      </Text>
      <View style={[styles.sectionBody, { backgroundColor: theme.surface }]}>
        {children}
      </View>
    </View>
  );
}

function AccountRow({
  destructive = false,
  icon,
  label,
  onPress,
  rightElement,
  subtitle,
}: AccountRowProps) {
  const { theme } = useMinutaTheme();
  const iconColor = destructive ? theme.danger : theme.primary;
  const textColor = destructive ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.72 : 1 }]}
    >
      <View style={[styles.rowIconBox, { backgroundColor: theme.card }]}>
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.mutedText }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement ?? (
        <Ionicons color={theme.mutedText} name="chevron-forward" size={19} />
      )}
    </Pressable>
  );
}

export default function AccountScreen() {
  const { theme, themePreference, setThemePreference } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useFirebaseAuthStore((state) => state.currentUser);
  const hydrateFirebaseAuth = useFirebaseAuthStore(
    (state) => state.hydrateFirebaseAuth,
  );
  const isLoadingAuth = useFirebaseAuthStore((state) => state.isLoading);
  const profile = useFirebaseAuthStore((state) => state.profile);
  const signOut = useFirebaseAuthStore((state) => state.signOut);
  const clearFolders = useFoldersStore((state) => state.clearFolders);
  const clearItems = useNotesStore((state) => state.clearItems);
  const isLoggedIn = Boolean(currentUser);

  const loadSession = useCallback(async () => {
    hydrateFirebaseAuth();
  }, [hydrateFirebaseAuth]);

  useFocusEffect(
    useCallback(() => {
      void loadSession();
    }, [loadSession]),
  );

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Quieres cerrar la sesión en este dispositivo?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await signOut();
            clearItems();
            clearFolders();
            await useNotesStore.persist.clearStorage();
            router.replace("/auth/sign-in");
          },
        },
      ],
    );
  };

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
          style={[styles.headerButton, { backgroundColor: theme.card }]}
        >
          <Ionicons color={theme.text} name="arrow-back" size={22} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cuenta</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        {!isLoadingAuth && !isLoggedIn ? (
          <View style={[styles.userCard, { backgroundColor: theme.card }]}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Ionicons color={theme.primaryText} name="person" size={38} />
            </View>
            <View style={styles.userCopy}>
              <Text style={[styles.userTitle, { color: theme.text }]}>
                Accede a tu cuenta
              </Text>
              <Text style={[styles.userText, { color: theme.mutedText }]}>
                Sincroniza tus notas, tareas e ideas de forma segura.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/auth/sign-in")}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            >
              <Text
                style={[styles.primaryButtonText, { color: theme.primaryText }]}
              >
                Iniciar sesión
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/auth/sign-up")}
              style={styles.secondaryAction}
            >
              <Text style={[styles.secondaryActionText, { color: theme.text }]}>
                Crear cuenta
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoadingAuth && isLoggedIn ? (
          <View style={[styles.userCard, { backgroundColor: theme.card }]}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              {profile?.avatarUrl ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text
                  style={[styles.avatarText, { color: theme.primaryText }]}
                >
                  {getUserInitial(profile?.name, profile?.email)}
                </Text>
              )}
            </View>
            <View style={styles.userCopy}>
              <Text style={[styles.userTitle, { color: theme.text }]}>
                {profile?.name ?? "Cuenta Minuta"}
              </Text>
              <Text style={[styles.userText, { color: theme.mutedText }]}>
                {profile?.email ?? currentUser?.email ?? "Email no disponible"}
              </Text>
            </View>
          </View>
        ) : null}

        <AccountSection title="Cuenta">
          <AccountRow
            icon="person-outline"
            label="Perfil"
            subtitle={
              !isLoadingAuth && !isLoggedIn
                ? "Inicia sesión para ver tus datos."
                : undefined
            }
            onPress={() =>
              router.push(isLoggedIn ? "/profile" : "/auth/sign-in")
            }
          />
          <AccountRow icon="options-outline" label="Preferencias" />
          <AccountRow icon="notifications-outline" label="Notificaciones" />
        </AccountSection>

        <AccountSection title="Seguridad">
          <AccountRow icon="lock-closed-outline" label="Privacidad" />
          <AccountRow
            icon="document-text-outline"
            label="Política de privacidad"
            onPress={() => router.push("/privacy")}
          />
          <AccountRow
            icon="shield-checkmark-outline"
            label="Seguridad de la cuenta"
          />
        </AccountSection>

        <AccountSection title="Appearance">
          <View style={styles.appearanceGrid}>
            <AppearanceOptionCard
              label="Light"
              mode="light"
              previewTheme={lightTheme}
              selected={themePreference === "light"}
              onPress={setThemePreference}
            />
            <AppearanceOptionCard
              label="Dark"
              mode="dark"
              previewTheme={darkTheme}
              selected={themePreference === "dark"}
              onPress={setThemePreference}
            />
            <AppearanceOptionCard
              label="System"
              mode="system"
              previewTheme={theme}
              selected={themePreference === "system"}
              onPress={setThemePreference}
            />
          </View>
        </AccountSection>

        {!isLoadingAuth && isLoggedIn ? (
          <AccountSection title="Sesión">
            <AccountRow
              destructive
              icon="log-out-outline"
              label="Cerrar sesión"
              subtitle="Borra el token guardado en este dispositivo."
              onPress={handleLogout}
            />
          </AccountSection>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appearanceCard: {
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    gap: spacing.sm,
    minWidth: 96,
    padding: spacing.sm,
  },
  appearanceCheck: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  appearanceFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  appearanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
  },
  appearanceLabel: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  avatar: {
    alignItems: "center",
    borderRadius: 999,
    height: 80,
    justifyContent: "center",
    overflow: "hidden",
    width: 80,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarText: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  headerButtonPlaceholder: {
    height: 40,
    width: 40,
  },
  headerTitle: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  previewBody: {
    flex: 1,
    gap: 5,
    padding: 7,
  },
  previewDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  previewFrame: {
    aspectRatio: 1.18,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  previewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    height: 22,
    paddingHorizontal: 7,
  },
  previewLine: {
    borderRadius: 999,
    height: 7,
    opacity: 0.7,
    width: "52%",
  },
  previewPanel: {
    borderRadius: 7,
    flex: 1,
  },
  previewPanelSmall: {
    borderRadius: 999,
    height: 10,
    width: "68%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowIconBox: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  rowLabel: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  rowSubtitle: {
    fontSize: typography.small,
    lineHeight: 18,
  },
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  screen: {
    flex: 1,
  },
  secondaryAction: {
    alignItems: "center",
    minHeight: 36,
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  section: {
    gap: spacing.sm,
  },
  sectionBody: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: typography.small,
    fontWeight: "800",
    paddingHorizontal: spacing.sm,
    textTransform: "uppercase",
  },
  userCard: {
    alignItems: "center",
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  userCopy: {
    alignItems: "center",
    gap: spacing.xs,
  },
  userText: {
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  userTitle: {
    fontSize: typography.subtitle,
    fontWeight: "800",
    textAlign: "center",
  },
});
