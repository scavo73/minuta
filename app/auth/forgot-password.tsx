import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AuthInput,
  AuthPrimaryButton,
  AuthScaffold,
} from "../../components/auth/AuthScaffold";
import { spacing } from "../../constants/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  return (
    <AuthScaffold
      title="Recuperar contraseña"
      subtitle="Introduce tu email y te enviaremos instrucciones para recuperar el acceso."
    >
      <View style={styles.form}>
        <AuthInput
          icon="mail-outline"
          onChangeText={setEmail}
          placeholder="Email"
          value={email}
        />
      </View>
      <AuthPrimaryButton
        label="Enviar instrucciones"
        onPress={() => undefined}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
});
