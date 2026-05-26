import { ALL_FOLDERS_ID, type FolderFilterId } from "./folders";

type EmptyStateCopy = {
  text: string;
  title: string;
};

const searchEmpty: EmptyStateCopy = {
  title: "No encontramos nada",
  text: "Prueba con otra palabra o revisa los filtros activos.",
};

const folderEmpty: EmptyStateCopy = {
  title: "Esta carpeta está vacía",
  text: "Añade contenido o mueve aquí tus notas, tareas e ideas.",
};

const archivedEmpty: EmptyStateCopy = {
  title: "Nada archivado",
  text: "Cuando archives notas, tareas o ideas, aparecerán aquí.",
};

const typeEmpty = {
  notes: {
    title: "Todavía no hay notas",
    text: "Crea tu primera nota para empezar.",
  },
  tasks: {
    title: "Todavía no hay tareas",
    text: "Añade una tarea y empieza por lo importante.",
  },
  ideas: {
    title: "Todavía no hay ideas",
    text: "Guarda cualquier idea rápida antes de que se pierda.",
  },
  home: {
    title: "Todavía no hay notas",
    text: "Crea tu primera nota para empezar.",
  },
} satisfies Record<string, EmptyStateCopy>;

export function getListEmptyState({
  hasAnyItems,
  searchQuery,
  selectedFolderId,
  type,
}: {
  hasAnyItems: boolean;
  searchQuery?: string;
  selectedFolderId: FolderFilterId;
  type: keyof typeof typeEmpty;
}) {
  if (searchQuery?.trim()) return searchEmpty;

  if (selectedFolderId !== ALL_FOLDERS_ID) return folderEmpty;

  if (!hasAnyItems) return typeEmpty[type];

  return folderEmpty;
}

export function getArchivedEmptyState() {
  return archivedEmpty;
}
