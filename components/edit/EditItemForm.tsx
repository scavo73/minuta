import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ManageTagsButton } from "../ideas/ManageTagsButton";
import { TagSuggestions } from "../ideas/TagSuggestions";
import { FolderSelector } from "../folders/FolderSelector";
import { radius, spacing, typography } from "../../constants/theme";
import { useMinutaTheme } from "../../constants/useMinutaTheme";
import { parseTags } from "../../lib/tags";
import type { Folder } from "../../store/foldersStore";
import type { IdeaNote, Note } from "../../types";

type EditableItem = Note | IdeaNote;

type EditItemValues =
  | {
      kind: "note";
      title: string;
      content: string;
      imageUri?: string;
      folderId?: string | null;
    }
  | {
      kind: "idea";
      title: string;
      tags: string[];
      color: string;
      folderId?: string | null;
    };

interface EditItemFormProps {
  item: EditableItem;
  kind: "note" | "idea";
  availableTags?: string[];
  folders: Folder[];
  onCancel: () => void;
  onSave: (values: EditItemValues) => void;
}

type FormErrors = Partial<Record<"title" | "content", string>>;

const ideaColors = [
  "#FDE68A",
  "#7DD3FC",
  "#FCA5A5",
  "#86EFAC",
  "#FECACA",
  "#A7F3D0",
  "#FEF3C7",
];

function isNote(item: EditableItem): item is Note {
  return "content" in item;
}

function getInitialTags(item: EditableItem) {
  return "tags" in item ? item.tags.join(", ") : "";
}

function getInitialColor(item: EditableItem) {
  return "color" in item ? item.color : ideaColors[0];
}

export function EditItemForm({
  availableTags = [],
  folders,
  item,
  kind,
  onCancel,
  onSave,
}: EditItemFormProps) {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(isNote(item) ? item.content : "");
  const [imageUri, setImageUri] = useState(
    isNote(item) ? item.imageUri : undefined,
  );
  const [tagsText, setTagsText] = useState(getInitialTags(item));
  const [color, setColor] = useState(getInitialColor(item));
  const [folderId, setFolderId] = useState(item.folderId ?? null);
  const [errors, setErrors] = useState<FormErrors>({});
  const selectedTags = parseTags(tagsText);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri);
    }
  };

  const handleSave = () => {
    const nextTitle = title.trim();
    const nextContent = content.trim();
    const nextErrors: FormErrors = {};

    if (nextTitle.length < 3) {
      nextErrors.title = "El título debe tener al menos 3 caracteres";
    }

    if (kind === "note" && nextContent.length === 0) {
      nextErrors.content = "El contenido no puede estar vacío";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (kind === "note") {
      onSave({
        kind: "note",
        title: nextTitle,
        content: nextContent,
        imageUri,
        folderId,
      });
      return;
    }

    onSave({
      kind: "idea",
      title: nextTitle,
      tags: parseTags(tagsText),
      color,
      folderId,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 96 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: theme.text }]}>
          Editar {kind === "note" ? "nota" : "idea"}
        </Text>
        <Pressable
          onPress={onCancel}
          style={[styles.closeButton, { backgroundColor: theme.surface }]}
        >
          <Text style={[styles.closeButtonText, { color: theme.text }]}>
            Cancelar
          </Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.text }]}>Título</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Título"
          placeholderTextColor={theme.mutedText}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.mutedText,
              color: theme.text,
            },
          ]}
          value={title}
        />
        {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}
      </View>

      {kind === "note" ? (
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Contenido</Text>
          <TextInput
            multiline
            onChangeText={setContent}
            placeholder="Escribe la nota"
            placeholderTextColor={theme.mutedText}
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: theme.mutedText,
                color: theme.text,
              },
            ]}
            textAlignVertical="top"
            value={content}
          />
          {errors.content ? (
            <Text style={styles.error}>{errors.content}</Text>
          ) : null}
          <View style={styles.imageActions}>
            <Pressable
              onPress={pickImage}
              style={[
                styles.secondaryButton,
                { backgroundColor: theme.surface },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                Cambiar imagen
              </Text>
            </Pressable>
            {imageUri ? (
              <Pressable
                onPress={() => setImageUri(undefined)}
                style={[
                  styles.secondaryButton,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: theme.text }]}
                >
                  Quitar imagen
                </Text>
              </Pressable>
            ) : null}
          </View>
          {imageUri ? (
            <Image
              resizeMode="cover"
              source={{ uri: imageUri }}
              style={styles.imagePreview}
            />
          ) : null}
        </View>
      ) : null}

      <FolderSelector
        folders={folders}
        selectedFolderId={folderId}
        onChange={setFolderId}
      />

      {kind === "idea" ? (
        <>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Etiquetas</Text>
            <TextInput
              onChangeText={setTagsText}
              placeholder="producto, ideas, casa"
              placeholderTextColor={theme.mutedText}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.mutedText,
                  color: theme.text,
                },
              ]}
              value={tagsText}
            />
            <ManageTagsButton
              onPress={() => {
                // TODO: navegar a la pantalla de gestión de tags.
              }}
            />
            <TagSuggestions
              availableTags={availableTags}
              selectedTags={selectedTags}
              onChange={(tags) => setTagsText(tags.join(", "))}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Color</Text>
            <View style={styles.swatches}>
              {ideaColors.map((option) => (
                <Pressable
                  key={option}
                  accessibilityLabel={`Color ${option}`}
                  onPress={() => setColor(option)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: option,
                      borderColor:
                        color === option ? theme.text : "transparent",
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      <Pressable
        onPress={handleSave}
        style={[styles.submitButton, { backgroundColor: theme.primary }]}
      >
        <Text style={styles.submitText}>Guardar cambios</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
  },
  closeButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: typography.body,
    padding: spacing.md,
  },
  textArea: {
    minHeight: 180,
  },
  error: {
    color: "#DC2626",
    fontSize: typography.small,
  },
  imageActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  imagePreview: {
    borderRadius: radius.md,
    height: 150,
    marginTop: spacing.sm,
    width: "100%",
  },
  swatches: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  swatch: {
    borderRadius: radius.md,
    borderWidth: 3,
    height: 40,
    width: 40,
  },
  submitButton: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
