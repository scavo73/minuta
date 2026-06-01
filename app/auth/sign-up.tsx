import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  AuthInput,
  AuthLegalText,
  AuthPrimaryButton,
  AuthScaffold,
} from "../../components/auth/AuthScaffold";
import { spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { login, register, type AuthResponse } from "../../lib/api";
import {
  getAuthToken,
  saveSessionFromAuthResponse,
} from "../../lib/authSession";
import { useFoldersStore } from "../../store/foldersStore";
import { useNotesStore } from "../../store/notesStore";

export default function SignUpScreen() {
  const { theme } = useMinutaTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchFolders = useFoldersStore((state) => state.fetchFolders);
  const fetchItems = useNotesStore((state) => state.fetchItems);

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !repeatedPassword) {
      setError("Completa email y contraseña.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Introduce un email válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== repeatedPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const registerResponse = await register(trimmedEmail, password);
      let token = getAuthToken(registerResponse);
      let sessionResponse: AuthResponse = registerResponse;

      if (!token) {
        const loginResponse = await login(trimmedEmail, password);
        token = getAuthToken(loginResponse);
        sessionResponse = loginResponse;
      }

      if (!token) {
        throw new Error("No se recibió token de sesión.");
      }

      await saveSessionFromAuthResponse(token, sessionResponse, trimmedEmail);
      await Promise.all([fetchItems(), fetchFolders()]);
      router.replace("/");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "No se pudo crear la cuenta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Crea tu cuenta"
      subtitle="Guarda tu espacio de trabajo de forma segura."
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
        <AuthInput
          icon="shield-checkmark-outline"
          onChangeText={setRepeatedPassword}
          placeholder="Repetir contraseña"
          secureTextEntry
          value={repeatedPassword}
        />
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      ) : null}

      <AuthPrimaryButton
        label="Crear cuenta"
        loading={isSubmitting}
        onPress={handleSignUp}
      />
      <AuthLegalText />

      <Text style={[styles.switchText, { color: theme.mutedText }]}>
        ¿Ya tienes cuenta?{" "}
        <Text
          onPress={() => router.push("/auth/sign-in")}
          style={[styles.switchLink, { color: theme.text }]}
        >
          Iniciar sesión
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
