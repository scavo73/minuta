import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  AuthInput,
  AuthLegalText,
  AuthPrimaryButton,
  AuthScaffold,
  AuthTextButton,
} from "../../components/auth/AuthScaffold";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { login } from "../../lib/api";
import {
  getAuthToken,
  saveSessionFromAuthResponse,
} from "../../lib/authSession";
import { useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";

export default function SignInScreen() {
  const { theme } = useMinutaTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchFolders = useFoldersStore((state) => state.fetchFolders);
  const fetchItems = useNotesStore((state) => state.fetchItems);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Introduce email y contraseña.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Introduce un email válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await login(trimmedEmail, password);
      const token = getAuthToken(response);

      if (!token) {
        throw new Error("No se recibió token de sesión.");
      }

      await saveSessionFromAuthResponse(token, response, trimmedEmail);
      await Promise.all([fetchItems(), fetchFolders()]);
      router.replace("/");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "No se pudo iniciar sesión.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Bienvenido de nuevo"
      subtitle="Accede para sincronizar tus notas, tareas e ideas."
    >
      <View style={styles.form}>
        <AuthInput
          icon="mail-outline"
          onChangeText={setEmail}
          placeholder="Email"
          value={email}
        />
        <AuthInput
          icon="lock-closed-outline"
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
        />
        <AuthTextButton onPress={() => router.push("/auth/forgot-password")}>
          ¿Olvidaste tu contraseña?
        </AuthTextButton>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      ) : null}

      <AuthPrimaryButton
        label="Iniciar sesión"
        loading={isSubmitting}
        onPress={handleSignIn}
      />
      <AuthLegalText />

      <Text style={[styles.switchText, { color: theme.mutedText }]}>
        ¿No tienes cuenta?{" "}
        <Text
          onPress={() => router.push("/auth/sign-up")}
          style={[styles.switchLink, { color: theme.text }]}
        >
          Crear cuenta
        </Text>
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center",
  },
  switchLink: {
    fontWeight: "800",
  },
  switchText: {
    fontSize: typography.body,
    textAlign: "center",
  },
});
