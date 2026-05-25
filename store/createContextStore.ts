import { create } from "zustand";

import type { NoteKind } from "../types";

interface CreateContextStore {
  folderId: string | null;
  kind: NoteKind;
  setCreateContext: (context: {
    folderId?: string | null;
    kind: NoteKind;
  }) => void;
}

export const useCreateContextStore = create<CreateContextStore>((set) => ({
  folderId: null,
  kind: "note",
  setCreateContext: ({ folderId = null, kind }) => set({ folderId, kind }),
}));
