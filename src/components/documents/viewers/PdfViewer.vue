<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch, type ComponentPublicInstance } from "vue";
import { VPdfViewer, ScrollMode, SelectionMode, ZoomLevel } from "@vue-pdf-viewer/viewer";
import { useDocumentsStore } from "../../../stores/documents.store";
import type { SnippetLocator } from "../../../types/snippet";

const props = defineProps<{ documentId: string }>();

type TextLayerLoadedPayload = {
  textDivs: HTMLElement[];
  textLayerRef?: HTMLElement;
};

type LoadedPayload = {
  pageCount?: number;
};

type PdfViewerPublic = ComponentPublicInstance & {
  pageControl?: {
    goToPage: (pageNumber: number) => void;
    totalPages: number;
  };
  zoomControl?: {
    scale: number;
    zoom: (scale: number | ZoomLevel, options?: { immediate?: boolean }) => void;
  };
};

const documents = useDocumentsStore();
const viewerRef = ref<PdfViewerPublic | null>(null);
const pdfSrc = shallowRef<Uint8Array | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const totalPages = ref(0);
const currentScale = ref<number | null>(null);

let loadId = 0;

const zoomLabel = computed(() =>
  currentScale.value ? `${Math.round(currentScale.value * 100)}%` : "适宽",
);

async function loadPdf() {
  const currentLoad = ++loadId;
  isLoading.value = true;
  error.value = null;
  pdfSrc.value = null;
  totalPages.value = 0;
  currentScale.value = null;

  try {
    const bytes = await documents.readBytes(props.documentId);
    if (currentLoad !== loadId) return;
    pdfSrc.value = bytes.slice();
  } catch (e) {
    if (currentLoad === loadId) {
      error.value = e instanceof Error ? e.message : String(e);
      isLoading.value = false;
    }
  }
}

function handleLoaded(payload?: LoadedPayload) {
  totalPages.value = payload?.pageCount ?? viewerRef.value?.pageControl?.totalPages ?? 0;
  updateScaleFromViewer();
  isLoading.value = false;
}

function handleLoadError(e: unknown) {
  error.value = e instanceof Error ? e.message : String(e);
  isLoading.value = false;
}

function handleTextLoaded(payload: TextLayerLoadedPayload) {
  const layer = payload.textLayerRef ?? payload.textDivs[0]?.parentElement;
  if (!layer) return;

  layer.classList.add("pdf-text-layer");

  const pageEl = layer.closest<HTMLElement>("[data-page-index]");
  if (!pageEl) return;

  const pageIndex = Number(pageEl.dataset.pageIndex);
  if (!Number.isFinite(pageIndex)) return;

  pageEl.classList.add("pdf-page");
  pageEl.dataset.pageNumber = String(pageIndex + 1);
}

function updateScaleFromViewer() {
  const scale = viewerRef.value?.zoomControl?.scale;
  if (typeof scale === "number" && Number.isFinite(scale)) {
    currentScale.value = scale;
  }
}

function zoomIn() {
  const scale = viewerRef.value?.zoomControl?.scale ?? currentScale.value ?? 1;
  const nextScale = Math.min(3, Number((scale + 0.1).toFixed(2)));
  viewerRef.value?.zoomControl?.zoom(nextScale);
  currentScale.value = nextScale;
}

function zoomOut() {
  const scale = viewerRef.value?.zoomControl?.scale ?? currentScale.value ?? 1;
  const nextScale = Math.max(0.35, Number((scale - 0.1).toFixed(2)));
  viewerRef.value?.zoomControl?.zoom(nextScale);
  currentScale.value = nextScale;
}

function resetFitWidth() {
  viewerRef.value?.zoomControl?.zoom(ZoomLevel.PageWidth, { immediate: true });
  window.setTimeout(updateScaleFromViewer, 80);
}

async function jumpToAnchor(locator: SnippetLocator) {
  if (locator.kind !== "pdf") return;

  viewerRef.value?.pageControl?.goToPage(locator.page);
  const pageEl = await waitForPage(locator.page);
  if (!pageEl) return;

  const range = createTextLayerRange(pageEl, locator.charStart, locator.charEnd);
  if (!range) return;

  scrollRangeIntoView(range);
  selectRangeTemporarily(range);
}

async function waitForPage(page: number): Promise<HTMLElement | null> {
  for (let attempt = 0; attempt < 24; attempt++) {
    await nextTick();
    const pageEl = findPageElement(page);
    if (pageEl) return pageEl;
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }
  return null;
}

function findPageElement(page: number): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(`.pdf-page[data-page-number="${page}"]`) ??
    document.querySelector<HTMLElement>(`.vpv-page-inner-container[data-page-index="${page - 1}"]`) ??
    document.querySelector<HTMLElement>(`[data-page-index="${page - 1}"]`)
  );
}

function createTextLayerRange(pageEl: HTMLElement, charStart: number, charEnd: number): Range | null {
  const layer =
    pageEl.querySelector<HTMLElement>(".pdf-text-layer") ??
    pageEl.querySelector<HTMLElement>(".vpv-text-layer-wrapper") ??
    pageEl.querySelector<HTMLElement>(".textLayer");
  if (!layer) return null;

  const range = document.createRange();
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.data.length;
    if (!startNode && consumed + len >= charStart) {
      startNode = node;
      startOffset = charStart - consumed;
    }
    if (consumed + len >= charEnd) {
      endNode = node;
      endOffset = charEnd - consumed;
      break;
    }
    consumed += len;
  }

  if (!startNode || !endNode) return null;

  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

function scrollRangeIntoView(range: Range) {
  const scrollParent = findScrollableParent(range.commonAncestorContainer);
  const rangeRect = range.getBoundingClientRect();

  if (!scrollParent) {
    range.startContainer.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const parentRect = scrollParent.getBoundingClientRect();
  const nextTop =
    scrollParent.scrollTop + rangeRect.top - parentRect.top - parentRect.height * 0.28;

  scrollParent.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
}

function findScrollableParent(node: Node): HTMLElement | null {
  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : node.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const canScroll = /(auto|scroll)/.test(`${style.overflow}${style.overflowY}`);
    if (canScroll && current.scrollHeight > current.clientHeight) return current;
    current = current.parentElement;
  }

  return null;
}

function selectRangeTemporarily(range: Range) {
  window.dispatchEvent(new CustomEvent("catgraph:programmatic-selection"));
  window.setTimeout(() => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    window.setTimeout(() => selection?.removeAllRanges(), 1800);
  }, 180);
}

watch(() => props.documentId, loadPdf, { immediate: true });

defineExpose({ jumpToAnchor });
</script>

<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <button type="button" :disabled="isLoading || !pdfSrc" @click="zoomOut">-</button>
      <span class="zoom-label">{{ zoomLabel }}</span>
      <button type="button" :disabled="isLoading || !pdfSrc" @click="zoomIn">+</button>
      <button type="button" :disabled="isLoading || !pdfSrc" @click="resetFitWidth">适宽</button>
      <span v-if="totalPages > 0" class="page-info">{{ totalPages }} 页</span>
    </div>

    <p v-if="isLoading" class="state">加载 PDF...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <VPdfViewer
      v-if="pdfSrc && !error"
      ref="viewerRef"
      class="vpv-viewer"
      :src="pdfSrc"
      :toolbar-options="false"
      :text-layer="true"
      :selection-mode="SelectionMode.Text"
      :initial-scale="ZoomLevel.PageWidth"
      :initial-scroll-mode="ScrollMode.Vertical"
      @loaded="handleLoaded"
      @load-error="handleLoadError"
      @text-loaded="handleTextLoaded"
      @page-changed="updateScaleFromViewer"
    />
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.pdf-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  background: rgb(255 255 255 / 35%);
  font-size: 12px;
  color: var(--muted-text-color);
}

.pdf-toolbar button {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 4px;
  background: rgb(255 255 255 / 50%);
  cursor: pointer;
}

.pdf-toolbar button:disabled {
  opacity: 0.4;
  cursor: progress;
}

.zoom-label {
  min-width: 40px;
  text-align: center;
}

.page-info {
  margin-left: auto;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.state {
  padding: 24px;
  color: var(--muted-text-color);
}

.state.error {
  color: #d44747;
}

.vpv-viewer {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

:deep(.vpv-container) {
  height: 100%;
  width: 100%;
  border: 0;
}

:deep(.vpv-body-wrapper),
:deep(.vpv-body),
:deep(.vpv-pages-container-wrapper) {
  min-width: 0;
}

:deep(.vpv-pages-container-wrapper) {
  overflow-x: hidden;
}

:deep(.vpv-text-selection-menu) {
  display: none !important;
}
</style>
