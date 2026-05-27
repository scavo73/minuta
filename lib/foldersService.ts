import type { NoteKind } from "../types";
import { useNotesStore } from "../store/notesStore";
import { useFoldersStore, type Folder } from "../store/foldersStore";
import { calculateFolderCounts, groupItemsByFolder } from "./folders";
import {
  createFolderRecord,
  deleteFolderRecord,
  updateFolderRecordName,
} from "./foldersRepository";

export { groupItemsByFolder };

export function createFolder(name: string): Promise<Folder | null> {
  return createFolderRecord(name);
}

export function updateFolderName(folderId: string, newName: string) {
  return updateFolderRecordName(folderId, newName);
}

export function archiveFolder(folderId: string) {
  return useFoldersStore.getState().archiveFolder(folderId);
}

export function unarchiveFolder(folderId: string) {
  return useFoldersStore.getState().unarchiveFolder(folderId);
}

export async function deleteFolderOnly(folderId: string) {
  await useNotesStore.getState().clearFolderItems(folderId);
  await deleteFolderRecord(folderId);
}

export async function deleteFolderWithContent(folderId: string) {
  await useNotesStore.getState().deleteFolderWithContent(folderId);
  await deleteFolderRecord(folderId);
}

export async function deleteFolderTasks(folderId: string) {
  await useNotesStore.getState().deleteFolderTasks(folderId);
}

export async function deleteFolderNotes(folderId: string) {
  await useNotesStore.getState().deleteFolderNotes(folderId);
}

export async function deleteFolderIdeas(folderId: string) {
  await useNotesStore.getState().deleteFolderIdeas(folderId);
}

export async function assignItemToFolder(
  kind: NoteKind,
  itemId: string,
  folderId: string | null,
) {
  const notesState = useNotesStore.getState();

  if (kind === "task") {
    const task = notesState.tasks.find((item) => item.id === itemId);

    if (!task) return;

    await notesState.updateTask(itemId, {
      text: task.text,
      folderId,
    });
    return;
  }

  if (kind === "idea") {
    const idea = notesState.ideas.find((item) => item.id === itemId);

    if (!idea) return;

    await notesState.updateIdea(itemId, {
      color: idea.color,
      folderId,
      tags: idea.tags,
      title: idea.title,
    });
    return;
  }

  const note = notesState.notes.find((item) => item.id === itemId);

  if (!note) return;

  await notesState.updateNote(itemId, {
    content: note.content,
    folderId,
    imageUri: note.imageUri,
    title: note.title,
  });
}

export function getFolderCounts(folderId: string) {
  const { ideas, notes, tasks } = useNotesStore.getState();

  return calculateFolderCounts(folderId, { ideas, notes, tasks });
}
