import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
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

interface FormRowProps {
  children: React.ReactNode;
  label: string;
  verticalAlign?: "center" | "start";
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
  return "tags" in item ? item.tags : [];
}

function getInitialColor(item: EditableItem) {
  return "color" in item ? item.color : ideaColors[0];
}

function FormRow({ children, label, verticalAlign = "center" }: FormRowProps) {
  const { theme } = useMinutaTheme();
  const isCentered = verticalAlign === "center";

  return (
    <View
      style={[
        styles.formRow,
        isCentered ? styles.formRowCentered : null,
        { borderTopColor: theme.border },
      ]}
    >
      <View
        style={[
          styles.rowLabelColumn,
          isCentered ? styles.rowLabelColumnCentered : null,
        ]}
      >
        <Text style={[styles.rowLabel, { color: theme.mutedText }]}>
          {label}
        </Text>
        <Text style={[styles.rowColon, { color: theme.mutedText }]}>:</Text>
      </View>
      <View
        style={[styles.rowContent, isCentered ? styles.rowContentCentered : null]}
      >
        {children}
      </View>
    </View>
  );
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
  const [tags, setTags] = useState(getInitialTags(item));
  const [tagDraft, setTagDraft] = useState("");
  const [color, setColor] = useState(getInitialColor(item));
  const [folderId, setFolderId] = useState(item.folderId ?? null);
  const [errors, setErrors] = useState<FormErrors>({});
  const initialTags = getInitialTags(item);
  const hasChanges =
    title !== item.title ||
    (kind === "note" && content !== (isNote(item) ? item.content : "")) ||
    (kind === "note" && imageUri !== (isNote(item) ? item.imageUri : undefined)) ||
    folderId !== (item.folderId ?? null) ||
    (kind === "idea" && color !== getInitialColor(item)) ||
    (kind === "idea" && tagDraft.trim().length > 0) ||
    (kind === "idea" && tags.join("\u0000") !== initialTags.join("\u0000"));

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

  const addTags = (nextTags: string[]) => {
    if (nextTags.length === 0) return;

    setTags((currentTags) => {
      const existingTags = new Set(
        currentTags.map((tag) => tag.trim().toLowerCase()),
      );
      const mergedTags = [...currentTags];

      nextTags.forEach((tag) => {
        const trimmedTag = tag.trim();
        const key = trimmedTag.toLowerCase();

        if (!trimmedTag || existingTags.has(key)) return;

        existingTags.add(key);
        mergedTags.push(trimmedTag);
      });

      return mergedTags;
    });
  };

  const removeTag = (tag: string) => {
    const key = tag.toLowerCase();

    setTags((currentTags) =>
      currentTags.filter((item) => item.toLowerCase() !== key),
    );
  };

  const commitTagDraft = () => {
    const nextTags = parseTags(tagDraft);

    addTags(nextTags);
    setTagDraft("");

    return nextTags;
  };

  const handleTagDraftChange = (value: string) => {
    if (!value.includes(",")) {
      setTagDraft(value);
      return;
    }

    const parts = value.split(",");
    const completedTags = parseTags(parts.slice(0, -1).join(","));

    addTags(completedTags);
    setTagDraft(parts[parts.length - 1] ?? "");
  };

  const getFinalTags = () => {
    const draftTags = parseTags(tagDraft);
    const existingTags = new Set<string>();

    return [...tags, ...draftTags].filter((tag) => {
      const key = tag.toLowerCase();

      if (existingTags.has(key)) return false;

      existingTags.add(key);
      return true;
    });
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
      tags: getFinalTags(),
      color,
      folderId,
    });
  };

  const renderFolderOptions = () => {
    if (folders.length === 0) return null;

    return (
      <View style={styles.inlineOptions}>
        {folders.map((folder) => {
          const isSelected = folderId === folder.id;

          return (
            <Pressable
              key={folder.id}
              onPress={() => setFolderId(isSelected ? null : folder.id)}
              style={[
                styles.folderChip,
                {
                  backgroundColor: theme.chipBackground,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: isSelected ? 1 : 0.72,
                },
              ]}
            >
              {isSelected ? (
                <Ionicons
                  color={theme.primary}
                  name="checkmark-sharp"
                  size={15}
                />
              ) : null}
              <Ionicons
                color={isSelected ? theme.primary : theme.mutedText}
                name="folder-outline"
                size={15}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.folderChipText,
                  { color: isSelected ? theme.primary : theme.text },
                ]}
              >
                {folder.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Volver"
          onPress={onCancel}
          style={[styles.headerButton, { backgroundColor: theme.card }]}
        >
          <Ionicons color={theme.text} name="arrow-back" size={22} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.mutedText }]}>
          Editar
        </Text>
        {hasChanges ? (
          <Pressable
            accessibilityLabel="Guardar"
            onPress={handleSave}
            style={[styles.headerButton, { backgroundColor: "#22C55E" }]}
          >
            <Ionicons color="#FFFFFF" name="checkmark" size={22} />
          </Pressable>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 96 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {kind === "note" ? (
          <Pressable
            onPress={imageUri ? undefined : pickImage}
            style={[
              styles.imagePicker,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}
          >
            {imageUri ? (
              <>
                <Image
                  resizeMode="cover"
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                />
                <View style={styles.imageOverlay}>
                  <Pressable
                    onPress={pickImage}
                    style={[
                      styles.imageActionButton,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <Text style={[styles.imageActionText, { color: theme.text }]}>
                      Cambiar
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setImageUri(undefined)}
                    style={[
                      styles.imageActionButton,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <Text style={[styles.imageActionText, { color: theme.text }]}>
                      Quitar
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  color={theme.mutedText}
                  name="camera-outline"
                  size={24}
                />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: theme.mutedText },
                  ]}
                >
                  Añadir imagen
                </Text>
              </View>
            )}
          </Pressable>
        ) : null}

        <View style={styles.form}>
          <FormRow label="Título">
            <TextInput
              onChangeText={setTitle}
              placeholder=""
              style={[styles.rowInput, { color: theme.text }]}
              value={title}
            />
          </FormRow>
          {errors.title ? (
            <Text style={[styles.error, { color: theme.danger }]}>
              {errors.title}
            </Text>
          ) : null}

          {kind === "note" ? (
            <>
              <View
                style={[styles.contentRow, { borderTopColor: theme.border }]}
              >
                <View style={styles.rowLabelColumn}>
                  <Text style={[styles.rowLabel, { color: theme.mutedText }]}>
                    Contenido
                  </Text>
                  <Text style={[styles.rowColon, { color: theme.mutedText }]}>
                    :
                  </Text>
                </View>
                <TextInput
                  multiline
                  onChangeText={setContent}
                  placeholder=""
                  scrollEnabled={false}
                  style={[
                    styles.rowInput,
                    styles.contentInput,
                    { color: theme.text },
                  ]}
                  textAlignVertical="top"
                  value={content}
                />
              </View>
              {errors.content ? (
                <Text style={[styles.error, { color: theme.danger }]}>
                  {errors.content}
                </Text>
              ) : null}
            </>
          ) : null}

          <FormRow label="Carpeta">{renderFolderOptions()}</FormRow>

          {kind === "idea" ? (
            <>
              <FormRow label="Tags">
                <View style={styles.tagsEditor}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => removeTag(tag)}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: theme.chipBackground,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.tagChipText, { color: theme.text }]}>
                        {tag}
                      </Text>
                      <Ionicons color={theme.mutedText} name="close" size={13} />
                    </Pressable>
                  ))}
                  <TextInput
                    blurOnSubmit={false}
                    onBlur={commitTagDraft}
                    onChangeText={handleTagDraftChange}
                    onSubmitEditing={commitTagDraft}
                    placeholder={
                      tags.length === 0 && tagDraft.length === 0
                        ? "comida, vuelos, etc"
                        : ""
                    }
                    placeholderTextColor={theme.mutedText}
                    style={[styles.tagInput, { color: theme.text }]}
                    value={tagDraft}
                  />
                </View>
              </FormRow>
              <View
                style={[
                  styles.tagSuggestionsBlock,
                  { borderTopColor: theme.border },
                ]}
              >
                <ManageTagsButton
                  onPress={() => {
                    // TODO: navegar a la pantalla de gestión de tags.
                  }}
                />
                <TagSuggestions
                  availableTags={availableTags}
                  selectedTags={tags}
                  onChange={setTags}
                  variant="large"
                />
              </View>
              <FormRow label="Color">
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
              </FormRow>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  imagePicker: {
    alignItems: "center",
    aspectRatio: 1.45,
    borderRadius: radius.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: spacing.xs,
  },
  imagePlaceholderText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  imagePreview: {
    height: "100%",
    width: "100%",
  },
  imageOverlay: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    left: 0,
    padding: spacing.sm,
    position: "absolute",
    right: 0,
  },
  imageActionButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  imageActionText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  form: {
    gap: 0,
  },
  formRow: {
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  formRowCentered: {
    alignItems: "center",
  },
  contentRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 120,
    paddingVertical: spacing.sm,
  },
  rowLabelColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 92,
  },
  rowLabelColumnCentered: {
    alignItems: "center",
  },
  rowLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 24,
  },
  rowColon: {
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 24,
  },
  rowContent: {
    flex: 1,
    minHeight: 30,
  },
  rowContentCentered: {
    justifyContent: "center",
  },
  rowInput: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 22,
    minHeight: 30,
    padding: 0,
  },
  contentInput: {
    minHeight: 92,
  },
  inlineOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: 1,
  },
  folderChip: {
    alignItems: "center",
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    maxWidth: 150,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  folderChipText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  tagSuggestionsBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tagsEditor: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tagInput: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 22,
    minHeight: 34,
    minWidth: 120,
    padding: 0,
  },
  tagChip: {
    alignItems: "center",
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagChipText: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  error: {
    fontSize: typography.small,
    paddingTop: spacing.xs,
  },
});
