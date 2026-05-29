export type DocumentKind = "pdf" | "markdown" | "text" | "docx" | "xlsx";

export interface DocumentRecord {
  id: string;
  title: string;
  kind: DocumentKind;
  originalName: string;
  storedPath: string;
  byteSize: number;
  contentHash: string;
  importedAt: string;
  lastOpenedAt?: string;
  tags?: string[];
  folderId?: string | null;
}
