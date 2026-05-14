export interface BaseNote {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  isMarked?: boolean;
}

export interface Note extends BaseNote {
  content: string;
  imageUri?: string;
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IdeaNote extends BaseNote {
  tags: string[];
  color: string;
}

export type AnyNote = Note | Task | IdeaNote;

export type NoteKind = "note" | "task" | "idea";

export function isTask(item: AnyNote): item is Task {
  return "isCompleted" in item && "text" in item;
}

export function isIdeaNote(note: AnyNote): note is IdeaNote {
  return "tags" in note;
}

export function isTextNote(note: AnyNote): note is Note {
  return "content" in note;
}

export function getNoteKind(note: AnyNote): NoteKind {
  if (isTask(note)) return "task";
  if (isIdeaNote(note)) return "idea";
  return "note";
}
