import { defineStore } from "pinia";
import { ref } from "vue";
import { deleteSnippet, listSnippets, saveSnippet } from "../services/snippets.service";
import type { SnippetRecord } from "../types/snippet";

export const useSnippetsStore = defineStore("snippets", () => {
  const snippets = ref<SnippetRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    isLoading.value = true;
    error.value = null;
    try {
      snippets.value = await listSnippets();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function add(snippet: SnippetRecord) {
    const saved = await saveSnippet(snippet);
    const idx = snippets.value.findIndex((s) => s.id === saved.id);
    if (idx >= 0) snippets.value[idx] = saved;
    else snippets.value.push(saved);
  }

  async function remove(id: string) {
    await deleteSnippet(id);
    snippets.value = snippets.value.filter((s) => s.id !== id);
  }

  function byDocument(documentId: string): SnippetRecord[] {
    return snippets.value.filter((s) => s.anchor.documentId === documentId);
  }

  return { snippets, isLoading, error, load, add, remove, byDocument };
});
