import { Alert } from "react-native";

interface DeleteConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export function showDeleteConfirm({
  confirmText = "Borrar",
  message,
  onConfirm,
  title,
}: DeleteConfirmOptions) {
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    {
      text: confirmText,
      onPress: onConfirm,
      style: "destructive",
    },
  ]);
}
