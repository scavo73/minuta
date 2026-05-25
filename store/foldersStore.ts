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
          folders: [
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
    }),
    {
      name: "minuta-folders",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
