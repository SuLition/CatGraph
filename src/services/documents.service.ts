import { invoke } from "@tauri-apps/api/core";
import type { DocumentRecord } from "../types/document";

function ensureTauri() {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("Document import requires the desktop Tauri runtime.");
  }
}

export async function importDocument(srcPath: string): Promise<DocumentRecord> {
  ensureTauri();
  return invoke<DocumentRecord>("import_document", { srcPath });
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  ensureTauri();
  return invoke<DocumentRecord[]>("list_documents");
}

export async function readDocumentBytes(id: string): Promise<Uint8Array> {
  ensureTauri();
  const raw = await invoke<number[]>("read_document_bytes", { id });
  return new Uint8Array(raw);
}

export async function deleteDocument(id: string): Promise<void> {
  ensureTauri();
  await invoke<void>("delete_document", { id });
}
