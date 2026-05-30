import type { Folder, FolderItemCounts } from "../store/foldersStore";
import type { IdeaNote, Note, Task } from "../types";

export const ALL_FOLDERS_ID = "all";
export const NO_FOLDER_ID = "none";

export type FolderFilterId =
  | typeof ALL_FOLDERS_ID
  | typeof NO_FOLDER_ID
  | string;

export type FolderChipsContext =
  | "home"
  | "tasks"
  | "notes"
  | "ideas"
  | "archived";

type CountableItems = {
  tasks?: Task[];
  notes?: Note[];
  ideas?: IdeaNote[];
};

export type FolderChipItem = Folder & {
  counts: FolderItemCounts;
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

export function getFoldersVisibleInArchive(
  folders: Folder[],
  archivedFolders: Folder[],
  archivedItems: CountableItems,
): Folder[] {
  const archivedItemsFolderIds = new Set<string>();

  archivedItems.tasks?.forEach((task) => {
    if (task.folderId) archivedItemsFolderIds.add(task.folderId);
  });

  archivedItems.notes?.forEach((note) => {
    if (note.folderId) archivedItemsFolderIds.add(note.folderId);
  });

  archivedItems.ideas?.forEach((idea) => {
    if (idea.folderId) archivedItemsFolderIds.add(idea.folderId);
  });

  const foldersById = new Map<string, Folder>();

  folders.forEach((folder) => {
    if (archivedItemsFolderIds.has(folder.id)) {
      foldersById.set(folder.id, folder);
    }
  });

  archivedFolders.forEach((folder) => {
    foldersById.set(folder.id, folder);
  });

  return Array.from(foldersById.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
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

  items.tasks?.forEach((task) => {
    if (!task.folderId) return;

    const folder = folderMap.get(task.folderId);
    if (folder) folder.counts.tasks += 1;
  });

  items.notes?.forEach((note) => {
    if (!note.folderId) return;

    const folder = folderMap.get(note.folderId);
    if (folder) folder.counts.notes += 1;
  });

  items.ideas?.forEach((idea) => {
    if (!idea.folderId) return;

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
