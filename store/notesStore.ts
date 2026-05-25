import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AnyNote, IdeaNote, Note, Task } from "../types";

import {
  deleteItem as deleteRemoteItem,
  getItems,
  updateIdeaTags,
  updateItem as updateRemoteItem,
  type MinutaItem,
} from "../lib/api";

interface NotesStore {
  notes: Note[];
  tasks: Task[];
  ideas: IdeaNote[];
  hasHydrated: boolean;

  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;

  addNote: (note: Note) => void;
  addTask: (task: Task) => void;
  addIdea: (idea: IdeaNote) => void;

  updateNote: (
    id: string,
    updates: Pick<Note, "title" | "content" | "imageUri">,
  ) => Promise<void>;

  updateIdea: (
    id: string,
    updates: Pick<IdeaNote, "title" | "tags" | "color">,
  ) => Promise<void>;

  updateTask: (id: string, updates: Pick<Task, "text">) => Promise<void>;

  deleteNote: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  markAllTasksDone: () => Promise<void>;
  deleteCompletedTasks: () => Promise<void>;
  deleteAllTasks: () => Promise<void>;

  deleteAllNotes: () => Promise<void>;
  deleteAllIdeas: () => Promise<void>;

  archiveNote: (id: string) => void;
  archiveIdea: (id: string) => void;
  unarchiveNote: (id: string) => void;
  unarchiveIdea: (id: string) => void;
  markAllNotes: () => void;
  markAllIdeas: () => void;
  archiveAllNotes: () => void;
  archiveAllIdeas: () => void;
  unarchiveAllNotes: () => void;
  unarchiveAllIdeas: () => void;
  deleteAllArchivedNotes: () => Promise<void>;
  deleteAllArchivedIdeas: () => Promise<void>;
  convertIdeaToTask: (id: string) => void;
  toggleTask: (id: string) => Promise<void>;
  getItemById: (id: string) => AnyNote | undefined;
  getAllItems: () => AnyNote[];
  seedDemoData: () => void;
  setHasHydrated: (value: boolean) => void;
}

function getActivityTime(item: Pick<AnyNote, "createdAt" | "updatedAt">) {
  return (item.updatedAt ?? item.createdAt).getTime();
}

function sortByRecent<T extends Pick<AnyNote, "createdAt" | "updatedAt">>(
  items: T[],
) {
  return [...items].sort((a, b) => getActivityTime(b) - getActivityTime(a));
}

function mapRemoteNoteToLocal(item: MinutaItem): Note {
  return {
    id: item.id,
    title: item.title,
    content: item.content ?? "",
    imageUri: item.image_url ?? undefined,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

function mapRemoteIdeaToLocal(item: MinutaItem): IdeaNote {
  return {
    id: item.id,
    title: item.title,
    color: item.color ?? "#FFCC00",
    tags: item.tags ?? [],
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

function mapRemoteChecklistToLocal(item: MinutaItem): Task {
  return {
    id: item.id,
    text: item.title,
    isCompleted: item.is_completed,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      tasks: [],
      ideas: [],
      hasHydrated: false,
      isLoading: false,
      error: null,

      fetchItems: async () => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const items = await getItems();

          set({
            notes: items
              .filter((item) => item.type === "note")
              .map(mapRemoteNoteToLocal),

            ideas: items
              .filter((item) => item.type === "idea")
              .map(mapRemoteIdeaToLocal),

            tasks: items
              .filter((item) => item.type === "checklist")
              .map(mapRemoteChecklistToLocal),

            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Error al cargar los datos",
          });
        }
      },

      addNote: (note) =>
        set((state) => ({
          notes: sortByRecent([...state.notes, note]),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        })),

      addIdea: (idea) =>
        set((state) => ({
          ideas: sortByRecent([...state.ideas, idea]),
        })),

      updateNote: async (id, updates) => {
        try {
          await updateRemoteItem(id, {
            title: updates.title,
            content: updates.content,
            image_url: updates.imageUri?.startsWith("http")
              ? updates.imageUri
              : undefined,
          });

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al actualizar la nota",
          });
        }
      },

      updateIdea: async (id, updates) => {
        try {
          await updateRemoteItem(id, {
            title: updates.title,
            color: updates.color,
          });

          await updateIdeaTags(id, updates.tags ?? []);

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al actualizar la idea",
          });
        }
      },

      updateTask: async (id, updates) => {
        try {
          await updateRemoteItem(id, {
            title: updates.text,
            content: updates.text,
          });

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al actualizar la tarea",
          });
        }
      },

      deleteNote: async (id) => {
        await get().deleteItem(id);
      },

      deleteTask: async (id) => {
        await get().deleteItem(id);
      },

      deleteIdea: async (id) => {
        await get().deleteItem(id);
      },

      deleteItem: async (id) => {
        try {
          await deleteRemoteItem(id);

          set((state) => ({
            notes: state.notes.filter((note) => note.id !== id),
            tasks: state.tasks.filter((task) => task.id !== id),
            ideas: state.ideas.filter((idea) => idea.id !== id),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar el item",
          });
        }
      },

      archiveNote: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id !== id
              ? note
              : {
                  ...note,
                  isArchived: true,
                  updatedAt: new Date(),
                },
          ),
        })),

      archiveIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id !== id
              ? idea
              : {
                  ...idea,
                  isArchived: true,
                  updatedAt: new Date(),
                },
          ),
        })),

      unarchiveNote: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id !== id
              ? note
              : {
                  ...note,
                  isArchived: false,
                  updatedAt: new Date(),
                },
          ),
        })),

      unarchiveIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id !== id
              ? idea
              : {
                  ...idea,
                  isArchived: false,
                  updatedAt: new Date(),
                },
          ),
        })),

      markAllNotes: () =>
        set((state) => ({
          notes: state.notes.map((note) => ({
            ...note,
            isMarked: true,
            updatedAt: new Date(),
          })),
        })),

      markAllIdeas: () =>
        set((state) => ({
          ideas: state.ideas.map((idea) => ({
            ...idea,
            isMarked: true,
            updatedAt: new Date(),
          })),
        })),

      archiveAllNotes: () =>
        set((state) => ({
          notes: state.notes.map((note) => ({
            ...note,
            isArchived: true,
            updatedAt: new Date(),
          })),
        })),

      archiveAllIdeas: () =>
        set((state) => ({
          ideas: state.ideas.map((idea) => ({
            ...idea,
            isArchived: true,
            updatedAt: new Date(),
          })),
        })),

      unarchiveAllNotes: () =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.isArchived
              ? {
                  ...note,
                  isArchived: false,
                  updatedAt: new Date(),
                }
              : note,
          ),
        })),

      unarchiveAllIdeas: () =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.isArchived
              ? {
                  ...idea,
                  isArchived: false,
                  updatedAt: new Date(),
                }
              : idea,
          ),
        })),

      deleteAllNotes: async () => {
        try {
          const notes = get().notes;

          await Promise.all(notes.map((note) => deleteRemoteItem(note.id)));

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar todas las notas",
          });
        }
      },

      deleteAllIdeas: async () => {
        try {
          const ideas = get().ideas;

          await Promise.all(ideas.map((idea) => deleteRemoteItem(idea.id)));

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar todas las ideas",
          });
        }
      },

      deleteAllArchivedNotes: async () => {
        try {
          const archivedNotes = get().notes.filter((note) => note.isArchived);

          await Promise.all(
            archivedNotes.map((note) => deleteRemoteItem(note.id)),
          );

          set((state) => ({
            notes: state.notes.filter((note) => !note.isArchived),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las notas archivadas",
          });
        }
      },

      deleteAllArchivedIdeas: async () => {
        try {
          const archivedIdeas = get().ideas.filter((idea) => idea.isArchived);

          await Promise.all(
            archivedIdeas.map((idea) => deleteRemoteItem(idea.id)),
          );

          set((state) => ({
            ideas: state.ideas.filter((idea) => !idea.isArchived),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las ideas archivadas",
          });
        }
      },

      markAllTasksDone: async () => {
        try {
          const pendingTasks = get().tasks.filter((task) => !task.isCompleted);

          await Promise.all(
            pendingTasks.map((task) =>
              updateRemoteItem(task.id, {
                is_completed: true,
              }),
            ),
          );

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al completar las tareas",
          });
        }
      },

      deleteCompletedTasks: async () => {
        try {
          const completedTasks = get().tasks.filter((task) => task.isCompleted);

          await Promise.all(
            completedTasks.map((task) => deleteRemoteItem(task.id)),
          );

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las tareas completadas",
          });
        }
      },

      deleteAllTasks: async () => {
        try {
          const tasks = get().tasks;

          await Promise.all(tasks.map((task) => deleteRemoteItem(task.id)));

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar todas las tareas",
          });
        }
      },

      convertIdeaToTask: (id) =>
        set((state) => {
          const idea = state.ideas.find((item) => item.id === id);

          if (!idea) return state;

          const now = new Date();

          return {
            ideas: state.ideas.map((item) =>
              item.id !== id
                ? item
                : {
                    ...item,
                    isArchived: true,
                    updatedAt: now,
                  },
            ),
            tasks: [
              {
                id: `${id}-task-${now.getTime()}`,
                text: idea.title,
                isCompleted: false,
                createdAt: now,
                updatedAt: now,
              },
              ...state.tasks,
            ],
          };
        }),

      toggleTask: async (id) => {
        try {
          const task = get().tasks.find((item) => item.id === id);

          if (!task) return;

          await updateRemoteItem(id, {
            is_completed: !task.isCompleted,
          });

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al actualizar la tarea",
          });
        }
      },

      getItemById: (id) => {
        const state = get();

        return (
          state.notes.find((note) => note.id === id) ??
          state.tasks.find((task) => task.id === id) ??
          state.ideas.find((idea) => idea.id === id)
        );
      },

      getAllItems: () => {
        const state = get();

        return [
          ...state.notes.filter((note) => !note.isArchived),
          ...state.tasks,
          ...state.ideas.filter((idea) => !idea.isArchived),
        ].sort((a, b) => getActivityTime(b) - getActivityTime(a));
      },

      seedDemoData: () => {
        const state = get();

        if (
          state.notes.length > 0 ||
          state.tasks.length > 0 ||
          state.ideas.length > 0
        ) {
          return;
        }

        const now = new Date();

        set({
          notes: [
            {
              id: "demo-note-1",
              title: "Ideas para la semana",
              content:
                "Revisar prioridades y dejar espacio para capturas rápidas.",
              createdAt: now,
              updatedAt: now,
            },
            {
              id: "demo-note-2",
              title: "Notas de lectura",
              content:
                "Guardar frases útiles y convertirlas en acciones después.",
              createdAt: now,
              updatedAt: now,
            },
          ],
          tasks: [
            {
              id: "demo-task-1",
              text: "Revisar agenda",
              isCompleted: true,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: "demo-task-2",
              text: "Ordenar tareas principales",
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: "demo-task-3",
              text: "Comprar café",
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
            },
          ],
          ideas: [
            {
              id: "demo-idea-1",
              title: "Widget de captura",
              tags: ["producto", "mobile"],
              color: "#FDE68A",
              createdAt: now,
              updatedAt: now,
            },
            {
              id: "demo-idea-2",
              title: "Vista semanal",
              tags: ["organización", "dashboard"],
              color: "#7DD3FC",
              createdAt: now,
              updatedAt: now,
            },
          ],
        });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "minuta-storage-api",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: () => ({}),
      merge: (_persistedState, currentState) => currentState,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
