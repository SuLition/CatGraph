<script setup lang="ts">
import { computed, onMounted } from "vue";
import DocumentReader from "../components/documents/DocumentReader.vue";
import DocumentTabsBar from "../components/documents/DocumentTabsBar.vue";
import DocumentEmpty from "../components/documents/DocumentEmpty.vue";
import SnippetPanel from "../components/documents/snippets/SnippetPanel.vue";
import { useDocumentsStore } from "../stores/documents.store";
import { useDocumentTabsStore } from "../stores/document-tabs.store";
import type { SnippetLocator, SnippetRecord } from "../types/snippet";

// KeepAlive(ContentArea)按组件名缓存本视图,切换导航页时不卸载,
// 已打开的标签与各阅读器实例(及其滚动/页码位置)因此得以保留。
defineOptions({ name: "DocumentsView" });

type ReaderExposed = { jumpTo: (locator: SnippetLocator) => void };

const documents = useDocumentsStore();
const tabs = useDocumentTabsStore();

// 每个常驻阅读器按文档 id 登记,跳转时只驱动当前激活的那个。
const readers = new Map<string, ReaderExposed>();
function setReader(id: string, el: unknown) {
  if (el) readers.set(id, el as ReaderExposed);
  else readers.delete(id);
}

onMounted(() => {
  if (documents.documents.length === 0) void documents.load();
});

// 仅保留仍然存在的文档(防御文档在别处被删的竞态)。
const openTabs = computed(() =>
  tabs.openIds
    .map((id) => documents.byId(id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map((doc) => ({ id: doc.id, title: doc.title, kind: doc.kind })),
);

function handleJump(snippet: SnippetRecord) {
  if (tabs.activeId) readers.get(tabs.activeId)?.jumpTo(snippet.anchor.locator);
}
</script>

<template>
  <div class="documents-view">
    <div class="documents-main">
      <DocumentTabsBar
        v-if="openTabs.length > 0"
        :tabs="openTabs"
        :active-id="tabs.activeId"
        @select="tabs.setActive"
        @close="tabs.close"
        @close-others="tabs.closeOthers"
        @close-all="tabs.closeAll"
      />
      <div class="reader-stack">
        <DocumentReader
          v-for="tab in openTabs"
          v-show="tab.id === tabs.activeId"
          :key="tab.id"
          :ref="(el) => setReader(tab.id, el)"
          :document-id="tab.id"
          :active="tab.id === tabs.activeId"
        />
        <DocumentEmpty
          v-if="openTabs.length === 0"
          :has-documents="documents.documents.length > 0"
        />
      </div>
    </div>
    <SnippetPanel :document-id="tabs.activeId" @jump="handleJump" />
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

.documents-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.reader-stack {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
</style>
