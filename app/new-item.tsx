import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

import { ItemActionsMenu } from "../components/actions/ItemActionsMenu";
import type { ItemAction } from "../components/actions/actions";
import { ManageTagsButton } from "../components/ideas/ManageTagsButton";
import { TagSuggestions } from "../components/ideas/TagSuggestions";
import { radius, spacing, typography } from "../constants/theme";
import { useMinutaTheme } from "../constants/useMinutaTheme";
import { createItem } from "../lib/api";
import { getUniqueIdeaTags, parseTags } from "../lib/tags";
import {
  useDraftsStore,
  type DraftFormValues,
  type DraftIdeaValues,
  type DraftNoteValues,
  type DraftTaskValues,
} from "../store/draftsStore";
import { useFoldersStore } from "../store/foldersStore";
import { useNotesStore } from "../store/notesStore";
import type { NoteKind } from "../types";

// Cada tipo de item tiene su propia validacion porque no todos piden los
// mismos campos: notas usan contenido, tareas usan filas, ideas usan tags/color.
const noteSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  content: z.string().min(1, "El contenido no puede estar vacío"),
  imageUri: z.string().optional(),
});

const taskSchema = z.object({
  tasks: z.array(z.string().min(1)).min(1, "Añade al menos una tarea"),
});

const ideaSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  tags: z.array(z.string()).optional(),
  color: z.string().min(1),
});

const ideaColors = [
  "#FDE68A",
  "#7DD3FC",
  "#FCA5A5",
  "#86EFAC",
  "#FECACA",
  "#A7F3D0",
  "#FEF3C7",
];

const HEADER_BUTTON_SIZE = 40;
const TABS_HEIGHT = 52;
const TRASH_ENTER_DELAY = 70;

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type FormErrors = Partial<
  Record<"title" | "content" | "text" | "color", string>
>;

function createEmptyFormValues(
  initialFolderId: string | null,
): DraftFormValues {
  return {
    note: {
      title: "",
      content: "",
      imageUri: undefined,
      folderId: initialFolderId,
    },
    task: {
      taskRows: [{ id: "task-1", text: "" }],
      folderId: initialFolderId,
    },
    idea: {
      title: "",
      tags: [],
      tagDraft: "",
      color: ideaColors[0],
      folderId: initialFolderId,
    },
  };
}

function normalizeTaskRows(taskRows: DraftTaskValues["taskRows"]) {
  return taskRows.length > 0 ? taskRows : [{ id: "task-1", text: "" }];
}

function cloneFormValues(values: DraftFormValues): DraftFormValues {
  return {
    note: { ...values.note },
    task: {
      ...values.task,
      taskRows: values.task.taskRows.map((row) => ({ ...row })),
    },
    idea: {
      ...values.idea,
      tags: [...values.idea.tags],
    },
  };
}

function hasNoteContent(values: DraftNoteValues) {
  return (
    values.title.trim().length > 0 ||
    values.content.trim().length > 0 ||
    values.imageUri != null
  );
}

function hasTaskContent(values: DraftTaskValues) {
  return values.taskRows.some((task) => task.text.trim().length > 0);
}

function hasIdeaContent(values: DraftIdeaValues) {
  return (
    values.title.trim().length > 0 ||
    values.tags.length > 0 ||
    values.tagDraft.trim().length > 0 ||
    values.color !== ideaColors[0]
  );
}

function hasKindContent(kind: NoteKind, values: DraftFormValues[NoteKind]) {
  if (kind === "note") return hasNoteContent(values as DraftNoteValues);
  if (kind === "task") return hasTaskContent(values as DraftTaskValues);
  return hasIdeaContent(values as DraftIdeaValues);
}

function valuesEqual(
  kind: NoteKind,
  a: DraftFormValues[NoteKind],
  b: DraftFormValues[NoteKind],
) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function configureLayoutTransition() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

interface FormRowProps {
  children: React.ReactNode;
  label: string;
  verticalAlign?: "center" | "start";
}

interface AnimatedHeaderActionProps {
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
}

interface TypeTabsProps {
  collapsed: boolean;
  onSelectKind: (kind: NoteKind) => void;
  selectedKind: NoteKind;
}

// Estas tres opciones son las que dividen el formulario en Nota, Tarea o Idea.
// El valor elegido se guarda en el estado `kind`.
const typeTabs = [
  {
    icon: "document-text-outline",
    label: "Nota",
    value: "note",
  },
  {
    icon: "checkbox-outline",
    label: "Tarea",
    value: "task",
  },
  {
    icon: "bulb-outline",
    label: "Idea",
    value: "idea",
  },
] as const;

function getValidationErrors(error: z.ZodError): FormErrors {
  return error.issues.reduce<FormErrors>((errors, issue) => {
    const key = issue.path[0]?.toString() as keyof FormErrors | undefined;

    if (key && !errors[key]) {
      errors[key] = issue.message;
    }

    return errors;
  }, {});
}

function FormRow({ children, label, verticalAlign = "center" }: FormRowProps) {
  const { theme } = useMinutaTheme();
  const isCentered = verticalAlign === "center";

  return (
    <View
      style={[
        styles.formRow,
        isCentered ? styles.formRowCentered : null,
        { borderTopColor: theme.mutedText },
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
        style={[
          styles.rowContent,
          isCentered ? styles.rowContentCentered : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function AnimatedHeaderAction({
  children,
  delay = 0,
  visible,
}: AnimatedHeaderActionProps) {
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }

    Animated.timing(progress, {
      delay: visible ? delay : 0,
      duration: visible ? 170 : 130,
      easing: visible ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setIsMounted(false);
      }
    });
  }, [delay, progress, visible]);

  if (!isMounted) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.headerActionAnimated,
        {
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.88, 1],
              }),
            },
          ],
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, HEADER_BUTTON_SIZE],
          }),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function TypeTabs({ collapsed, onSelectKind, selectedKind }: TypeTabsProps) {
  const { theme } = useMinutaTheme();
  const progress = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: collapsed ? 170 : 190,
      easing: Easing.inOut(Easing.ease),
      toValue: collapsed ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [collapsed, progress]);

  return (
    <Animated.View
      pointerEvents={collapsed ? "none" : "auto"}
      style={[
        styles.tabsClip,
        {
          height: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, TABS_HEIGHT],
          }),
          marginTop: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, spacing.md],
          }),
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.tabs, { backgroundColor: theme.surface }]}>
        {typeTabs.map((option) => {
          const isSelected = selectedKind === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onSelectKind(option.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: isSelected ? theme.primary : "transparent",
                },
              ]}
            >
              <Ionicons
                color={isSelected ? "#FFFFFF" : theme.mutedText}
                name={option.icon}
                size={17}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? "#FFFFFF" : theme.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function NuevaNotaScreen() {
  const { theme } = useMinutaTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    draftId?: string;
    folderId?: string;
    kind?: NoteKind;
    mode?: "locked" | "picker";
  }>();
  const folders = useFoldersStore((state) => state.folders);
  const ideas = useNotesStore((state) => state.ideas);
  const fetchItems = useNotesStore((state) => state.fetchItems);
  const drafts = useDraftsStore((state) => state.drafts);
  const deleteDraft = useDraftsStore((state) => state.deleteDraft);
  const getDraftById = useDraftsStore((state) => state.getDraftById);
  const upsertDraft = useDraftsStore((state) => state.upsertDraft);
  const draftId = Array.isArray(params.draftId)
    ? params.draftId[0]
    : params.draftId;
  const draft = draftId ? getDraftById(draftId) : undefined;
  // La pantalla puede abrirse ya enfocada a un tipo concreto desde cada tab.
  // Ejemplo: desde Tareas llega `kind=task`; desde Ideas llega `kind=idea`.
  const initialKind =
    draft?.kind ??
    (params.kind === "task" || params.kind === "idea" || params.kind === "note"
      ? params.kind
      : "note");
  const initialFolderId =
    typeof params.folderId === "string" && params.folderId.length > 0
      ? params.folderId
      : null;
  const isEditingDraft = draft != null;
  const isKindLocked = params.mode === "locked" || isEditingDraft;
  // `kind` es la llave principal de esta pantalla: decide que campos se ven,
  // que validacion se usa y que tipo se envia a la API al guardar.
  const [kind, setKind] = useState<NoteKind>(initialKind);
  const [forms, setForms] = useState<DraftFormValues>(() => {
    const initialForms = createEmptyFormValues(initialFolderId);

    if (!draft) return initialForms;

    return {
      ...initialForms,
      [draft.kind]:
        draft.kind === "task"
          ? {
              ...(draft.values as DraftTaskValues),
              taskRows: normalizeTaskRows(
                (draft.values as DraftTaskValues).taskRows,
              ),
            }
          : draft.values,
    };
  });
  const [draftBaseline, setDraftBaseline] = useState<DraftFormValues | null>(
    () =>
      draft
        ? cloneFormValues({
            ...createEmptyFormValues(initialFolderId),
            [draft.kind]:
              draft.kind === "task"
                ? {
                    ...(draft.values as DraftTaskValues),
                    taskRows: normalizeTaskRows(
                      (draft.values as DraftTaskValues).taskRows,
                    ),
                  }
                : draft.values,
          })
        : null,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const taskInputRefs = useRef<Record<string, TextInput | null>>({});
  const availableTags = getUniqueIdeaTags(ideas);
  const noteForm = forms.note;
  const taskForm = forms.task;
  const ideaForm = forms.idea;
  const hasNoteChanges =
    noteForm.title.trim().length > 0 ||
    noteForm.content.trim().length > 0 ||
    noteForm.imageUri != null ||
    noteForm.folderId !== initialFolderId;
  const hasTaskChanges =
    taskForm.taskRows.some((task) => task.text.trim().length > 0) ||
    taskForm.folderId !== initialFolderId;
  const hasIdeaChanges =
    ideaForm.title.trim().length > 0 ||
    ideaForm.tags.length > 0 ||
    ideaForm.tagDraft.trim().length > 0 ||
    ideaForm.color !== ideaColors[0] ||
    ideaForm.folderId !== initialFolderId;
  const draftHasUnsavedChanges =
    draftBaseline == null
      ? false
      : !valuesEqual(kind, forms[kind], draftBaseline[kind]);

  // El boton de guardar/limpiar mira solo los cambios del tipo activo.
  const hasCurrentKindChanges =
    kind === "task"
      ? hasTaskChanges
      : kind === "idea"
        ? hasIdeaChanges
        : hasNoteChanges;
  const selectedKindLabel =
    typeTabs.find((option) => option.value === kind)?.label ?? "Nueva";
  const isCreationModeActive = isKindLocked || isEditing;
  const headerTitle = isEditingDraft
    ? `Borrador ${selectedKindLabel.toLowerCase()}`
    : isCreationModeActive
      ? selectedKindLabel
      : "Nueva";
  const shouldShowClearButton = hasCurrentKindChanges;
  const hasDrafts = drafts.length > 0;
  const draftsCount = drafts.length;
  const draftMenuItems = hasDrafts
    ? [
        {
          action: "viewDrafts" as const,
          label: `(${draftsCount}) Ver borradores`,
        },
      ]
    : [
        {
          action: "viewDrafts" as const,
          disabled: true,
          label: "No hay borradores",
        },
      ];

  const startEditing = () => {
    if (isEditing) return;

    configureLayoutTransition();
    setIsEditing(true);
  };

  const cancelEditingMode = () => {
    configureLayoutTransition();
    Keyboard.dismiss();
    setIsEditing(false);
  };

  const saveKindAsDraft = (draftKind: NoteKind, id?: string) => {
    if (!hasKindContent(draftKind, forms[draftKind])) return id ?? "";

    return upsertDraft({
      id,
      kind: draftKind,
      values: forms[draftKind],
    });
  };

  const saveOtherKindsAsDrafts = () => {
    (["note", "task", "idea"] as const).forEach((draftKind) => {
      if (draftKind === kind) return;

      saveKindAsDraft(draftKind);
    });
  };

  const handleDraftBackPress = () => {
    if (!draftId) {
      router.back();
      return;
    }

    Alert.alert(
      "Cerrar borrador",
      "Tienes cambios sin guardar en este borrador.\n\n¿Qué quieres hacer?",
      [
        {
          text: "Guardar borrador",
          onPress: () => {
            const nextDraftId = saveKindAsDraft(kind, draftId);

            if (nextDraftId) {
              setDraftBaseline(cloneFormValues(forms));
            }

            router.back();
          },
        },
        {
          text: "Eliminar borrador",
          style: "destructive",
          onPress: () => {
            deleteDraft(draftId);
            router.back();
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  };

  const handleHeaderBackPress = () => {
    if (isEditingDraft) {
      handleDraftBackPress();
      return;
    }

    if (isKindLocked) {
      router.back();
      return;
    }

    if (isEditing) {
      cancelEditingMode();
      return;
    }

    router.back();
  };

  const clearForm = () => {
    configureLayoutTransition();
    startEditing();
    setForms((currentForms) => ({
      ...currentForms,
      [kind]: createEmptyFormValues(null)[kind],
    }));
    setErrors({});
  };

  const handleMenuAction = (action: ItemAction) => {
    if (action === "viewDrafts") {
      router.push("/drafts");
    }
  };

  const updateNoteForm = (updates: Partial<DraftNoteValues>) => {
    startEditing();
    setForms((currentForms) => ({
      ...currentForms,
      note: {
        ...currentForms.note,
        ...updates,
      },
    }));
  };

  const updateTaskForm = (updates: Partial<DraftTaskValues>) => {
    startEditing();
    setForms((currentForms) => ({
      ...currentForms,
      task: {
        ...currentForms.task,
        ...updates,
      },
    }));
  };

  const updateIdeaForm = (updates: Partial<DraftIdeaValues>) => {
    startEditing();
    setForms((currentForms) => ({
      ...currentForms,
      idea: {
        ...currentForms.idea,
        ...updates,
      },
    }));
  };

  const addTags = (nextTags: string[]) => {
    if (nextTags.length === 0) return;

    updateIdeaForm({
      tags: (() => {
        const currentTags = ideaForm.tags;
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
      })(),
    });
  };

  const removeTag = (tag: string) => {
    const key = tag.toLowerCase();

    updateIdeaForm({
      tags: ideaForm.tags.filter((item) => item.toLowerCase() !== key),
    });
  };

  const commitTagDraft = () => {
    const nextTags = parseTags(ideaForm.tagDraft);

    addTags(nextTags);
    updateIdeaForm({ tagDraft: "" });

    return nextTags;
  };

  const handleTagDraftChange = (value: string) => {
    startEditing();

    if (!value.includes(",")) {
      updateIdeaForm({ tagDraft: value });
      return;
    }

    const parts = value.split(",");
    const completedTags = parseTags(parts.slice(0, -1).join(","));

    addTags(completedTags);
    updateIdeaForm({ tagDraft: parts[parts.length - 1] ?? "" });
  };

  const getIdeaTags = () => {
    const draftTags = parseTags(ideaForm.tagDraft);
    const existingTags = new Set<string>();

    return [...ideaForm.tags, ...draftTags].filter((tag) => {
      const key = tag.toLowerCase();

      if (existingTags.has(key)) return false;

      existingTags.add(key);
      return true;
    });
  };

  const updateTaskRow = (id: string, text: string) => {
    updateTaskForm({
      taskRows: taskForm.taskRows.map((row) =>
        row.id === id ? { ...row, text } : row,
      ),
    });
  };

  const addTaskRowAfter = (id: string) => {
    const nextId = `task-${Date.now()}`;

    startEditing();
    setForms((currentForms) => {
      const index = currentForms.task.taskRows.findIndex(
        (row) => row.id === id,
      );
      const insertIndex =
        index < 0 ? currentForms.task.taskRows.length : index + 1;
      const nextRows = [...currentForms.task.taskRows];

      nextRows.splice(insertIndex, 0, { id: nextId, text: "" });
      return {
        ...currentForms,
        task: {
          ...currentForms.task,
          taskRows: nextRows,
        },
      };
    });

    setTimeout(() => {
      taskInputRefs.current[nextId]?.focus();
    }, 80);
  };

  const removeTaskRow = (id: string) => {
    const nextRows =
      taskForm.taskRows.length === 1
        ? [{ ...taskForm.taskRows[0], text: "" }]
        : taskForm.taskRows.filter((row) => row.id !== id);

    updateTaskForm({ taskRows: nextRows });
  };

  const handleTaskKeyPress = (id: string, key: string) => {
    if (key !== "Backspace") return;

    const rowIndex = taskForm.taskRows.findIndex((row) => row.id === id);
    const row = taskForm.taskRows[rowIndex];

    if (!row || row.text.length > 0 || rowIndex <= 0) {
      return;
    }

    const previousRowId = taskForm.taskRows[rowIndex - 1]?.id;

    if (!previousRowId) return;

    startEditing();
    updateTaskForm({
      taskRows: taskForm.taskRows.filter((item) => item.id !== id),
    });

    setTimeout(() => {
      taskInputRefs.current[previousRowId]?.focus();
    }, 40);
  };

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
      updateNoteForm({ imageUri: result.assets[0]?.uri });
    }
  };

  const validateCurrentKind = () => {
    if (kind === "note") {
      const result = noteSchema.safeParse({
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        imageUri: noteForm.imageUri,
      });

      if (!result.success) {
        setErrors(getValidationErrors(result.error));
        return false;
      }

      return true;
    }

    if (kind === "task") {
      const validTasks = taskForm.taskRows
        .map((task) => task.text.trim())
        .filter(Boolean);
      const result = taskSchema.safeParse({
        tasks: validTasks,
      });

      if (!result.success) {
        setErrors(getValidationErrors(result.error));
        return false;
      }

      return true;
    }

    const result = ideaSchema.safeParse({
      title: ideaForm.title.trim(),
      tags: getIdeaTags(),
      color: ideaForm.color,
    });

    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return false;
    }

    return true;
  };

  const createCurrentItem = async () => {
    // Rama Nota: valida titulo/contenido/imagen y crea un recurso `note`.
    if (kind === "note") {
      const result = noteSchema.parse({
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        imageUri: noteForm.imageUri,
      });

      await createItem({
        title: result.title,
        type: "note",
        content: result.content,
        image_url: result.imageUri?.startsWith("http")
          ? result.imageUri
          : undefined,
        folder_id: noteForm.folderId,
        folderId: noteForm.folderId,
      });

      return;
    }

    // Rama Tarea: cada fila escrita se guarda como una tarea independiente.
    if (kind === "task") {
      const result = taskSchema.parse({
        tasks: taskForm.taskRows
          .map((task) => task.text.trim())
          .filter(Boolean),
      });

      await Promise.all(
        result.tasks.map((taskText) =>
          createItem({
            title: taskText,
            type: "checklist",
            content: taskText,
            text: taskText,
            folder_id: taskForm.folderId,
            folderId: taskForm.folderId,
          }),
        ),
      );

      return;
    }

    // Rama Idea: si no es nota ni tarea, se guarda como idea con tags/color.
    const result = ideaSchema.parse({
      title: ideaForm.title.trim(),
      tags: getIdeaTags(),
      color: ideaForm.color,
    });

    await createItem({
      title: result.title,
      type: "idea",
      color: result.color,
      tags: result.tags ?? [],
      folder_id: ideaForm.folderId,
      folderId: ideaForm.folderId,
    });
  };

  const finishSubmit = async (options?: { saveOtherDrafts?: boolean }) => {
    try {
      setIsSubmitting(true);
      setErrors({});

      await createCurrentItem();

      if (options?.saveOtherDrafts) {
        saveOtherKindsAsDrafts();
      }

      if (draftId) {
        deleteDraft(draftId);
      }

      await fetchItems();
      router.back();
    } catch {
      setErrors({
        title: "No se pudo guardar. Revisa la conexión con la API.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setErrors({});

    if (!validateCurrentKind()) return;

    const pendingOtherKinds = (["note", "task", "idea"] as const).filter(
      (draftKind) =>
        draftKind !== kind && hasKindContent(draftKind, forms[draftKind]),
    );

    if (!isKindLocked && pendingOtherKinds.length > 0) {
      Alert.alert(
        "Hay otros items pendientes",
        "Tienes contenido escrito en otros tipos. Elige que hacer antes de guardar.",
        [
          {
            text: "Guardar otros como borrador",
            onPress: () => {
              void finishSubmit({ saveOtherDrafts: true });
            },
          },
          {
            text: "Eliminar otros y guardar solo este",
            style: "destructive",
            onPress: () => {
              void finishSubmit();
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ],
      );
      return;
    }

    await finishSubmit();
  };

  const renderFolderOptions = () => {
    if (folders.length === 0) {
      return null;
    }

    return (
      <View style={styles.inlineOptions}>
        {folders.map((folder) => {
          const activeFolderId = forms[kind].folderId;
          const isSelected = activeFolderId === folder.id;

          return (
            <Pressable
              key={folder.id}
              onPress={() => {
                if (kind === "note") {
                  updateNoteForm({ folderId: isSelected ? null : folder.id });
                  return;
                }

                if (kind === "task") {
                  updateTaskForm({ folderId: isSelected ? null : folder.id });
                  return;
                }

                updateIdeaForm({ folderId: isSelected ? null : folder.id });
              }}
              style={[
                styles.folderChip,
                {
                  backgroundColor: theme.surface,
                  borderColor: isSelected ? theme.primary : theme.mutedText,
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
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={isCreationModeActive ? "Cancelar" : "Volver"}
            onPress={handleHeaderBackPress}
            style={[
              styles.headerButton,
              styles.headerLeading,
              { backgroundColor: theme.surface },
            ]}
          >
            <Ionicons
              color={theme.text}
              name={isCreationModeActive ? "close" : "arrow-back"}
              size={22}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.mutedText }]}>
            {headerTitle}
          </Text>
          <View style={styles.headerActions}>
            {!isEditingDraft ? (
              <ItemActionsMenu
                badgeCount={draftsCount}
                items={draftMenuItems}
                onSelect={handleMenuAction}
              />
            ) : null}
            <AnimatedHeaderAction
              delay={TRASH_ENTER_DELAY}
              visible={shouldShowClearButton}
            >
              <Pressable
                accessibilityLabel="Limpiar formulario"
                onPress={clearForm}
                style={[
                  styles.headerButton,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Ionicons
                  color={theme.mutedText}
                  name="trash-outline"
                  size={20}
                />
              </Pressable>
            </AnimatedHeaderAction>
            <AnimatedHeaderAction visible={hasCurrentKindChanges}>
              <Pressable
                accessibilityLabel="Guardar"
                disabled={isSubmitting}
                onPress={handleSubmit}
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: isSubmitting ? theme.mutedText : "#22C55E",
                  },
                ]}
              >
                <Ionicons color="#FFFFFF" name="checkmark" size={22} />
              </Pressable>
            </AnimatedHeaderAction>
          </View>
        </View>

        <TypeTabs
          collapsed={isCreationModeActive}
          selectedKind={kind}
          onSelectKind={(nextKind) => {
            setKind(nextKind);
            setErrors({});
          }}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 96 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Solo las notas permiten adjuntar imagen. */}
          {kind === "note" ? (
            <Pressable
              onPress={noteForm.imageUri ? undefined : pickImage}
              style={[styles.imagePicker, { borderColor: theme.mutedText }]}
            >
              {noteForm.imageUri ? (
                <>
                  <Image
                    resizeMode="cover"
                    source={{ uri: noteForm.imageUri }}
                    style={styles.imagePreview}
                  />
                  <View style={styles.imageOverlay}>
                    <Pressable
                      onPress={pickImage}
                      style={[
                        styles.imageActionButton,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Text
                        style={[styles.imageActionText, { color: theme.text }]}
                      >
                        Cambiar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        updateNoteForm({ imageUri: undefined });
                      }}
                      style={[
                        styles.imageActionButton,
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Text
                        style={[styles.imageActionText, { color: theme.text }]}
                      >
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
            {/* Notas e ideas tienen titulo; las tareas solo usan texto por fila. */}
            {kind !== "task" ? (
              <>
                <FormRow label="Título">
                  <TextInput
                    onChangeText={(value) => {
                      if (kind === "note") {
                        updateNoteForm({ title: value });
                        return;
                      }

                      updateIdeaForm({ title: value });
                    }}
                    onFocus={startEditing}
                    placeholder=""
                    style={[styles.rowInput, { color: theme.text }]}
                    value={kind === "note" ? noteForm.title : ideaForm.title}
                  />
                </FormRow>
                {errors.title ? (
                  <Text style={styles.error}>{errors.title}</Text>
                ) : null}
              </>
            ) : null}

            {/* Campos exclusivos de nota. */}
            {kind === "note" ? (
              <>
                <View
                  style={[
                    styles.contentRow,
                    { borderTopColor: theme.mutedText },
                  ]}
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
                    onChangeText={(value) => {
                      updateNoteForm({ content: value });
                    }}
                    onFocus={startEditing}
                    placeholder=""
                    scrollEnabled={false}
                    style={[
                      styles.rowInput,
                      styles.contentInput,
                      { color: theme.text },
                    ]}
                    textAlignVertical="top"
                    value={noteForm.content}
                  />
                </View>
                {errors.content ? (
                  <Text style={styles.error}>{errors.content}</Text>
                ) : null}
              </>
            ) : null}

            {/* Campos exclusivos de tarea. Una pantalla puede crear varias tareas. */}
            {kind === "task" ? (
              <>
                <View
                  style={[
                    styles.contentRow,
                    { borderTopColor: theme.mutedText },
                  ]}
                >
                  <View style={styles.rowLabelColumn}>
                    <Text
                      style={[
                        styles.rowLabel,
                        styles.taskRowLabelText,
                        { color: theme.mutedText },
                      ]}
                    >
                      Tareas
                    </Text>
                    <Text
                      style={[
                        styles.rowColon,
                        styles.taskRowLabelText,
                        { color: theme.mutedText },
                      ]}
                    >
                      :
                    </Text>
                  </View>
                  <View style={styles.taskRows}>
                    {taskForm.taskRows.map((taskRow, index) => (
                      <View key={taskRow.id} style={styles.taskEntryRow}>
                        <View
                          style={[
                            styles.pendingCircle,
                            { borderColor: theme.mutedText },
                          ]}
                        />
                        <TextInput
                          blurOnSubmit={false}
                          onChangeText={(value) =>
                            updateTaskRow(taskRow.id, value)
                          }
                          onFocus={startEditing}
                          onKeyPress={({ nativeEvent }) =>
                            handleTaskKeyPress(taskRow.id, nativeEvent.key)
                          }
                          onSubmitEditing={() => addTaskRowAfter(taskRow.id)}
                          placeholder={
                            index === 0 ? "Escribir tarea..." : "Nueva tarea..."
                          }
                          placeholderTextColor={theme.mutedText}
                          ref={(input) => {
                            taskInputRefs.current[taskRow.id] = input;
                          }}
                          returnKeyType="next"
                          style={[styles.taskEntryInput, { color: theme.text }]}
                          value={taskRow.text}
                        />
                        {taskForm.taskRows.length > 1 ||
                        taskRow.text.length > 0 ? (
                          <Pressable
                            accessibilityLabel="Eliminar tarea"
                            onPress={() => removeTaskRow(taskRow.id)}
                            style={styles.removeTaskButton}
                          >
                            <Ionicons
                              color={theme.mutedText}
                              name="close"
                              size={16}
                            />
                          </Pressable>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
                {errors.text ? (
                  <Text style={styles.error}>{errors.text}</Text>
                ) : null}
              </>
            ) : null}

            <FormRow label="Carpeta" verticalAlign="start">
              {renderFolderOptions()}
            </FormRow>

            {/* Campos exclusivos de idea. */}
            {kind === "idea" ? (
              <>
                <FormRow label="Tags" verticalAlign="start">
                  <View style={styles.tagsEditor}>
                    {ideaForm.tags.length > 0
                      ? ideaForm.tags.map((tag) => (
                          <Pressable
                            key={tag}
                            onPress={() => removeTag(tag)}
                            style={[
                              styles.tagChip,
                              {
                                backgroundColor: theme.surface,
                                borderColor: theme.mutedText,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagChipText,
                                { color: theme.text },
                              ]}
                            >
                              {tag}
                            </Text>
                            <Ionicons
                              color={theme.mutedText}
                              name="close"
                              size={13}
                            />
                          </Pressable>
                        ))
                      : null}
                    <TextInput
                      blurOnSubmit={false}
                      onBlur={commitTagDraft}
                      onChangeText={handleTagDraftChange}
                      onFocus={startEditing}
                      onSubmitEditing={commitTagDraft}
                      placeholder={
                        ideaForm.tags.length === 0 &&
                        ideaForm.tagDraft.length === 0
                          ? "comida, vuelos, etc"
                          : ""
                      }
                      placeholderTextColor={theme.mutedText}
                      style={[styles.tagInput, { color: theme.text }]}
                      value={ideaForm.tagDraft}
                    />
                  </View>
                </FormRow>
                <View
                  style={[
                    styles.tagSuggestionsBlock,
                    { borderTopColor: theme.mutedText },
                  ]}
                >
                  <ManageTagsButton
                    onPress={() => {
                      // TODO: navegar a la pantalla de gestión de tags.
                    }}
                  />
                  <TagSuggestions
                    availableTags={availableTags}
                    selectedTags={ideaForm.tags}
                    onChange={(nextTags) => {
                      updateIdeaForm({ tags: nextTags });
                    }}
                    variant="large"
                  />
                </View>
                <FormRow label="Color" verticalAlign="start">
                  <View style={styles.swatches}>
                    {ideaColors.map((option) => (
                      <Pressable
                        key={option}
                        accessibilityLabel={`Color ${option}`}
                        onPress={() => {
                          updateIdeaForm({ color: option });
                        }}
                        style={[
                          styles.swatch,
                          {
                            backgroundColor: option,
                            borderColor:
                              ideaForm.color === option
                                ? theme.text
                                : "transparent",
                          },
                        ]}
                      />
                    ))}
                  </View>
                </FormRow>
                {errors.color ? (
                  <Text style={styles.error}>{errors.color}</Text>
                ) : null}
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    position: "relative",
  },
  headerButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerLeading: {
    left: spacing.md,
    position: "absolute",
    top: spacing.sm,
    zIndex: 2,
  },
  headerButtonPlaceholder: {
    height: 40,
    width: 40,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
    position: "absolute",
    right: spacing.md,
    top: spacing.sm,
    zIndex: 2,
  },
  headerActionAnimated: {
    alignItems: "center",
    height: HEADER_BUTTON_SIZE,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  tabsClip: {
    marginHorizontal: spacing.md,
    overflow: "hidden",
  },
  tabs: {
    borderRadius: 100,
    flexDirection: "row",
    gap: 3,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 100,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabText: {
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
    lineHeight: 34,
  },
  rowColon: {
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 34,
  },
  taskRowLabelText: {
    lineHeight: 34,
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
  taskRows: {
    flex: 1,
    gap: spacing.xs,
  },
  taskEntryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 34,
  },
  pendingCircle: {
    borderRadius: 999,
    borderWidth: 1.5,
    height: 16,
    width: 16,
  },
  taskEntryInput: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "600",
    minHeight: 34,
    padding: 0,
  },
  removeTaskButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  rowValuePlaceholder: {
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 24,
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
    color: "#DC2626",
    fontSize: typography.small,
    paddingTop: spacing.xs,
  },
});
