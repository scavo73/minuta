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
  | "extractTasks";

export interface ActionMenuItem {
  action: ItemAction;
  label: string;
  destructive?: boolean;
}
