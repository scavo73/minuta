import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { radius, spacing, typography } from '../constants/theme';
import { useMinutaTheme } from '../constants/useMinutaTheme';
import { useNotesStore } from '../store/notesStore';
import type { NoteKind } from '../types';

const noteSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  content: z.string().min(1, 'El contenido no puede estar vacío'),
  imageUri: z.string().optional(),
});

const taskSchema = z.object({
  text: z.string().min(1, 'La tarea no puede estar vacía'),
});

const ideaSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  tags: z.array(z.string()).optional(),
  color: z.string().min(1),
});

const ideaColors = [
  '#FDE68A', // amarillo
  '#7DD3FC', // azul
  '#FCA5A5', // rojo
  '#86EFAC', // verde
  '#FECACA', // coral
  '#A7F3D0', // menta
  '#FEF3C7', // crema
];

type FormErrors = Partial<Record<'title' | 'content' | 'text' | 'color', string>>;

function getValidationErrors(error: z.ZodError): FormErrors {
  return error.issues.reduce<FormErrors>((errors, issue) => {
    const key = issue.path[0]?.toString() as keyof FormErrors | undefined;

    if (key && !errors[key]) {
      errors[key] = issue.message;
    }

    return errors;
  }, {});
}

export default function NuevaNotaScreen() {
  const { theme } = useMinutaTheme();
  const { addIdea, addNote, addTask } = useNotesStore();
  const [kind, setKind] = useState<NoteKind>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [taskText, setTaskText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [color, setColor] = useState(ideaColors[0]);
  const [errors, setErrors] = useState<FormErrors>({});

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri);
    }
  };

  const handleSubmit = () => {
    const now = new Date();
    const id = Date.now().toString();

    if (kind === 'note') {
      const result = noteSchema.safeParse({
        title: title.trim(),
        content: content.trim(),
        imageUri,
      });

      if (!result.success) {
        setErrors(getValidationErrors(result.error));
        return;
      }

      addNote({
        id,
        title: result.data.title,
        content: result.data.content,
        imageUri: result.data.imageUri,
        createdAt: now,
        updatedAt: now,
      });
      router.back();
      return;
    }

    if (kind === 'task') {
      const result = taskSchema.safeParse({
        text: taskText.trim(),
      });

      if (!result.success) {
        setErrors(getValidationErrors(result.error));
        return;
      }

      addTask({
        id,
        text: result.data.text,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
      router.back();
      return;
    }

    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const result = ideaSchema.safeParse({
      title: title.trim(),
      tags,
      color,
    });

    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }

    addIdea({
      id,
      title: result.data.title,
      tags: result.data.tags ?? [],
      color: result.data.color,
      createdAt: now,
      updatedAt: now,
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <Text style={[styles.title, { color: theme.text }]}>Nueva minuta</Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.closeButton, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>
                Cerrar
              </Text>
            </Pressable>
          </View>

          <View style={styles.segmentedControl}>
            {[
              { label: 'Nota', value: 'note' },
              { label: 'Tarea', value: 'task' },
              { label: 'Idea', value: 'idea' },
            ].map((option) => {
              const isSelected = kind === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setKind(option.value as NoteKind);
                    setErrors({});
                  }}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isSelected ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {kind !== 'task' ? (
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
              {errors.title ? (
                <Text style={styles.error}>{errors.title}</Text>
              ) : null}
            </View>
          ) : null}

          {kind === 'note' ? (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>
                Contenido
              </Text>
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
                  style={[styles.secondaryButton, { backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Añadir imagen
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

          {kind === 'task' ? (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Tarea</Text>
              <TextInput
                onChangeText={setTaskText}
                placeholder="Qué tienes que hacer"
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
                value={taskText}
              />
              {errors.text ? <Text style={styles.error}>{errors.text}</Text> : null}
            </View>
          ) : null}

          {kind === 'idea' ? (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Etiquetas
                </Text>
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
                            color === option ? theme.text : 'transparent',
                        },
                      ]}
                    />
                  ))}
                </View>
                {errors.color ? (
                  <Text style={styles.error}>{errors.color}</Text>
                ) : null}
              </View>
            </>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.submitText}>Guardar</Text>
          </Pressable>
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
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    borderRadius: radius.md,
    flex: 1,
    padding: spacing.sm,
  },
  segmentText: {
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: typography.body,
    padding: spacing.md,
  },
  textArea: {
    minHeight: 140,
  },
  error: {
    color: '#DC2626',
    fontSize: typography.small,
  },
  imageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '700',
  },
  imagePreview: {
    borderRadius: radius.md,
    height: 150,
    marginTop: spacing.sm,
    width: '100%',
  },
  swatches: {
    flexDirection: 'row',
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
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
