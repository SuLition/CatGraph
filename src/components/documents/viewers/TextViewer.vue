<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import MarkdownIt from "markdown-it";
import { useDocumentsStore } from "../../../stores/documents.store";
import type { SnippetLocator } from "../../../types/snippet";

const props = defineProps<{ documentId: string }>();

const documents = useDocumentsStore();
const viewerRoot = ref<HTMLElement | null>(null);
const html = ref("");
const plain = ref("");
const error = ref<string | null>(null);
const isLoading = ref(true);

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

async function load() {
  isLoading.value = true;
  error.value = null;
  html.value = "";
  plain.value = "";
  try {
    const record = documents.byId(props.documentId);
    if (!record) throw new Error(`document not found: ${props.documentId}`);
    const bytes = await documents.readBytes(props.documentId);
    const text = new TextDecoder("utf-8").decode(bytes);
    if (record.kind === "markdown") {
      html.value = md.render(text);
    } else {
      plain.value = text;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isLoading.value = false;
  }
}

async function jumpToAnchor(locator: SnippetLocator) {
  if (locator.kind !== "text" || !viewerRoot.value) return;

  const walker = document.createTreeWalker(viewerRoot.value, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.data.length;
    if (!startNode && consumed + len >= locator.charStart) {
      startNode = node;
      startOffset = locator.charStart - consumed;
    }
    if (consumed + len >= locator.charEnd) {
      endNode = node;
      endOffset = locator.charEnd - consumed;
      break;
    }
    consumed += len;
  }

  if (!startNode || !endNode) return;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const rect = range.getBoundingClientRect();
  const rootRect = viewerRoot.value.getBoundingClientRect();
  viewerRoot.value.scrollBy({ top: rect.top - rootRect.top - rootRect.height * 0.28, behavior: "smooth" });

  window.dispatchEvent(new CustomEvent("catgraph:programmatic-selection"));
  window.setTimeout(() => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    window.setTimeout(() => selection?.removeAllRanges(), 1800);
  }, 180);
}

onMounted(load);
watch(() => props.documentId, load);

defineExpose({ jumpToAnchor });
</script>

<template>
  <div ref="viewerRoot" class="text-viewer">
    <p v-if="isLoading" class="text-state">读取中...</p>
    <p v-else-if="error" class="text-state error">{{ error }}</p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <article v-else-if="html" class="markdown-body" v-html="html" />
    <pre v-else class="plain-text">{{ plain }}</pre>
  </div>
</template>

<style scoped>
.text-viewer {
  height: 100%;
  overflow-y: auto;
  padding: 24px 32px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-color);
}

.text-state {
  color: var(--muted-text-color);
  font-size: 13px;
}

.text-state.error {
  color: #d44747;
}

.markdown-body :deep(h1) {
  font-size: 22px;
  margin: 0.6em 0;
}

.markdown-body :deep(h2) {
  font-size: 18px;
  margin: 0.6em 0;
}

.markdown-body :deep(p) {
  margin: 0.6em 0;
}

.markdown-body :deep(pre) {
  background: rgb(0 0 0 / 5%);
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.plain-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
</style>
