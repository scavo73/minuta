import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type FolderItemCounts = {
  tasks: number;
  notes: number;
  ideas: number;
};

export type Folder = {
  id: string;
  name: string;
  counts: FolderItemCounts;
  createdAt: number;
};

interface FoldersStore {
  folders: Folder[];
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
}

const emptyCounts: FolderItemCounts = {
  tasks: 0,
  notes: 0,
  ideas: 0,
};

export const useFoldersStore = create<FoldersStore>()(
  persist(
    (set) => ({
      folders: [],
      addFolder: (name) => {
        const trimmedName = name.trim();

        if (!trimmedName) return;

        set((state) => ({
          folders: state.folders.some(
            (folder) => folder.name.toLowerCase() === trimmedName.toLowerCase(),
          )
            ? state.folders
            : [
                {
                  id: `folder-${Date.now()}`,
                  name: trimmedName,
                  counts: emptyCounts,
                  createdAt: Date.now(),
                },
                ...state.folders,
              ],
        }));
      },
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
        })),
      renameFolder: (id, name) => {
        const trimmedName = name.trim();

        if (!trimmedName) return;

        set((state) => ({
          folders: state.folders.some(
            (folder) =>
              folder.id !== id &&
              folder.name.toLowerCase() === trimmedName.toLowerCase(),
          )
            ? state.folders
            : state.folders.map((folder) =>
                folder.id === id
                  ? {
                      ...folder,
                      name: trimmedName,
                    }
                  : folder,
              ),
        }));
      },
    }),
    {
      name: "minuta-folders",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
