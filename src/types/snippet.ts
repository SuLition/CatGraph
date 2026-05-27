export type SnippetLocator =
  | { kind: "pdf"; page: number; charStart: number; charEnd: number }
  | { kind: "text"; charStart: number; charEnd: number };

export interface SnippetAnchor {
  documentId: string;
  locator: SnippetLocator;
}

export interface SnippetRecord {
  id: string;
  text: string;
  anchor: SnippetAnchor;
  note?: string;
  createdAt: string;
  tags?: string[];
}
