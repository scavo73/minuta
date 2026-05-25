import { create } from "zustand";

import {
  createFolder as createRemoteFolder,
  deleteFolder as deleteRemoteFolder,
  getFolders as getRemoteFolders,
  updateFolder as updateRemoteFolder,
  type RemoteFolder,
} from "../lib/api";

export type FolderItemCounts = {
  tasks: number;
  notes: number;
  ideas: number;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
};

interface FoldersStore {
  error: string | null;
  folders: Folder[];
  isLoading: boolean;
  addFolder: (name: string) => Promise<Folder | null>;
  createFolder: (name: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<void>;
  deleteFolderRecord: (id: string) => Promise<void>;
  fetchFolders: () => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  updateFolderName: (id: string, name: string) => Promise<void>;
}

function parseTime(value: RemoteFolder["created_at"]) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();

  return Date.now();
}

function normalizeFolder(folder: RemoteFolder): Folder {
  const updatedAt = folder.updated_at ?? folder.updatedAt;

  return {
    id: folder.id,
    name: folder.name,
    createdAt: parseTime(folder.created_at ?? folder.createdAt),
    updatedAt: updatedAt == null ? undefined : parseTime(updatedAt),
  };
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((a, b) => b.createdAt - a.createdAt);
}

export const useFoldersStore = create<FoldersStore>((set, get) => ({
  error: null,
  folders: [],
  isLoading: false,
  addFolder: async (name) => get().createFolder(name),
  createFolder: async (name) => {
    const trimmedName = name.trim();

    if (!trimmedName) return null;

    if (
      get().folders.some(
        (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      return null;
    }

    try {
      const folder = normalizeFolder(
        await createRemoteFolder({ name: trimmedName }),
      );

      set((state) => ({
        error: null,
        folders: sortFolders([folder, ...state.folders]),
      }));

      return folder;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Error al crear carpeta",
      });

      return null;
    }
  },
  deleteFolder: async (id) => get().deleteFolderRecord(id),
  deleteFolderRecord: async (id) => {
    try {
      await deleteRemoteFolder(id);

      set((state) => ({
        error: null,
        folders: state.folders.filter((folder) => folder.id !== id),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Error al borrar carpeta",
      });
    }
  },
  fetchFolders: async () => {
    try {
      set({ isLoading: true, error: null });

      const folders = await getRemoteFolders();

      set({
        error: null,
        folders: sortFolders(folders.map(normalizeFolder)),
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Error al cargar carpetas",
        isLoading: false,
      });
    }
  },
  renameFolder: async (id, name) => get().updateFolderName(id, name),
  updateFolderName: async (id, name) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    if (
      get().folders.some(
        (folder) =>
          folder.id !== id &&
          folder.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      return;
    }

    try {
      const folder = normalizeFolder(
        await updateRemoteFolder(id, { name: trimmedName }),
      );

      set((state) => ({
        error: null,
        folders: sortFolders(
          state.folders.map((item) => (item.id === id ? folder : item)),
        ),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al renombrar carpeta",
      });
    }
  },
}));
