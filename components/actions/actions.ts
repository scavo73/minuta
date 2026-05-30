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
  | "archiveFolder"
  | "editFolder"
  | "select"
  | "selectAll"
  | "viewDrafts"
  | "deleteFolder"
  | "deleteFolderContent"
  | "deleteFolderTasks"
  | "deleteFolderNotes"
  | "deleteFolderIdeas";

export interface ActionMenuItem {
  action: ItemAction;
  disabled?: boolean;
  label: string;
  destructive?: boolean;
}
