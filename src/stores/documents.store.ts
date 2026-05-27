import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  deleteDocument,
  importDocument,
  listDocuments,
  readDocumentBytes,
} from "../services/documents.service";
import type { DocumentRecord } from "../types/document";

export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<DocumentRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    isLoading.value = true;
    error.value = null;
    try {
      documents.value = await listDocuments();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function importFromPath(srcPath: string): Promise<DocumentRecord> {
    const record = await importDocument(srcPath);
    const existing = documents.value.findIndex((d) => d.id === record.id);
    if (existing >= 0) {
      documents.value[existing] = record;
    } else {
      documents.value.push(record);
    }
    return record;
  }

  async function remove(id: string) {
    await deleteDocument(id);
    documents.value = documents.value.filter((d) => d.id !== id);
  }

  async function readBytes(id: string): Promise<Uint8Array> {
    return readDocumentBytes(id);
  }

  function byId(id: string): DocumentRecord | undefined {
    return documents.value.find((d) => d.id === id);
  }

  const recent = computed(() =>
    [...documents.value].sort((a, b) => (a.importedAt < b.importedAt ? 1 : -1)),
  );

  return { documents, isLoading, error, recent, load, importFromPath, remove, readBytes, byId };
});
