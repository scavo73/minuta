export type ItemAction =
  | "edit"
  | "delete"
  | "archive"
  | "unarchive"
  | "markAll"
  | "deleteAll"
  | "deleteCompleted"
  | "toggleDone"
  | "convertToTask"
  | "extractTasks"
  | "moveToFolder"
  | "editFolder"
  | "deleteFolder"
  | "deleteFolderContent"
  | "deleteFolderTasks"
  | "deleteFolderNotes"
  | "deleteFolderIdeas";

export interface ActionMenuItem {
  action: ItemAction;
  label: string;
  destructive?: boolean;
}
