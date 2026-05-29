<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DocumentReader from "../components/documents/DocumentReader.vue";
import SnippetPanel from "../components/documents/snippets/SnippetPanel.vue";
import { useDocumentsStore } from "../stores/documents.store";
import { useWorkspaceStore } from "../stores/workspace.store";
import type { SnippetLocator, SnippetRecord } from "../types/snippet";

const documents = useDocumentsStore();
const workspace = useWorkspaceStore();
const readerRef = ref<{ jumpTo: (locator: SnippetLocator) => void } | null>(null);

onMounted(() => {
  if (documents.documents.length === 0) {
    void documents.load();
  }
});

const selectedId = computed(() => {
  const id = workspace.selectedSideListIds.documents;
  if (!id) return null;
  return documents.byId(id) ? id : null;
});

function handleJump(snippet: SnippetRecord) {
  readerRef.value?.jumpTo(snippet.anchor.locator);
}
</script>

<template>
  <div class="documents-view">
    <DocumentReader ref="readerRef" :document-id="selectedId" />
    <SnippetPanel :document-id="selectedId" @jump="handleJump" />
  </div>
</template>

<style scoped>
.documents-view {
  display: flex;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
</style>
