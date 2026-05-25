import type { IdeaNote } from "../types";

export function parseTags(tagsText: string) {
  const seen = new Set<string>();

  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function getUniqueIdeaTags(ideas: Pick<IdeaNote, "tags">[]) {
  const seen = new Set<string>();
  const tags: string[] = [];

  ideas.forEach((idea) => {
    idea.tags.forEach((tag) => {
      const trimmedTag = tag.trim();
      const key = trimmedTag.toLowerCase();

      if (!trimmedTag || seen.has(key)) {
        return;
      }

      seen.add(key);
      tags.push(trimmedTag);
    });
  });

  return tags;
}
