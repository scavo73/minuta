import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { radius, spacing, typography } from "../constants/theme";
import { useMinutaTheme } from "../constants/useMinutaTheme";
import { deleteToken } from "../lib/authStorage";
import { useFoldersStore } from "../store/foldersStore";
import { useNotesStore } from "../store/notesStore";

type AccountIconName = React.ComponentProps<typeof Ionicons>["name"];

interface AccountSectionProps {
  children: React.ReactNode;
  title: string;
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
  const iconColor = destructive ? "#DC2626" : theme.primary;
  const textColor = destructive ? "#DC2626" : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.72 : 1 }]}
    >
      <View style={[styles.rowIconBox, { backgroundColor: theme.background }]}>
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
  const { theme, isDark } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const [isDarkModePreview, setIsDarkModePreview] = useState(isDark);
  const clearFolders = useFoldersStore((state) => state.clearFolders);
  const clearItems = useNotesStore((state) => state.clearItems);

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
            await deleteToken();
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
          style={[styles.headerButton, { backgroundColor: theme.surface }]}
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
        <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Ionicons color="#FFFFFF" name="person" size={38} />
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
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
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

        <AccountSection title="Cuenta">
          <AccountRow icon="person-outline" label="Perfil" />
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

        <AccountSection title="Apariencia">
          <AccountRow
            icon="moon-outline"
            label="Modo oscuro / claro"
            subtitle="Preparado para conectar al tema de la app."
            rightElement={
              <Switch
                value={isDarkModePreview}
                onValueChange={(value) => {
                  // TODO: conectar con preferencia real de tema.
                  setIsDarkModePreview(value);
                }}
              />
            }
          />
        </AccountSection>

        <AccountSection title="Sesión">
          <AccountRow
            destructive
            icon="log-out-outline"
            label="Cerrar sesión"
            subtitle="Borra el token guardado en este dispositivo."
            onPress={handleLogout}
          />
        </AccountSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 999,
    height: 80,
    justifyContent: "center",
    width: 80,
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
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "800",
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
