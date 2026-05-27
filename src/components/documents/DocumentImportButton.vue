<script setup lang="ts">
import { ref } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { Add20Regular } from "@vicons/fluent";
import { useDocumentsStore } from "../../stores/documents.store";

const emit = defineEmits<{
  (e: "imported", id: string): void;
}>();

const documents = useDocumentsStore();
const isWorking = ref(false);
const error = ref<string | null>(null);

async function handleClick() {
  if (isWorking.value) return;
  error.value = null;
  try {
    const picked = await open({
      multiple: true,
      filters: [
        { name: "支持的文档", extensions: ["pdf", "md", "markdown", "txt"] },
        { name: "所有文件", extensions: ["*"] },
      ],
    });
    if (!picked) return;
    const paths = Array.isArray(picked) ? picked : [picked];
    isWorking.value = true;
    let lastId: string | null = null;
    for (const path of paths) {
      const record = await documents.importFromPath(path);
      lastId = record.id;
    }
    if (lastId) emit("imported", lastId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isWorking.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="import-button"
    :disabled="isWorking"
    :title="error ?? '导入文档'"
    @click="handleClick"
  >
    <Add20Regular class="icon" aria-hidden="true" />
  </button>
</template>

<style scoped>
.import-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 4px;
  background: rgb(255 255 255 / 50%);
  color: var(--muted-text-color);
  cursor: pointer;
}

.import-button:hover:not(:disabled) {
  background: var(--hover-color);
  color: var(--text-color);
}

.import-button:disabled {
  opacity: 0.5;
  cursor: progress;
}

.icon {
  width: 14px;
  height: 14px;
}
</style>
