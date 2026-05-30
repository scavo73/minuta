import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { radius, spacing, typography } from "../constants/theme";
import { useMinutaTheme } from "../constants/useMinutaTheme";

function PrivacySection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { theme } = useMinutaTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.mutedText }]}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Política de privacidad
        </Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={[styles.introCard, { backgroundColor: theme.surface }]}>
          <Ionicons color={theme.primary} name="shield-checkmark" size={30} />
          <Text style={[styles.title, { color: theme.text }]}>
            Tus datos en Minuta
          </Text>
          <Text style={[styles.body, { color: theme.mutedText }]}>
            Minuta está pensada para ayudarte a organizar notas, tareas, ideas y
            carpetas. Cuando conectemos autenticación, la sincronización se hará
            de forma segura entre tus dispositivos.
          </Text>
        </View>

        <PrivacySection title="Datos almacenados">
          Minuta puede guardar notas, tareas, ideas, carpetas, tags y estados de
          archivado para mantener tu espacio de trabajo actualizado. Estos datos
          se usan para mostrar tu contenido y sincronizar cambios.
        </PrivacySection>

        <PrivacySection title="Seguridad">
          El token de sesión se guardará de forma segura en el dispositivo
          cuando se conecte el login real. No guardaremos contraseñas en texto
          plano en la app. Evita compartir tu contraseña y usa credenciales
          únicas.
        </PrivacySection>

        <PrivacySection title="Contacto">
          Si tienes preguntas sobre privacidad o seguridad, podrás usar el canal
          de soporte del proyecto cuando esté disponible.
        </PrivacySection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: typography.body,
    lineHeight: 23,
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
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  introCard: {
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  screen: {
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
});
