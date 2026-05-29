import { invoke } from "@tauri-apps/api/core";
import type { FolderRecord } from "../types/folder";

function ensureTauri() {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("Folder operations require the desktop Tauri runtime.");
  }
}

export interface DeleteFolderResult {
  deletedFolderIds: string[];
  deletedDocumentIds: string[];
}

export async function listFolders(): Promise<FolderRecord[]> {
  ensureTauri();
  return invoke<FolderRecord[]>("list_folders");
}

export async function createFolder(
  name: string,
  parentId: string | null = null,
): Promise<FolderRecord> {
  ensureTauri();
  return invoke<FolderRecord>("create_folder", { name, parentId });
}

export async function renameFolder(id: string, name: string): Promise<FolderRecord> {
  ensureTauri();
  return invoke<FolderRecord>("rename_folder", { id, name });
}

export async function setFolderPinned(id: string, pinned: boolean): Promise<FolderRecord> {
  ensureTauri();
  return invoke<FolderRecord>("set_folder_pinned", { id, pinned });
}

export async function deleteFolder(id: string): Promise<DeleteFolderResult> {
  ensureTauri();
  return invoke<DeleteFolderResult>("delete_folder", { id });
}

export async function revealDocumentsFolder(): Promise<void> {
  ensureTauri();
  await invoke<void>("reveal_documents_folder");
}
