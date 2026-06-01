import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
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

import { radius, spacing, typography } from "../constants/theme";
import { useMinutaTheme } from "../constants/useMinutaTheme";
import {
  clearAuthSession,
  getToken,
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "../lib/authStorage";
import { useFoldersStore } from "../store/foldersStore";
import { useNotesStore } from "../store/notesStore";

type ProfileIconName = React.ComponentProps<typeof Ionicons>["name"];

function getUserInitial(profile: UserProfile | null) {
  const source = profile?.name?.trim() || profile?.email?.trim() || "?";

  return source.charAt(0).toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString();
}

function ProfileSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
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

function ProfileInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.mutedText }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function ProfileActionRow({
  destructive = false,
  disabled = false,
  icon,
  label,
  subtitle,
  onPress,
}: {
  destructive?: boolean;
  disabled?: boolean;
  icon: ProfileIconName;
  label: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const { theme } = useMinutaTheme();
  const contentColor = destructive ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        { opacity: disabled ? 0.5 : pressed ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.actionIconBox, { backgroundColor: theme.card }]}>
        <Ionicons
          color={destructive ? theme.danger : theme.primary}
          name={icon}
          size={20}
        />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, { color: contentColor }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.actionSubtitle, { color: theme.mutedText }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons color={theme.mutedText} name="chevron-forward" size={18} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const clearFolders = useFoldersStore((state) => state.clearFolders);
  const clearItems = useNotesStore((state) => state.clearItems);
  const createdAt = formatDate(profile?.createdAt);

  const loadProfile = useCallback(async () => {
    const [token, storedProfile] = await Promise.all([
      getToken(),
      getUserProfile(),
    ]);

    setIsLoggedIn(Boolean(token));
    setProfile(storedProfile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const logout = () => {
    Alert.alert("Cerrar sesión", "¿Quieres cerrar la sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await clearAuthSession();
          clearItems();
          clearFolders();
          await useNotesStore.persist.clearStorage();
          router.replace("/auth/sign-in");
        },
      },
    ]);
  };

  const openEditName = () => {
    setNameDraft(profile?.name ?? "");
    setIsEditingName(true);
  };

  const saveName = async () => {
    const nextName = nameDraft.trim();
    const nextProfile = await updateUserProfile({
      name: nextName.length > 0 ? nextName : undefined,
    });

    setProfile(nextProfile);
    setIsEditingName(false);
  };

  if (!isLoggedIn) {
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Perfil
          </Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>
        <View style={styles.emptyContent}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Inicia sesión para ver tu perfil
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/auth/sign-in")}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              Iniciar sesión
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.primaryText }]}>
              {getUserInitial(profile)}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            {profile?.name ? (
              <Text style={[styles.profileName, { color: theme.text }]}>
                {profile.name}
              </Text>
            ) : null}
            {profile?.email ? (
              <Text style={[styles.profileEmail, { color: theme.mutedText }]}>
                {profile.email}
              </Text>
            ) : (
              <Text style={[styles.profileEmail, { color: theme.mutedText }]}>
                Email no disponible
              </Text>
            )}
          </View>
        </View>

        <ProfileSection title="Datos personales">
          <ProfileInfoRow label="Nombre" value={profile?.name ?? "Sin nombre"} />
          {profile?.email ? (
            <ProfileInfoRow label="Email" value={profile.email} />
          ) : null}
          {createdAt ? (
            <ProfileInfoRow label="Fecha de creación" value={createdAt} />
          ) : null}
          <ProfileInfoRow
            label="Estado"
            value={profile?.syncStatus ?? "Sesión iniciada"}
          />
        </ProfileSection>

        <ProfileSection title="Acciones de perfil">
          <ProfileActionRow
            icon="create-outline"
            label="Editar nombre"
            onPress={openEditName}
          />
          <ProfileActionRow
            disabled
            icon="key-outline"
            label="Cambiar contraseña"
            subtitle="No disponible todavía."
          />
          <ProfileActionRow
            destructive
            icon="log-out-outline"
            label="Cerrar sesión"
            onPress={logout}
          />
        </ProfileSection>

        <ProfileSection title="Zona peligrosa">
          <ProfileActionRow
            destructive
            disabled
            icon="trash-outline"
            label="Eliminar cuenta"
            subtitle="Preparado para cuando exista el endpoint."
          />
        </ProfileSection>
      </ScrollView>

      <Modal animationType="fade" transparent visible={isEditingName}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: theme.modalBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Editar nombre
            </Text>
            <TextInput
              autoFocus
              onChangeText={setNameDraft}
              placeholder="Nombre"
              placeholderTextColor={theme.mutedText}
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={nameDraft}
            />
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsEditingName(false)}
                style={[styles.secondaryButton, { backgroundColor: theme.card }]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveName}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.primaryText },
                  ]}
                >
                  Guardar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionIconBox: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  actionLabel: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionSubtitle: {
    fontSize: typography.small,
    lineHeight: 18,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 999,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  avatarText: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  emptyContent: {
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.subtitle,
    fontWeight: "800",
    textAlign: "center",
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
  infoLabel: {
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoValue: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: typography.body,
    padding: spacing.md,
  },
  modal: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  profileCard: {
    alignItems: "center",
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  profileCopy: {
    alignItems: "center",
    gap: spacing.xs,
  },
  profileEmail: {
    fontSize: typography.body,
    textAlign: "center",
  },
  profileName: {
    fontSize: typography.subtitle,
    fontWeight: "800",
    textAlign: "center",
  },
  screen: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
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
});
