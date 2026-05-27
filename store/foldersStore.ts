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
  isArchived?: boolean;
};

interface FoldersStore {
  error: string | null;
  archivedFolders: Folder[];
  folders: Folder[];
  isLoading: boolean;
  addFolder: (name: string) => Promise<Folder | null>;
  archiveFolder: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<void>;
  deleteFolderRecord: (id: string) => Promise<void>;
  fetchFolders: () => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  unarchiveFolder: (id: string) => Promise<void>;
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
    isArchived: folder.is_archived ?? folder.isArchived ?? false,
  };
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((a, b) => b.createdAt - a.createdAt);
}

function getRemoteFolderIsArchived(
  folder: RemoteFolder,
  fallback = false,
) {
  return folder.is_archived ?? folder.isArchived ?? fallback;
}

export const useFoldersStore = create<FoldersStore>((set, get) => ({
  error: null,
  archivedFolders: [],
  folders: [],
  isLoading: false,
  addFolder: async (name) => get().createFolder(name),
  archiveFolder: async (id) => {
    const folder = get().folders.find((item) => item.id === id);

    if (!folder) return;

    set((state) => ({
      archivedFolders: sortFolders([
        { ...folder, isArchived: true, updatedAt: Date.now() },
        ...state.archivedFolders,
      ]),
      error: null,
      folders: state.folders.filter((item) => item.id !== id),
    }));
  },
  createFolder: async (name) => {
    const trimmedName = name.trim();

    if (!trimmedName) return null;

    if (
      [...get().folders, ...get().archivedFolders].some(
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
        folders: sortFolders([{ ...folder, isArchived: false }, ...state.folders]),
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
        archivedFolders: state.archivedFolders.filter(
          (folder) => folder.id !== id,
        ),
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
      const currentFolders = [...get().folders, ...get().archivedFolders];
      const normalizedFolders = folders.map((folder) => {
        const currentFolder = currentFolders.find((item) => item.id === folder.id);
        const normalizedFolder = normalizeFolder(folder);

        return {
          ...normalizedFolder,
          isArchived: getRemoteFolderIsArchived(
            folder,
            currentFolder?.isArchived,
          ),
        };
      });

      set({
        archivedFolders: sortFolders(
          normalizedFolders.filter((folder) => folder.isArchived),
        ),
        error: null,
        folders: sortFolders(
          normalizedFolders.filter((folder) => !folder.isArchived),
        ),
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
  unarchiveFolder: async (id) => {
    const folder = get().archivedFolders.find((item) => item.id === id);

    if (!folder) return;

    set((state) => ({
      archivedFolders: state.archivedFolders.filter((item) => item.id !== id),
      error: null,
      folders: sortFolders([
        { ...folder, isArchived: false, updatedAt: Date.now() },
        ...state.folders,
      ]),
    }));
  },
  updateFolderName: async (id, name) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    if (
      [...get().folders, ...get().archivedFolders].some(
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
