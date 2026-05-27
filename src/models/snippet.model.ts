import type { SnippetAnchor, SnippetRecord } from "../types/snippet";

export function normalizeSnippetText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export interface CreateSnippetInput {
  text: string;
  anchor: SnippetAnchor;
  note?: string;
  tags?: string[];
}

export function createSnippet(input: CreateSnippetInput): SnippetRecord {
  return {
    id: crypto.randomUUID(),
    text: normalizeSnippetText(input.text),
    anchor: input.anchor,
    note: input.note,
    createdAt: new Date().toISOString(),
    tags: input.tags,
  };
}
