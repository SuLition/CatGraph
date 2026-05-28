<script setup lang="ts">
import { computed, ref } from "vue";
import { useDocumentsStore } from "../../stores/documents.store";
import type { SnippetLocator } from "../../types/snippet";
import DocumentEmpty from "./DocumentEmpty.vue";
import SelectionHost from "./selection/SelectionHost.vue";
import { getViewer } from "./viewers/registry";

const props = defineProps<{ documentId: string | null }>();

const documents = useDocumentsStore();
const record = computed(() => (props.documentId ? documents.byId(props.documentId) : null));
const viewer = computed(() => (record.value ? getViewer(record.value.kind) : null));
const viewerRef = ref<{ jumpToAnchor?: (locator: SnippetLocator) => Promise<void> } | null>(null);

function jumpTo(locator: SnippetLocator) {
  void viewerRef.value?.jumpToAnchor?.(locator);
}

defineExpose({ jumpTo });
</script>

<template>
  <div class="reader">
    <main class="reader-body">
      <SelectionHost
        v-if="record && viewer"
        :document-id="record.id"
        :mode="record.kind === 'pdf' ? 'pdf' : 'text'"
      >
        <component :is="viewer" ref="viewerRef" :key="record.id" :document-id="record.id" />
      </SelectionHost>
      <DocumentEmpty v-else :has-documents="documents.documents.length > 0" />
    </main>
  </div>
</template>

<style scoped>
.reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.reader-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
</style>
