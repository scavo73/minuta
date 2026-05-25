const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.18.34:3000/api";

export type MinutaItemType = 'note' | 'checklist' | 'idea';

export type MinutaItem = {
    id: string;
    title: string;
    content: string | null;
    type: MinutaItemType;
    image_url: string | null;
    color: string | null;
    created_at: string;
    updated_at: string;
    is_completed: boolean;
    tags: string[];
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
    image_url?: string;
    color?: string;
    is_completed?: boolean;
};


export type UpdateItemInput = Partial<CreateItemInput>;



export async function getItems(): Promise<MinutaItem[]> {
    // console.log("BASE_URL usada por la app:", BASE_URL);

    const res = await fetch(`${BASE_URL}/notes`);

    if (!res.ok) {
        throw new Error("Error al cargar items");
    }

    return res.json();
}

export async function createItem(data: CreateItemInput): Promise<MinutaItem> {
    const res = await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Error al crear item');
    }

    return res.json();
}

export async function updateItem(
    id: string,
    data: UpdateItemInput
): Promise<MinutaItem> {
    const res = await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Error al actualizar item');
    }

    return res.json();
}

export async function deleteItem(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        throw new Error('Error al eliminar item');
    }
}

export async function getChecklistItems(
    checklistId: string
): Promise<ChecklistItem[]> {
    const res = await fetch(`${BASE_URL}/notes/${checklistId}/checklist-items`);

    if (!res.ok) {
        throw new Error('Error al cargar checklist items');
    }

    return res.json();
}

export async function createChecklistItem(
    checklistId: string,
    text: string
): Promise<ChecklistItem> {
    const res = await fetch(`${BASE_URL}/notes/${checklistId}/checklist-items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!res.ok) {
        throw new Error('Error al crear checklist item');
    }

    return res.json();
}

export async function updateChecklistItem(
    itemId: string,
    data: Partial<Pick<ChecklistItem, 'text' | 'is_completed'>>
): Promise<ChecklistItem> {
    const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Error al actualizar checklist item');
    }

    return res.json();
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        throw new Error('Error al eliminar checklist item');
    }
}

export async function updateIdeaTags(
    id: string,
    tags: string[],
): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/notes/${id}/tags`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags }),
    });

    if (!res.ok) {
        throw new Error("Error al actualizar tags");
    }

    const data = await res.json();
    return data.tags;
}