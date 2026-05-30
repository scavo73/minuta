import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { NoteKind } from "../types";

export interface DraftNoteValues {
  content: string;
  folderId: string | null;
  imageUri?: string;
  title: string;
}

export interface DraftTaskRow {
  id: string;
  text: string;
}

export interface DraftTaskValues {
  folderId: string | null;
  taskRows: DraftTaskRow[];
}

export interface DraftIdeaValues {
  color: string;
  folderId: string | null;
  tagDraft: string;
  tags: string[];
  title: string;
}

export interface DraftFormValues {
  idea: DraftIdeaValues;
  note: DraftNoteValues;
  task: DraftTaskValues;
}

export type ItemDraft =
  | {
      createdAt: number;
      id: string;
      kind: "note";
      updatedAt: number;
      values: DraftNoteValues;
    }
  | {
      createdAt: number;
      id: string;
      kind: "task";
      updatedAt: number;
      values: DraftTaskValues;
    }
  | {
      createdAt: number;
      id: string;
      kind: "idea";
      updatedAt: number;
      values: DraftIdeaValues;
    };

interface DraftsStore {
  drafts: ItemDraft[];
  deleteDraft: (id: string) => void;
  getDraftById: (id: string) => ItemDraft | undefined;
  upsertDraft: (
    draft: Omit<ItemDraft, "createdAt" | "id" | "updatedAt"> & {
      id?: string;
    },
  ) => string;
}

function createDraftId(kind: NoteKind) {
  return `draft-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useDraftsStore = create<DraftsStore>()(
  persist(
    (set, get) => ({
      drafts: [],

      deleteDraft: (id) =>
        set((state) => ({
          drafts: state.drafts.filter((draft) => draft.id !== id),
        })),

      getDraftById: (id) => get().drafts.find((draft) => draft.id === id),

      upsertDraft: ({ id, kind, values }) => {
        const now = Date.now();
        const draftId = id ?? createDraftId(kind);

        set((state) => {
          const existing = state.drafts.find((draft) => draft.id === draftId);
          const nextDraft = {
            createdAt: existing?.createdAt ?? now,
            id: draftId,
            kind,
            updatedAt: now,
            values,
          } as ItemDraft;

          return {
            drafts: [
              nextDraft,
              ...state.drafts.filter((draft) => draft.id !== draftId),
            ],
          };
        });

        return draftId;
      },
    }),
    {
      name: "minuta-drafts",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
