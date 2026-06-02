import { create } from "zustand";

import {
  createFolder as createRemoteFolder,
  deleteFolder as deleteRemoteFolder,
  getArchives,
  getFolders as getRemoteFolders,
  setFolderArchived as setRemoteFolderArchived,
  updateFolder as updateRemoteFolder,
  type RemoteFolder,
} from "../lib/api";
import { firebaseAuth } from "../lib/firebase";

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
  clearFolders: () => void;
  deleteFolder: (id: string) => Promise<void>;
  deleteFolderRecord: (id: string) => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchArchivedFolders: () => Promise<void>;
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
    isArchived: folder.is_archive ?? folder.isArchive ?? false,
  };
}

function sortFolders(folders: Folder[]) {
  return [...folders].sort((a, b) => b.createdAt - a.createdAt);
}

function getRemoteFolderIsArchived(folder: RemoteFolder, fallback = false) {
  return folder.is_archive ?? folder.isArchive ?? fallback;
}

export const useFoldersStore = create<FoldersStore>((set, get) => ({
  error: null,
  archivedFolders: [],
  folders: [],
  isLoading: false,
  addFolder: async (name) => get().createFolder(name),
  clearFolders: () =>
    set({
      folders: [],
      archivedFolders: [],
      error: null,
      isLoading: false,
    }),
  archiveFolder: async (id) => {
    const folder = get().folders.find((item) => item.id === id);

    if (!folder) return;

    try {
      const archivedFolder = normalizeFolder(
        await setRemoteFolderArchived(id, true),
      );

      set((state) => ({
        archivedFolders: sortFolders([
          { ...archivedFolder, isArchived: true },
          ...state.archivedFolders,
        ]),
        error: null,
        folders: state.folders.filter((item) => item.id !== id),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Error al archivar carpeta",
      });
    }
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
        folders: sortFolders([
          { ...folder, isArchived: false },
          ...state.folders,
        ]),
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
      if (!firebaseAuth.currentUser) {
        get().clearFolders();
        return;
      }

      set({ isLoading: true, error: null });

      const folders = await getRemoteFolders();
      const currentFolders = [...get().folders, ...get().archivedFolders];
      const normalizedFolders = folders.map((folder) => {
        const currentFolder = currentFolders.find(
          (item) => item.id === folder.id,
        );
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
  fetchArchivedFolders: async () => {
    try {
      if (!firebaseAuth.currentUser) {
        get().clearFolders();
        return;
      }

      set({ isLoading: true, error: null });

      const archives = await getArchives();
      const archivedFolders = archives.folders.map((folder) => ({
        ...normalizeFolder(folder),
        isArchived: true,
      }));

      set((state) => ({
        archivedFolders: sortFolders(archivedFolders),
        error: null,
        folders: state.folders.filter(
          (folder) =>
            !archivedFolders.some(
              (archivedFolder) => archivedFolder.id === folder.id,
            ),
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar carpetas archivadas",
        isLoading: false,
      });
    }
  },

  renameFolder: async (id, name) => get().updateFolderName(id, name),
  unarchiveFolder: async (id) => {
    const folder = get().archivedFolders.find((item) => item.id === id);

    if (!folder) return;

    try {
      const restoredFolder = normalizeFolder(
        await setRemoteFolderArchived(id, false),
      );

      set((state) => ({
        archivedFolders: state.archivedFolders.filter((item) => item.id !== id),
        error: null,
        folders: sortFolders([
          { ...restoredFolder, isArchived: false },
          ...state.folders,
        ]),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al desarchivar carpeta",
      });
    }
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
          error instanceof Error ? error.message : "Error al renombrar carpeta",
      });
    }
  },
}));
