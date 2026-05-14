export type ItemAction =
  | "edit"
  | "delete"
  | "archive"
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
