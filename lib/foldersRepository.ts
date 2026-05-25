import { useFoldersStore, type Folder } from "../store/foldersStore";

export function getFolders(): Folder[] {
  return useFoldersStore.getState().folders;
}

export function getFolderById(folderId: string): Folder | undefined {
  return getFolders().find((folder) => folder.id === folderId);
}

export function createFolderRecord(name: string): Promise<Folder | null> {
  return useFoldersStore.getState().createFolder(name);
}

export function updateFolderRecordName(folderId: string, name: string) {
  return useFoldersStore.getState().updateFolderName(folderId, name);
}

export function deleteFolderRecord(folderId: string) {
  return useFoldersStore.getState().deleteFolderRecord(folderId);
}
