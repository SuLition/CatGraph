<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { VuePDF, usePDF } from "@tato30/vue-pdf";
import "@tato30/vue-pdf/style.css";
import { PanelRightContract20Regular, PanelRightExpand20Regular } from "@vicons/fluent";
import { useDocumentsStore } from "../../../stores/documents.store";
import { useSnippetPanel } from "../../../composables/useSnippetPanel";
import type { SnippetLocator } from "../../../types/snippet";
import ViewerSpinner from "./ViewerSpinner.vue";

const { isCollapsed: panelCollapsed, toggle: togglePanel } = useSnippetPanel();

const PAGE_GUTTER = 32;

const props = defineProps<{ documentId: string }>();

const documents = useDocumentsStore();
const scrollEl = useTemplateRef<HTMLElement>("scrollEl");
const searchInput = useTemplateRef<HTMLInputElement>("searchInput");

const isLoading = ref(true);
const error = ref<string | null>(null);

// Fit-to-width is a one-shot scale calculation. It runs when a document opens,
// then keeps that scale fixed through later layout changes.
const initialFitApplied = ref(false);
const manualScale = ref(1.25);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const containerWidth = ref(0);

const src = shallowRef<Uint8Array | null>(null);
const { pdf, pages } = usePDF(src, {
  onError: (e: unknown) => {
    error.value = e instanceof Error ? e.message : String(e);
    isLoading.value = false;
  },
});

let loadId = 0;

type PdfTextItem = { str?: string };
type PdfTextContent = { items: PdfTextItem[] };
type PdfPageLike = {
  getTextContent: () => Promise<PdfTextContent>;
  getViewport: (options: { scale: number }) => { width: number; height: number };
};
type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
};
type PdfSearchPage = { page: number; text: string };
type PdfSearchMatch = { page: number; charStart: number; charEnd: number };

const isSearchOpen = ref(false);
const isSearchIndexing = ref(false);
const searchQuery = ref("");
const submittedSearchQuery = ref("");
const activeSearchIndex = ref(-1);
const searchPages = shallowRef<PdfSearchPage[]>([]);
let searchIndexId = 0;

const fitScale = computed(() => {
  if (naturalWidth.value <= 0 || containerWidth.value <= 0) return null;
  const raw = (containerWidth.value - PAGE_GUTTER) / naturalWidth.value;
  return Math.min(3, Math.max(0.35, Number(raw.toFixed(3))));
});

const effectiveScale = computed(() => manualScale.value);
const fitWidthActive = computed(
  () => fitScale.value !== null && Math.abs(manualScale.value - fitScale.value) < 0.001,
);

const zoomLabel = computed(() => `${Math.round(effectiveScale.value * 100)}%`);

const normalizedSearchQuery = computed(() => submittedSearchQuery.value.toLocaleLowerCase());
const searchMatches = computed<PdfSearchMatch[]>(() => {
  const query = normalizedSearchQuery.value;
  if (!query) return [];

  const matches: PdfSearchMatch[] = [];
  for (const page of searchPages.value) {
    const text = page.text.toLocaleLowerCase();
    let offset = 0;
    while (offset < text.length) {
      const index = text.indexOf(query, offset);
      if (index === -1) break;
      matches.push({ page: page.page, charStart: index, charEnd: index + query.length });
      offset = index + Math.max(query.length, 1);
    }
  }
  return matches;
});
const searchStatus = computed(() => {
  if (!normalizedSearchQuery.value) return "";
  if (isSearchIndexing.value) return "...";
  if (!searchMatches.value.length) return "0/0";
  return `${activeSearchIndex.value + 1}/${searchMatches.value.length}`;
});

// 虚拟化：只有视口附近的页才挂载重量级的 <VuePDF>（canvas + 文字层），
// 其余页保留为尺寸正确的空占位 div，从而保住滚动高度和按页号定位（data-page-number）。
const visiblePages = ref<Set<number>>(new Set());
const pinnedPages = ref<Set<number>>(new Set());
const renderedPages = computed(() => {
  const set = new Set(visiblePages.value);
  for (const page of pinnedPages.value) set.add(page);
  return set;
});

// 占位尺寸用首页自然尺寸 × 当前缩放估算（与 fitScale 只取首页宽度的既有假设一致）。
const placeholderWidth = computed(() =>
  naturalWidth.value > 0 ? Math.round(naturalWidth.value * effectiveScale.value) : 0,
);
const placeholderHeight = computed(() =>
  naturalHeight.value > 0 ? Math.round(naturalHeight.value * effectiveScale.value) : 0,
);

let pageObserver: IntersectionObserver | null = null;

function setupPageObserver() {
  pageObserver?.disconnect();
  const rootEl = scrollEl.value;
  if (!rootEl) return;
  pageObserver = new IntersectionObserver(
    (entries) => {
      const next = new Set(visiblePages.value);
      for (const entry of entries) {
        const page = Number((entry.target as HTMLElement).dataset.pageNumber);
        if (!page) continue;
        if (entry.isIntersecting) next.add(page);
        else next.delete(page);
      }
      visiblePages.value = next;
    },
    // 上下各预加载约 2 个视口高度，快速滚动时不会露出占位。
    { root: rootEl, rootMargin: "200% 0px" },
  );
  for (const el of rootEl.querySelectorAll<HTMLElement>(".pdf-page")) {
    pageObserver.observe(el);
  }
}

function measureContainer() {
  if (scrollEl.value) containerWidth.value = scrollEl.value.clientWidth;
}

function applyFitWidth() {
  if (!fitScale.value) return;
  manualScale.value = fitScale.value;
}

function applyInitialFitWidth() {
  if (initialFitApplied.value) return;
  applyFitWidth();
  if (fitScale.value) initialFitApplied.value = true;
}

function waitForFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

async function buildSearchIndex(doc: PdfDocumentLike, expectedLoadId: number) {
  const currentIndexId = ++searchIndexId;
  isSearchIndexing.value = true;
  const nextPages: PdfSearchPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      if (currentIndexId !== searchIndexId || expectedLoadId !== loadId) return;
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str ?? "").join("");
      nextPages.push({ page: pageNumber, text });
    }
    if (currentIndexId === searchIndexId && expectedLoadId === loadId) {
      searchPages.value = nextPages;
    }
  } finally {
    if (currentIndexId === searchIndexId && expectedLoadId === loadId) {
      isSearchIndexing.value = false;
    }
  }
}

let resizeObserver: ResizeObserver | null = null;

async function loadPdf() {
  const currentLoad = ++loadId;
  searchIndexId += 1;
  isLoading.value = true;
  error.value = null;
  naturalWidth.value = 0;
  naturalHeight.value = 0;
  initialFitApplied.value = false;
  visiblePages.value = new Set();
  pinnedPages.value = new Set();
  isSearchOpen.value = false;
  isSearchIndexing.value = false;
  searchQuery.value = "";
  submittedSearchQuery.value = "";
  activeSearchIndex.value = -1;
  searchPages.value = [];

  try {
    const bytes = await documents.readBytes(props.documentId);
    if (currentLoad !== loadId) return;
    src.value = bytes;
  } catch (e) {
    if (currentLoad === loadId) {
      error.value = e instanceof Error ? e.message : String(e);
      isLoading.value = false;
    }
  }
}

watch(pdf, async (task) => {
  if (!task) return;
  error.value = null;
  // Resolve the natural page width before showing pages so the first paint
  // already uses the fit scale (no flash from an intermediate zoom level).
  try {
    const doc = (await task.promise) as PdfDocumentLike;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    naturalWidth.value = viewport.width;
    naturalHeight.value = viewport.height;
    void buildSearchIndex(doc, loadId);
  } catch {
    // leave naturalWidth at 0; effectiveScale falls back to manualScale
  }
  isLoading.value = false;
});

function zoomIn() {
  manualScale.value = Math.min(3, Number((effectiveScale.value + 0.1).toFixed(2)));
}

function zoomOut() {
  manualScale.value = Math.max(0.35, Number((effectiveScale.value - 0.1).toFixed(2)));
}

let lastWheelZoomAt = 0;

function onPreviewWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();

  const now = window.performance.now();
  if (now - lastWheelZoomAt < 60) return;
  lastWheelZoomAt = now;

  if (event.deltaY < 0) zoomIn();
  else if (event.deltaY > 0) zoomOut();
}

function fitWidth() {
  measureContainer();
  applyFitWidth();
}

async function openSearch() {
  isSearchOpen.value = true;
  await nextTick();
  searchInput.value?.focus();
  searchInput.value?.select();
}

function closeSearch() {
  isSearchOpen.value = false;
  searchQuery.value = "";
  submittedSearchQuery.value = "";
  activeSearchIndex.value = -1;
  window.getSelection()?.removeAllRanges();
}

function onSearchInput() {
  if (!submittedSearchQuery.value) return;
  submittedSearchQuery.value = "";
  activeSearchIndex.value = -1;
  window.getSelection()?.removeAllRanges();
}

async function confirmSearch() {
  submittedSearchQuery.value = searchQuery.value.trim();
  activeSearchIndex.value = -1;
  window.getSelection()?.removeAllRanges();

  if (!submittedSearchQuery.value) return;
  await nextTick();
  if (activeSearchIndex.value >= 0) return;
  if (!searchMatches.value.length) return;
  activeSearchIndex.value = 0;
  void jumpToSearchMatch(0);
}

function goToSearchResult(direction: 1 | -1) {
  const matches = searchMatches.value;
  if (!matches.length) return;
  const nextIndex =
    activeSearchIndex.value < 0
      ? direction > 0
        ? 0
        : matches.length - 1
      : (activeSearchIndex.value + direction + matches.length) % matches.length;
  activeSearchIndex.value = nextIndex;
  void jumpToSearchMatch(nextIndex);
}

async function jumpToSearchMatch(index: number) {
  const match = searchMatches.value[index];
  if (!match) return;

  if (!pinnedPages.value.has(match.page)) {
    pinnedPages.value = new Set(pinnedPages.value).add(match.page);
  }

  const pageEl = await waitForPage(match.page);
  if (!pageEl) return;

  const range = createTextLayerRange(pageEl, match.charStart, match.charEnd);
  if (!range) return;

  scrollRangeIntoView(range);
  selectRangeTemporarily(range, null);
}

async function jumpToAnchor(locator: SnippetLocator) {
  if (locator.kind !== "pdf") return;

  // 强制挂载目标页：它可能在当前窗口之外，不挂载就没有文字层、定位会失败。
  if (!pinnedPages.value.has(locator.page)) {
    pinnedPages.value = new Set(pinnedPages.value).add(locator.page);
  }

  const pageEl = await waitForPage(locator.page);
  if (!pageEl) return;

  const range = createTextLayerRange(pageEl, locator.charStart, locator.charEnd);
  if (!range) return;

  scrollRangeIntoView(range);
  selectRangeTemporarily(range);
}

async function waitForPage(page: number): Promise<HTMLElement | null> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const pageEl = findPageElement(page);
    const layer = pageEl?.querySelector<HTMLElement>(".pdf-text-layer, .textLayer");
    if (pageEl && layer && (layer.textContent?.length ?? 0) > 0) return pageEl;
    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }
  return findPageElement(page);
}

function findPageElement(page: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.pdf-page[data-page-number="${page}"]`);
}

function createTextLayerRange(
  pageEl: HTMLElement,
  charStart: number,
  charEnd: number,
): Range | null {
  const layer = pageEl.querySelector<HTMLElement>(".pdf-text-layer, .textLayer");
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
  let current: HTMLElement | null = node instanceof HTMLElement ? node : node.parentElement;

  while (current) {
    const style = window.getComputedStyle(current);
    const canScroll = /(auto|scroll)/.test(`${style.overflow}${style.overflowY}`);
    if (canScroll && current.scrollHeight > current.clientHeight) return current;
    current = current.parentElement;
  }

  return null;
}

function selectRangeTemporarily(range: Range, clearAfterMs: number | null = 1800) {
  window.dispatchEvent(new CustomEvent("catgraph:programmatic-selection"));
  window.setTimeout(() => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    if (clearAfterMs !== null) window.setTimeout(() => selection?.removeAllRanges(), clearAfterMs);
  }, 180);
}

watch(() => props.documentId, loadPdf, { immediate: true });

watch(searchMatches, (matches) => {
  if (!normalizedSearchQuery.value) {
    activeSearchIndex.value = -1;
    return;
  }
  if (!matches.length) {
    activeSearchIndex.value = -1;
    return;
  }
  if (activeSearchIndex.value < 0 || activeSearchIndex.value >= matches.length) {
    activeSearchIndex.value = 0;
  }
  void jumpToSearchMatch(activeSearchIndex.value);
});

// 页容器进入 DOM 后（再）挂上观察器；文档切换或加载完成都会触发。
// 同时在此重新测量容器宽度：首次 measureContainer 调用时内容未渲染、竖向滚动条
// 尚未出现，clientWidth 会偏大；等页面渲染完成后再测一次，拿到含滚动条的真实宽度。
watch(
  () => [pages.value, isLoading.value, error.value] as const,
  async ([count, loading, err]) => {
    if (!count || loading || err) return;
    await nextTick();
    await waitForFrame();
    measureContainer();
    applyInitialFitWidth();
    setupPageObserver();
  },
);

onMounted(() => {
  measureContainer();
  if (scrollEl.value) {
    resizeObserver = new ResizeObserver(() => measureContainer());
    resizeObserver.observe(scrollEl.value);
  }
  document.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyDown);
  resizeObserver?.disconnect();
  pageObserver?.disconnect();
  pdf.value?.destroy();
});

function isEditableTarget(target: EventTarget | null) {
  const el = target instanceof HTMLElement ? target : null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "button" ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

function scrollPreviewPage(direction: 1 | -1) {
  const el = scrollEl.value;
  if (!el) return;
  el.scrollBy({ top: el.clientHeight * 0.85 * direction, behavior: "smooth" });
}

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented) return;

  const key = event.key.toLowerCase();
  const hasModifier = event.ctrlKey || event.metaKey;

  if (hasModifier && key === "f") {
    event.preventDefault();
    void openSearch();
    return;
  }

  if (hasModifier && (event.key === "=" || event.key === "+" || key === "add")) {
    event.preventDefault();
    zoomIn();
    return;
  }

  if (hasModifier && (event.key === "-" || key === "subtract")) {
    event.preventDefault();
    zoomOut();
    return;
  }

  if (hasModifier && event.key === "0") {
    event.preventDefault();
    fitWidth();
    return;
  }

  if (hasModifier && key === "b") {
    event.preventDefault();
    togglePanel();
    return;
  }

  if (isSearchOpen.value && event.key === "Escape") {
    event.preventDefault();
    closeSearch();
    return;
  }

  if (isEditableTarget(event.target)) return;

  if (event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    scrollPreviewPage(1);
    return;
  }

  if (event.key === "PageUp") {
    event.preventDefault();
    scrollPreviewPage(-1);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    scrollEl.value?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    const el = scrollEl.value;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }
}

defineExpose({ jumpToAnchor });
</script>

<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <button type="button" :disabled="isLoading || !pdf" @click="zoomOut">-</button>
      <span class="zoom-label">{{ zoomLabel }}</span>
      <button type="button" :disabled="isLoading || !pdf" @click="zoomIn">+</button>
      <button
        type="button"
        :class="{ 'is-active': fitWidthActive }"
        :disabled="isLoading || !pdf"
        @click="fitWidth"
      >
        适宽
      </button>
      <button type="button" :disabled="isLoading || !pdf" @click="openSearch">搜索</button>
      <span v-if="pages > 0" class="page-info">{{ pages }} 页</span>
      <button
        class="snippet-toggle"
        :title="panelCollapsed ? '展开知识库' : '收起知识库'"
        @click="togglePanel"
      >
        <component
          :is="panelCollapsed ? PanelRightExpand20Regular : PanelRightContract20Regular"
          class="toolbar-icon"
        />
      </button>
    </div>

    <div v-if="isSearchOpen" class="pdf-search-popover">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="search"
        class="pdf-search-input"
        placeholder="搜索 PDF"
        @input="onSearchInput"
        @keydown.enter.prevent="confirmSearch"
        @keydown.esc.prevent="closeSearch"
      />
      <button
        type="button"
        :disabled="isSearchIndexing || !searchQuery.trim()"
        @click="confirmSearch"
      >
        确认
      </button>
      <span class="pdf-search-status">{{ searchStatus }}</span>
      <button type="button" :disabled="!searchMatches.length" @click="goToSearchResult(-1)">
        上
      </button>
      <button type="button" :disabled="!searchMatches.length" @click="goToSearchResult(1)">
        下
      </button>
      <button type="button" @click="closeSearch">关闭</button>
    </div>

    <div ref="scrollEl" class="pdf-pages" @wheel="onPreviewWheel">
      <ViewerSpinner v-if="isLoading" />
      <p v-else-if="error" class="state error">{{ error }}</p>
      <template v-else>
        <div
          v-for="page in pages"
          :key="page"
          class="pdf-page"
          :data-page-number="page"
          :data-page-index="page - 1"
          :style="{
            width: placeholderWidth ? `${placeholderWidth}px` : undefined,
            minHeight: placeholderHeight ? `${placeholderHeight}px` : undefined,
          }"
        >
          <VuePDF
            v-if="renderedPages.has(page)"
            :pdf="pdf"
            :page="page"
            :scale="effectiveScale"
            text-layer
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  /* 调这个值改 PDF 选中色块的「高度」：1=默认，>1 色块更高，<1 更矮。
     原理：纵向缩放透明的文字层 span（它只用于选区，color:transparent，
     不影响 PDF 画面），并以文字中线为锚点对称增减，所以改的是高度而非上下位置。 */
  --pdf-text-block-scale: 0.65;
  display: flex;
  position: relative;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}


.pdf-viewer :deep(.textLayer span:not(.markedContent)) {
  transform: rotate(var(--rotate, 0deg)) scaleX(var(--scale-x, 1))
    scaleY(var(--pdf-text-block-scale, 1)) scale(var(--min-font-size-inv, 1)) !important;
  transform-origin: 0% 50% !important;
}

/* 修复选区抖动：拖选时鼠标经过文字 span 之间的空隙，浏览器会把选区甩到远处再弹回。
   pdf.js 用 endOfContent 兜底层在按住鼠标时铺满整页来挡住这些空隙，但 @tato30/vue-pdf
   的 TextLayer 仍按旧约定给它加 `.active` 类，而打包进来的 pdf.js 5.7 样式只认新写法
   `.textLayer.selecting .endOfContent`，两者对不上，兜底层从未展开。这里补上 `.active`。 */
.pdf-viewer :deep(.textLayer .endOfContent.active) {
  top: 0;
}

.pdf-viewer :deep(.textLayer ::selection),
.pdf-viewer :deep(.textLayer span::selection) {
  color: transparent;
  background: rgb(255 216 77 / 72%);
}

.pdf-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--panel-background-color);
  font-size: 12px;
  color: var(--muted-text-color);
}

.pdf-toolbar button {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid var(--border-control-color);
  border-radius: 4px;
  background: var(--surface-control-color);
  cursor: pointer;
}

.pdf-toolbar button:disabled {
  opacity: 0.4;
  cursor: progress;
}

.pdf-toolbar button.is-active {
  color: var(--accent-color);
  border-color: var(--accent-border-color);
  background: var(--accent-color-soft);
}

.zoom-label {
  min-width: 40px;
  text-align: center;
}

.pdf-search-popover {
  position: absolute;
  top: 48px;
  right: 28px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-control-color);
  border-radius: 6px;
  background: var(--panel-background-color);
  box-shadow: 0 8px 24px rgb(0 0 0 / 14%);
}

.pdf-search-popover button {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border-control-color);
  border-radius: 4px;
  background: var(--surface-control-color);
  color: var(--text-color);
  font-size: 13px;
  cursor: pointer;
}

.pdf-search-popover button:disabled {
  opacity: 0.45;
  cursor: progress;
}

.pdf-search-input {
  width: 240px;
  height: 32px;
  padding: 0 11px;
  border: 1px solid var(--border-control-color);
  border-radius: 6px;
  background: var(--content-background-color);
  color: var(--text-color);
  font-size: 14px;
  outline: none;
}

.pdf-search-input:focus {
  border-color: var(--accent-border-color);
}

.pdf-search-status {
  min-width: 46px;
  text-align: center;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  color: var(--muted-text-color);
}

.page-info {
  margin-left: auto;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.snippet-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0 !important;
  border: none !important;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--muted-text-color);
}

.snippet-toggle:hover {
  background: var(--active-item-background-color);
  color: var(--text-color);
}

.toolbar-icon {
  width: 18px;
  height: 20px;
}

.pdf-pages {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-muted-color, var(--content-background-color));
}

.pdf-page {
  position: relative;
  flex: 0 0 auto;
  box-shadow: 0 1px 6px rgb(0 0 0 / 18%);
  background: #fff;
}

.state {
  padding: 24px;
  color: var(--danger-color);
}
</style>
