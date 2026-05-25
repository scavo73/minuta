import type { Folder, FolderItemCounts } from "../store/foldersStore";
import type { IdeaNote, Note, Task } from "../types";

export const ALL_FOLDERS_ID = "all";
export const NO_FOLDER_ID = "none";

export type FolderFilterId =
  | typeof ALL_FOLDERS_ID
  | typeof NO_FOLDER_ID
  | string;

type CountableItems = {
  tasks?: Task[];
  notes?: Note[];
  ideas?: IdeaNote[];
};

export type FolderChipItem = Folder & {
  isSystem?: boolean;
};

export type FolderGroup<T> = {
  folder: Folder;
  items: T[];
};

export type GroupedFolderItems<T> = {
  folderGroups: FolderGroup<T>[];
  unfiledItems: T[];
};

function emptyCounts(): FolderItemCounts {
  return {
    tasks: 0,
    notes: 0,
    ideas: 0,
  };
}

export function calculateFolderCounts(
  folderId: string,
  items: Required<CountableItems>,
): FolderItemCounts {
  return {
    tasks: items.tasks.filter((task) => task.folderId === folderId).length,
    notes: items.notes.filter((note) => note.folderId === folderId).length,
    ideas: items.ideas.filter((idea) => idea.folderId === folderId).length,
  };
}

function hasFolder(
  folderId: string | null | undefined,
  selectedFolderId: FolderFilterId,
) {
  if (selectedFolderId === ALL_FOLDERS_ID) return true;
  if (selectedFolderId === NO_FOLDER_ID) return !folderId;

  return folderId === selectedFolderId;
}

export function matchesFolderFilter(
  item: { folderId?: string | null },
  selectedFolderId: FolderFilterId,
) {
  return hasFolder(item.folderId, selectedFolderId);
}

export function groupItemsByFolder<T extends { folderId?: string | null }>(
  items: T[],
  folders: Folder[],
): GroupedFolderItems<T> {
  const unfiledItems = items.filter((item) => !item.folderId);
  const folderGroups = folders
    .map((folder) => ({
      folder,
      items: items.filter((item) => item.folderId === folder.id),
    }))
    .filter((group) => group.items.length > 0);

  return {
    folderGroups,
    unfiledItems,
  };
}

export function buildFolderChips(
  folders: Folder[],
  items: CountableItems,
): FolderChipItem[] {
  const foldersWithCounts = folders.map<FolderChipItem>((folder) => ({
    ...folder,
    counts: emptyCounts(),
  }));
  const folderMap = new Map(
    foldersWithCounts.map((folder) => [folder.id, folder]),
  );
  const noFolderCounts = emptyCounts();

  items.tasks?.forEach((task) => {
    if (!task.folderId) {
      noFolderCounts.tasks += 1;
      return;
    }

    const folder = folderMap.get(task.folderId);
    if (folder) folder.counts.tasks += 1;
  });

  items.notes?.forEach((note) => {
    if (!note.folderId) {
      noFolderCounts.notes += 1;
      return;
    }

    const folder = folderMap.get(note.folderId);
    if (folder) folder.counts.notes += 1;
  });

  items.ideas?.forEach((idea) => {
    if (!idea.folderId) {
      noFolderCounts.ideas += 1;
      return;
    }

    const folder = folderMap.get(idea.folderId);
    if (folder) folder.counts.ideas += 1;
  });

  const allCounts = {
    tasks: (items.tasks ?? []).length,
    notes: (items.notes ?? []).length,
    ideas: (items.ideas ?? []).length,
  };

  const chips: FolderChipItem[] = [
    {
      id: ALL_FOLDERS_ID,
      name: "Todas",
      counts: allCounts,
      createdAt: 0,
      isSystem: true,
    },
    ...foldersWithCounts,
  ];

  if (foldersWithCounts.length === 0) {
    return [];
  }

  return chips;
}
