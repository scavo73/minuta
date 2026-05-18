import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AnyNote, IdeaNote, Note, Task } from "../types";

interface NotesStore {
  notes: Note[];
  tasks: Task[];
  ideas: IdeaNote[];
  hasHydrated: boolean;

  addNote: (note: Note) => void;
  addTask: (task: Task) => void;
  addIdea: (idea: IdeaNote) => void;
  updateNote: (
    id: string,
    updates: Pick<Note, "title" | "content" | "imageUri">,
  ) => void;
  updateIdea: (
    id: string,
    updates: Pick<IdeaNote, "title" | "tags" | "color">,
  ) => void;
  updateTask: (id: string, updates: Pick<Task, "text">) => void;

  deleteNote: (id: string) => void;
  deleteTask: (id: string) => void;
  deleteIdea: (id: string) => void;

  archiveNote: (id: string) => void;
  archiveIdea: (id: string) => void;
  markAllNotes: () => void;
  markAllIdeas: () => void;
  archiveAllNotes: () => void;
  archiveAllIdeas: () => void;
  deleteAllNotes: () => void;
  deleteAllIdeas: () => void;
  markAllTasksDone: () => void;
  deleteCompletedTasks: () => void;
  deleteAllTasks: () => void;
  convertIdeaToTask: (id: string) => void;
  toggleTask: (id: string) => void;
  getItemById: (id: string) => AnyNote | undefined;
  deleteItem: (id: string) => void;
  getAllItems: () => AnyNote[];
  seedDemoData: () => void;
  setHasHydrated: (value: boolean) => void;
}

type PersistedNotesState = Partial<
  Pick<NotesStore, "notes" | "tasks" | "ideas">
>;

function getActivityTime(item: Pick<AnyNote, "createdAt" | "updatedAt">) {
  return (item.updatedAt ?? item.createdAt).getTime();
}

function sortByRecent<T extends Pick<AnyNote, "createdAt" | "updatedAt">>(
  items: T[],
) {
  return [...items].sort((a, b) => getActivityTime(b) - getActivityTime(a));
}

function sortTasksByCreated(items: Task[]) {
  return [...items].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

function reviveNoteDates(note: Note): Note {
  const createdAt = new Date(note.createdAt);

  return {
    ...note,
    createdAt,
    updatedAt: note.updatedAt ? new Date(note.updatedAt) : createdAt,
  };
}

function reviveTaskDates(task: Task): Task {
  const createdAt = new Date(task.createdAt);

  return {
    ...task,
    createdAt,
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : createdAt,
  };
}

function reviveIdeaDates(idea: IdeaNote): IdeaNote {
  const createdAt = new Date(idea.createdAt);

  return {
    ...idea,
    createdAt,
    updatedAt: idea.updatedAt ? new Date(idea.updatedAt) : createdAt,
  };
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      tasks: [],
      ideas: [],
      hasHydrated: false,

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

      updateNote: (id, updates) =>
        set((state) => ({
          notes: sortByRecent(
            state.notes.map((note) =>
              note.id !== id
                ? note
                : {
                    ...note,
                    ...updates,
                    updatedAt: new Date(),
                  },
            ),
          ),
        })),

      updateIdea: (id, updates) =>
        set((state) => ({
          ideas: sortByRecent(
            state.ideas.map((idea) =>
              idea.id !== id
                ? idea
                : {
                    ...idea,
                    ...updates,
                    updatedAt: new Date(),
                  },
            ),
          ),
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id !== id
              ? task
              : {
                  ...task,
                  ...updates,
                },
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      deleteIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.filter((idea) => idea.id !== id),
        })),

      archiveNote: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id !== id
              ? note
              : { ...note, isArchived: true, updatedAt: new Date() },
          ),
        })),

      archiveIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id !== id
              ? idea
              : { ...idea, isArchived: true, updatedAt: new Date() },
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

      deleteAllNotes: () => set({ notes: [] }),

      deleteAllIdeas: () => set({ ideas: [] }),

      markAllTasksDone: () =>
        set((state) => ({
          tasks: state.tasks.map((task) => ({
            ...task,
            isCompleted: true,
            updatedAt: new Date(),
          })),
        })),

      deleteCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.isCompleted),
        })),

      deleteAllTasks: () => set({ tasks: [] }),

      convertIdeaToTask: (id) =>
        set((state) => {
          const idea = state.ideas.find((item) => item.id === id);

          if (!idea) return state;

          const now = new Date();

          return {
            ideas: state.ideas.map((item) =>
              item.id !== id
                ? item
                : { ...item, isArchived: true, updatedAt: now },
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

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id !== id
              ? task
              : {
                ...task,
                isCompleted: !task.isCompleted,
                updatedAt: new Date(),
              },
          ),
        })),

      getItemById: (id) => {
        const state = get();

        return (
          state.notes.find((note) => note.id === id) ??
          state.tasks.find((task) => task.id === id) ??
          state.ideas.find((idea) => idea.id === id)
        );
      },

      deleteItem: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          tasks: state.tasks.filter((task) => task.id !== id),
          ideas: state.ideas.filter((idea) => idea.id !== id),
        })),

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
      name: "minuta-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notes: state.notes,
        tasks: state.tasks,
        ideas: state.ideas,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedNotesState;

        return {
          ...currentState,
          ...persisted,
          notes: sortByRecent(
            persisted.notes?.map((note) => reviveNoteDates(note)) ??
              currentState.notes,
          ),
          tasks: sortTasksByCreated(
            persisted.tasks?.map((task) => reviveTaskDates(task)) ??
              currentState.tasks,
          ),
          ideas: sortByRecent(
            persisted.ideas?.map((idea) => reviveIdeaDates(idea)) ??
              currentState.ideas,
          ),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
