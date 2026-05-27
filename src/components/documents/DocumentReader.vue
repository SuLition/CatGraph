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
    <header v-if="record" class="reader-header">
      <h1 class="reader-title">{{ record.title }}</h1>
      <div class="reader-meta">
        <span class="kind-chip">{{ record.kind.toUpperCase() }}</span>
        <span class="meta-text">{{ record.originalName }}</span>
      </div>
    </header>
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

.reader-header {
  flex: 0 0 auto;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-color);
  background: rgb(255 255 255 / 35%);
}

.reader-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.reader-meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--subtle-text-color);
}

.kind-chip {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--accent-color) 14%, transparent);
  color: var(--accent-color);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.meta-text {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.reader-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
</style>
