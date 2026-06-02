import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AnyNote, IdeaNote, Note, Task } from "../types";

import {
  deleteItem as deleteRemoteItem,
  getArchives,
  getItems,
  setItemArchived as setRemoteItemArchived,
  updateItem as updateRemoteItem,
  type MinutaItem,
} from "../lib/api";
import { firebaseAuth } from "../lib/firebase";

interface NotesStore {
  notes: Note[];
  tasks: Task[];
  ideas: IdeaNote[];
  hasHydrated: boolean;

  isLoading: boolean;
  error: string | null;
  clearItems: () => void;
  fetchItems: () => Promise<void>;
  fetchArchivedItems: () => Promise<void>;

  addNote: (note: Note) => void;
  addTask: (task: Task) => void;
  addIdea: (idea: IdeaNote) => void;

  updateNote: (
    id: string,
    updates: Pick<Note, "title" | "content" | "imageUri" | "folderId">,
  ) => Promise<void>;

  updateIdea: (
    id: string,
    updates: Pick<IdeaNote, "title" | "tags" | "color" | "folderId">,
  ) => Promise<void>;

  updateTask: (
    id: string,
    updates: Pick<Task, "text" | "folderId">,
  ) => Promise<void>;

  deleteNote: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  markAllTasksDone: () => Promise<void>;
  deleteCompletedTasks: () => Promise<void>;
  deleteAllTasks: () => Promise<void>;

  deleteAllNotes: () => Promise<void>;
  deleteAllIdeas: () => Promise<void>;

  archiveNote: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  archiveIdea: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  unarchiveIdea: (id: string) => Promise<void>;

  markAllNotes: () => void;
  markAllIdeas: () => void;

  archiveAllNotes: () => Promise<void>;
  archiveAllIdeas: () => Promise<void>;
  unarchiveAllNotes: () => Promise<void>;
  unarchiveAllIdeas: () => Promise<void>;

  deleteAllArchivedNotes: () => Promise<void>;
  deleteAllArchivedTasks: () => Promise<void>;
  deleteAllArchivedIdeas: () => Promise<void>;

  clearFolderItems: (folderId: string) => Promise<void>;
  deleteFolderIdeas: (folderId: string) => Promise<void>;
  deleteFolderNotes: (folderId: string) => Promise<void>;
  deleteFolderTasks: (folderId: string) => Promise<void>;
  deleteFolderWithContent: (folderId: string) => Promise<void>;
  moveIdeaToFolder: (id: string, folderId: string | null) => Promise<void>;
  moveNoteToFolder: (id: string, folderId: string | null) => Promise<void>;
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

function getRemoteFolderId(item: MinutaItem) {
  return item.folder_id ?? item.folderId ?? null;
}

function getRemoteCreatedAt(item: MinutaItem) {
  return new Date(item.created_at ?? item.createdAt ?? Date.now());
}

function getRemoteUpdatedAt(item: MinutaItem) {
  return new Date(item.updated_at ?? item.updatedAt ?? Date.now());
}

function getRemoteIsArchived(item: MinutaItem, fallback = false) {
  return item.is_archive ?? item.isArchive ?? fallback;
}

function getLocalItemType(item: AnyNote) {
  if ("isCompleted" in item) return "checklist";
  if ("tags" in item) return "idea";

  return "note";
}

function mapRemoteNoteToLocal(
  item: MinutaItem,
  fallbackIsArchived = false,
): Note {
  return {
    id: item.id,
    title: item.title,
    content: item.content ?? "",
    imageUri: item.image_url ?? item.imageUrl ?? undefined,
    createdAt: getRemoteCreatedAt(item),
    updatedAt: getRemoteUpdatedAt(item),
    folderId: getRemoteFolderId(item),
    isArchived: getRemoteIsArchived(item, fallbackIsArchived),
  };
}

function mapRemoteIdeaToLocal(
  item: MinutaItem,
  fallbackIsArchived = false,
): IdeaNote {
  return {
    id: item.id,
    title: item.title,
    color: item.color ?? "#FFCC00",
    tags: item.tags ?? [],
    createdAt: getRemoteCreatedAt(item),
    updatedAt: getRemoteUpdatedAt(item),
    folderId: getRemoteFolderId(item),
    isArchived: getRemoteIsArchived(item, fallbackIsArchived),
  };
}

function mapRemoteChecklistToLocal(
  item: MinutaItem,
  fallbackIsArchived = false,
): Task {
  return {
    id: item.id,
    text: item.text ?? item.content ?? item.title,
    isCompleted: item.is_completed ?? item.isCompleted ?? false,
    createdAt: getRemoteCreatedAt(item),
    updatedAt: getRemoteUpdatedAt(item),
    folderId: getRemoteFolderId(item),
    isArchived: getRemoteIsArchived(item, fallbackIsArchived),
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

      clearItems: () =>
        set({
          notes: [],
          tasks: [],
          ideas: [],
          error: null,
          isLoading: false,
        }),

      fetchItems: async () => {
        try {
          if (!firebaseAuth.currentUser) {
            get().clearItems();
            return;
          }

          set({
            isLoading: true,
            error: null,
          });

          const items = await getItems();
          const currentState = get();
          const activeNotes = items
            .filter((item) => item.type === "note")
            .map((item) => mapRemoteNoteToLocal(item, false));
          const activeIdeas = items
            .filter((item) => item.type === "idea")
            .map((item) => mapRemoteIdeaToLocal(item, false));
          const activeTasks = items
            .filter((item) => item.type === "checklist")
            .map((item) => mapRemoteChecklistToLocal(item, false));

          console.log("[FETCH ITEMS COUNTS]", {
            notes: activeNotes.length,
            tasks: activeTasks.length,
            ideas: activeIdeas.length,
          });

          const activeNoteIds = new Set(activeNotes.map((note) => note.id));
          const activeIdeaIds = new Set(activeIdeas.map((idea) => idea.id));
          const activeTaskIds = new Set(activeTasks.map((task) => task.id));

          set({
            notes: sortByRecent([
              ...activeNotes,
              ...currentState.notes.filter(
                (note) => note.isArchived && !activeNoteIds.has(note.id),
              ),
            ]),
            ideas: sortByRecent([
              ...activeIdeas,
              ...currentState.ideas.filter(
                (idea) => idea.isArchived && !activeIdeaIds.has(idea.id),
              ),
            ]),
            tasks: sortByRecent([
              ...activeTasks,
              ...currentState.tasks.filter(
                (task) => task.isArchived && !activeTaskIds.has(task.id),
              ),
            ]),

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

      fetchArchivedItems: async () => {
        try {
          if (!firebaseAuth.currentUser) {
            get().clearItems();
            return;
          }

          set({
            isLoading: true,
            error: null,
          });

          const archives = await getArchives();

          set({
            notes: sortByRecent([
              ...get().notes.filter((note) => !note.isArchived),
              ...archives.items
                .filter((item) => item.type === "note")
                .map((item) => mapRemoteNoteToLocal(item, true)),
            ]),
            ideas: sortByRecent([
              ...get().ideas.filter((idea) => !idea.isArchived),
              ...archives.items
                .filter((item) => item.type === "idea")
                .map((item) => mapRemoteIdeaToLocal(item, true)),
            ]),
            tasks: sortByRecent([
              ...get().tasks.filter((task) => !task.isArchived),
              ...archives.items
                .filter((item) => item.type === "checklist")
                .map((item) => mapRemoteChecklistToLocal(item, true)),
            ]),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Error al cargar archivados",
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
            type: "note",
            title: updates.title,
            content: updates.content,
            image_url: updates.imageUri?.startsWith("http")
              ? updates.imageUri
              : undefined,
            folder_id: updates.folderId ?? null,
            folderId: updates.folderId ?? null,
          });

          set((state) => ({
            notes: sortByRecent(
              state.notes.map((note) =>
                note.id === id
                  ? {
                      ...note,
                      title: updates.title,
                      content: updates.content,
                      imageUri: updates.imageUri,
                      folderId: updates.folderId ?? null,
                      updatedAt: new Date(),
                    }
                  : note,
              ),
            ),
            error: null,
          }));

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
            type: "idea",
            title: updates.title,
            color: updates.color,
            tags: updates.tags ?? [],
            folder_id: updates.folderId ?? null,
            folderId: updates.folderId ?? null,
          });

          set((state) => ({
            ideas: sortByRecent(
              state.ideas.map((idea) =>
                idea.id === id
                  ? {
                      ...idea,
                      title: updates.title,
                      color: updates.color,
                      tags: updates.tags ?? [],
                      folderId: updates.folderId ?? null,
                      updatedAt: new Date(),
                    }
                  : idea,
              ),
            ),
            error: null,
          }));

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
            type: "checklist",
            title: updates.text,
            content: updates.text,
            text: updates.text,
            folder_id: updates.folderId ?? null,
            folderId: updates.folderId ?? null,
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
          const state = get();
          const type = state.tasks.some((task) => task.id === id)
            ? "checklist"
            : state.ideas.some((idea) => idea.id === id)
              ? "idea"
              : "note";

          await deleteRemoteItem(id, type);

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

      archiveNote: async (id) => {
        try {
          await setRemoteItemArchived(id, "note", true);

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
            error: null,
          }));

          await get().fetchArchivedItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al archivar la nota",
          });
        }
      },

      archiveTask: async (id) => {
        try {
          await setRemoteItemArchived(id, "checklist", true);

          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id !== id
                ? task
                : {
                    ...task,
                    isArchived: true,
                    updatedAt: new Date(),
                  },
            ),
            error: null,
          }));

          await get().fetchArchivedItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al archivar la tarea",
          });
        }
      },

      archiveIdea: async (id) => {
        try {
          await setRemoteItemArchived(id, "idea", true);

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
            error: null,
          }));

          await get().fetchArchivedItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al archivar la idea",
          });
        }
      },

      unarchiveNote: async (id) => {
        try {
          await setRemoteItemArchived(id, "note", false);

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
            error: null,
          }));

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al desarchivar la nota",
          });
        }
      },

      unarchiveTask: async (id) => {
        try {
          await setRemoteItemArchived(id, "checklist", false);

          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id !== id
                ? task
                : {
                    ...task,
                    isArchived: false,
                    updatedAt: new Date(),
                  },
            ),
            error: null,
          }));

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al desarchivar la tarea",
          });
        }
      },

      unarchiveIdea: async (id) => {
        try {
          await setRemoteItemArchived(id, "idea", false);

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
            error: null,
          }));

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al desarchivar la idea",
          });
        }
      },

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

      archiveAllNotes: async () => {
        try {
          const activeNotes = get().notes.filter((note) => !note.isArchived);

          await Promise.all(
            activeNotes.map((note) =>
              setRemoteItemArchived(note.id, "note", true),
            ),
          );

          await get().fetchArchivedItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al archivar todas las notas",
          });
        }
      },

      archiveAllIdeas: async () => {
        try {
          const activeIdeas = get().ideas.filter((idea) => !idea.isArchived);

          await Promise.all(
            activeIdeas.map((idea) =>
              setRemoteItemArchived(idea.id, "idea", true),
            ),
          );

          await get().fetchArchivedItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al archivar todas las ideas",
          });
        }
      },

      unarchiveAllNotes: async () => {
        try {
          const archivedNotes = get().notes.filter((note) => note.isArchived);

          await Promise.all(
            archivedNotes.map((note) =>
              setRemoteItemArchived(note.id, "note", false),
            ),
          );

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al desarchivar todas las notas",
          });
        }
      },

      unarchiveAllIdeas: async () => {
        try {
          const archivedIdeas = get().ideas.filter((idea) => idea.isArchived);

          await Promise.all(
            archivedIdeas.map((idea) =>
              setRemoteItemArchived(idea.id, "idea", false),
            ),
          );

          await get().fetchItems();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al desarchivar todas las ideas",
          });
        }
      },

      deleteAllNotes: async () => {
        try {
          const notes = get().notes;

          await Promise.all(
            notes.map((note) => deleteRemoteItem(note.id, "note")),
          );

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

          await Promise.all(
            ideas.map((idea) => deleteRemoteItem(idea.id, "idea")),
          );

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
            archivedNotes.map((note) => deleteRemoteItem(note.id, "note")),
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

      deleteAllArchivedTasks: async () => {
        try {
          const archivedTasks = get().tasks.filter((task) => task.isArchived);

          await Promise.all(
            archivedTasks.map((task) => deleteRemoteItem(task.id, "checklist")),
          );

          set((state) => ({
            tasks: state.tasks.filter((task) => !task.isArchived),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las tareas archivadas",
          });
        }
      },

      deleteAllArchivedIdeas: async () => {
        try {
          const archivedIdeas = get().ideas.filter((idea) => idea.isArchived);

          await Promise.all(
            archivedIdeas.map((idea) => deleteRemoteItem(idea.id, "idea")),
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

      clearFolderItems: async (folderId) => {
        try {
          const state = get();
          const items = [
            ...state.notes.filter((note) => note.folderId === folderId),
            ...state.ideas.filter((idea) => idea.folderId === folderId),
            ...state.tasks.filter((task) => task.folderId === folderId),
          ];

          await Promise.all(
            items.map((item) =>
              updateRemoteItem(item.id, {
                folder_id: null,
                folderId: null,
                type: getLocalItemType(item),
              }),
            ),
          );

          set((currentState) => ({
            notes: currentState.notes.map((note) =>
              note.folderId === folderId ? { ...note, folderId: null } : note,
            ),
            ideas: currentState.ideas.map((idea) =>
              idea.folderId === folderId ? { ...idea, folderId: null } : idea,
            ),
            tasks: currentState.tasks.map((task) =>
              task.folderId === folderId ? { ...task, folderId: null } : task,
            ),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al quitar la carpeta de los items",
          });
        }
      },

      deleteFolderTasks: async (folderId) => {
        try {
          const tasks = get().tasks.filter(
            (task) => task.folderId === folderId,
          );

          await Promise.all(
            tasks.map((task) => deleteRemoteItem(task.id, "checklist")),
          );

          set((state) => ({
            tasks: state.tasks.filter((task) => task.folderId !== folderId),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las tareas de la carpeta",
          });
        }
      },

      deleteFolderNotes: async (folderId) => {
        try {
          const notes = get().notes.filter(
            (note) => note.folderId === folderId,
          );

          await Promise.all(
            notes.map((note) => deleteRemoteItem(note.id, "note")),
          );

          set((state) => ({
            notes: state.notes.filter((note) => note.folderId !== folderId),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las notas de la carpeta",
          });
        }
      },

      deleteFolderIdeas: async (folderId) => {
        try {
          const ideas = get().ideas.filter(
            (idea) => idea.folderId === folderId,
          );

          await Promise.all(
            ideas.map((idea) => deleteRemoteItem(idea.id, "idea")),
          );

          set((state) => ({
            ideas: state.ideas.filter((idea) => idea.folderId !== folderId),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Error al eliminar las ideas de la carpeta",
          });
        }
      },

      deleteFolderWithContent: async (folderId) => {
        await get().deleteFolderTasks(folderId);
        await get().deleteFolderNotes(folderId);
        await get().deleteFolderIdeas(folderId);
      },

      moveIdeaToFolder: async (id, folderId) => {
        try {
          await updateRemoteItem(id, {
            type: "idea",
            folder_id: folderId,
            folderId,
          });

          set((state) => ({
            ideas: state.ideas.map((idea) =>
              idea.id === id ? { ...idea, folderId } : idea,
            ),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Error al mover la idea",
          });
        }
      },

      moveNoteToFolder: async (id, folderId) => {
        try {
          await updateRemoteItem(id, {
            type: "note",
            folder_id: folderId,
            folderId,
          });

          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id ? { ...note, folderId } : note,
            ),
            error: null,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Error al mover la nota",
          });
        }
      },

      markAllTasksDone: async () => {
        try {
          const pendingTasks = get().tasks.filter((task) => !task.isCompleted);

          await Promise.all(
            pendingTasks.map((task) =>
              updateRemoteItem(task.id, {
                type: "checklist",
                is_completed: true,
                isCompleted: true,
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
            completedTasks.map((task) =>
              deleteRemoteItem(task.id, "checklist"),
            ),
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

          await Promise.all(
            tasks.map((task) => deleteRemoteItem(task.id, "checklist")),
          );

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
                folderId: idea.folderId ?? null,
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
            type: "checklist",
            is_completed: !task.isCompleted,
            isCompleted: !task.isCompleted,
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
          ...state.tasks.filter((task) => !task.isArchived),
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
