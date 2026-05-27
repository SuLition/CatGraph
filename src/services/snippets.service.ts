import { invoke } from "@tauri-apps/api/core";
import type { SnippetRecord } from "../types/snippet";

function ensureTauri() {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("Document snippets require the desktop Tauri runtime.");
  }
}

export async function listSnippets(): Promise<SnippetRecord[]> {
  ensureTauri();
  return invoke<SnippetRecord[]>("list_snippets");
}

export async function saveSnippet(snippet: SnippetRecord): Promise<SnippetRecord> {
  ensureTauri();
  return invoke<SnippetRecord>("save_snippet", { snippet });
}

export async function deleteSnippet(id: string): Promise<void> {
  ensureTauri();
  await invoke<void>("delete_snippet", { id });
}
