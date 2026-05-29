import { defineStore } from "pinia";
import { ref } from "vue";
import {
  createFolder,
  deleteFolder,
  listFolders,
  revealDocumentsFolder,
  renameFolder,
  setFolderPinned,
  type DeleteFolderResult,
} from "../services/folders.service";
import type { FolderRecord } from "../types/folder";

export const useFoldersStore = defineStore("folders", () => {
  const folders = ref<FolderRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    isLoading.value = true;
    error.value = null;
    try {
      folders.value = await listFolders();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function create(name: string, parentId: string | null = null): Promise<FolderRecord> {
    const record = await createFolder(name, parentId);
    folders.value.push(record);
    return record;
  }

  async function rename(id: string, name: string): Promise<FolderRecord> {
    const record = await renameFolder(id, name);
    const idx = folders.value.findIndex((f) => f.id === id);
    if (idx >= 0) folders.value[idx] = record;
    return record;
  }

  async function setPinned(id: string, pinned: boolean): Promise<FolderRecord> {
    const record = await setFolderPinned(id, pinned);
    const idx = folders.value.findIndex((f) => f.id === id);
    if (idx >= 0) folders.value[idx] = record;
    return record;
  }

  async function remove(id: string): Promise<DeleteFolderResult> {
    const result = await deleteFolder(id);
    const removed = new Set(result.deletedFolderIds);
    folders.value = folders.value.filter((f) => !removed.has(f.id));
    return result;
  }

  async function revealDocumentsLocation(): Promise<void> {
    await revealDocumentsFolder();
  }

  function byId(id: string): FolderRecord | undefined {
    return folders.value.find((f) => f.id === id);
  }

  return {
    folders,
    isLoading,
    error,
    load,
    create,
    rename,
    setPinned,
    remove,
    revealDocumentsLocation,
    byId,
  };
});
