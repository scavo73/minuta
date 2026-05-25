const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.18.34:3000/api";

export type MinutaItemType = "note" | "checklist" | "idea";

export type RemoteFolder = {
  id: string;
  name: string;
  created_at?: string | number;
  createdAt?: string | number;
  updated_at?: string | number | null;
  updatedAt?: string | number | null;
};

export type MinutaItem = {
  id: string;
  title: string;
  content?: string | null;
  text?: string | null;
  type?: MinutaItemType;
  image_url?: string | null;
  imageUrl?: string | null;
  color?: string | null;
  created_at?: string | number;
  createdAt?: string | number;
  updated_at?: string | number;
  updatedAt?: string | number;
  is_completed?: boolean;
  isCompleted?: boolean;
  folder_id?: string | null;
  folderId?: string | null;
  tags?: string[];
};

export type ChecklistItem = {
  id: string;
  note_id: string;
  text: string;
  is_completed: boolean;
};

export type CreateItemInput = {
  title: string;
  type: MinutaItemType;
  content?: string;
  text?: string;
  image_url?: string;
  imageUrl?: string;
  color?: string;
  tags?: string[];
  is_completed?: boolean;
  isCompleted?: boolean;
  folder_id?: string | null;
  folderId?: string | null;
};

export type UpdateItemInput = Partial<CreateItemInput>;

function withFolderAliases<T extends CreateItemInput | UpdateItemInput>(
  data: T,
) {
  const hasFolderValue = "folder_id" in data || "folderId" in data;

  if (!hasFolderValue) return data;

  const folderId = data.folder_id ?? data.folderId ?? null;

  return {
    ...data,
    folder_id: folderId,
    folderId,
  };
}

function getResourceForType(type: MinutaItemType) {
  if (type === "checklist") return "tasks";
  if (type === "idea") return "ideas";
  return "notes";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    throw new Error(`Error en ${path}`);
  }

  return res.json();
}

async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    throw new Error(`Error en ${path}`);
  }
}

function jsonInit(method: "POST" | "PATCH" | "PUT", data: unknown) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

function withoutType<T extends CreateItemInput | UpdateItemInput>(data: T) {
  const { type: _type, ...payload } = data;

  return payload;
}

export async function getFolders(): Promise<RemoteFolder[]> {
  return requestJson("/folders");
}

export async function createFolder(data: {
  name: string;
}): Promise<RemoteFolder> {
  return requestJson("/folders", jsonInit("POST", data));
}

export async function updateFolder(
  id: string,
  data: { name: string },
): Promise<RemoteFolder> {
  return requestJson(`/folders/${id}`, jsonInit("PATCH", data));
}

export async function deleteFolder(id: string): Promise<void> {
  return requestVoid(`/folders/${id}`, { method: "DELETE" });
}

export async function getNotes(): Promise<MinutaItem[]> {
  return requestJson("/notes");
}

export async function getTasks(): Promise<MinutaItem[]> {
  return requestJson("/tasks");
}

export async function getIdeas(): Promise<MinutaItem[]> {
  return requestJson("/ideas");
}

export async function getItems(): Promise<MinutaItem[]> {
  const [notes, tasks, ideas] = await Promise.all([
    getNotes(),
    getTasks(),
    getIdeas(),
  ]);

  return [
    ...notes.map((item) => ({ ...item, type: "note" as const })),
    ...tasks.map((item) => ({ ...item, type: "checklist" as const })),
    ...ideas.map((item) => ({ ...item, type: "idea" as const })),
  ];
}

export async function createItem(data: CreateItemInput): Promise<MinutaItem> {
  const resource = getResourceForType(data.type);
  const payload = withoutType(data);

  return requestJson(
    `/${resource}`,
    jsonInit("POST", withFolderAliases(payload)),
  );
}

export async function updateItem(
  id: string,
  data: UpdateItemInput,
): Promise<MinutaItem> {
  const resource = getResourceForType(data.type ?? "note");
  const payload = withoutType(data);

  return requestJson(
    `/${resource}/${id}`,
    jsonInit("PATCH", withFolderAliases(payload)),
  );
}

export async function deleteItem(
  id: string,
  type: MinutaItemType = "note",
): Promise<void> {
  const resource = getResourceForType(type);

  return requestVoid(`/${resource}/${id}`, {
    method: "DELETE",
  });
}

export async function getChecklistItems(
  checklistId: string,
): Promise<ChecklistItem[]> {
  return requestJson(`/tasks/${checklistId}/checklist-items`);
}

export async function createChecklistItem(
  checklistId: string,
  text: string,
): Promise<ChecklistItem> {
  return requestJson(
    `/tasks/${checklistId}/checklist-items`,
    jsonInit("POST", { text }),
  );
}

export async function updateChecklistItem(
  itemId: string,
  data: Partial<Pick<ChecklistItem, "text" | "is_completed">>,
): Promise<ChecklistItem> {
  return requestJson(`/checklist-items/${itemId}`, jsonInit("PATCH", data));
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  return requestVoid(`/checklist-items/${itemId}`, {
    method: "DELETE",
  });
}
