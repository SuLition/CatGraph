<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { computePdfAnchor, computeTextAnchor } from "./anchor";
import SelectionMenu from "./SelectionMenu.vue";
import { dispatchSelectionAction, type SelectionActionId } from "./selection-actions";
import type { SnippetAnchor, SnippetLocator } from "../../../types/snippet";

const props = defineProps<{ documentId: string; mode: "pdf" | "text" }>();

const root = useTemplateRef<HTMLDivElement>("root");
const showMenu = ref(false);
const menuPos = ref({ x: 0, y: 0 });
const selectedText = ref("");
const currentAnchor = ref<SnippetAnchor | null>(null);
const disabledActions = ref<SelectionActionId[]>([]);
const highlightRects = ref<{ left: number; top: number; width: number; height: number }[]>([]);

const MENU_DELAY_MS = 450;
const MENU_MARGIN_PX = 12;
const MENU_HEIGHT_PX = 34;
const MENU_HALF_WIDTH_PX = 180;

let menuTimer: number | undefined;
let isPointerSelecting = false;
let suppressSelectionMenuUntil = 0;
let lastPointerUp: { x: number; y: number; at: number } | null = null;

function clearMenuTimer() {
  if (menuTimer !== undefined) {
    window.clearTimeout(menuTimer);
    menuTimer = undefined;
  }
}

function clearMenu() {
  clearMenuTimer();
  showMenu.value = false;
  selectedText.value = "";
  currentAnchor.value = null;
  disabledActions.value = [];
  highlightRects.value = [];
}

function computeAnchor(range: Range): SnippetLocator | null {
  if (props.mode === "pdf") return computePdfAnchor(range);
  if (root.value) return computeTextAnchor(root.value, range);
  return null;
}

function evaluateSelection() {
  if (performance.now() < suppressSelectionMenuUntil) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
    clearMenu();
    return;
  }

  const range = selection.getRangeAt(0);
  if (!root.value || !root.value.contains(range.commonAncestorContainer)) {
    clearMenu();
    return;
  }

  const text = selection.toString();
  const locator = computeAnchor(range);
  const anchor: SnippetAnchor | null = locator ? { documentId: props.documentId, locator } : null;

  const rect = getMenuAnchorRect(range);
  if (!rect) {
    clearMenu();
    return;
  }
  const rootRect = root.value.getBoundingClientRect();
  const pointer = getRecentPointer(rootRect);
  let x = pointer?.x ?? rect.left + rect.width / 2;
  let y = (pointer?.y ?? rect.bottom) + MENU_MARGIN_PX;

  if (y + MENU_HEIGHT_PX > rootRect.bottom) {
    y = rect.top - MENU_HEIGHT_PX - MENU_MARGIN_PX;
  }

  y = Math.min(rootRect.bottom - MENU_HEIGHT_PX, Math.max(rootRect.top + MENU_MARGIN_PX, y));
  x = Math.min(
    rootRect.right - MENU_HALF_WIDTH_PX,
    Math.max(rootRect.left + MENU_HALF_WIDTH_PX, x),
  );

  selectedText.value = text;
  currentAnchor.value = anchor;
  disabledActions.value = anchor ? [] : ["add-to-snippets"];
  highlightRects.value = props.mode === "pdf" ? [] : collectHighlightRects(range);
  menuPos.value = { x, y };
  showMenu.value = true;
}

function onSelectionChange() {
  if (performance.now() < suppressSelectionMenuUntil) return;
  if (isPointerSelecting) return;
  scheduleEvaluateSelection();
}

function getMenuAnchorRect(range: Range): DOMRect | null {
  if (!root.value) return null;

  const rootRect = root.value.getBoundingClientRect();
  const rects = Array.from(range.getClientRects()).filter(
    (rect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= rootRect.top &&
      rect.top <= rootRect.bottom &&
      rect.right >= rootRect.left &&
      rect.left <= rootRect.right,
  );

  if (rects.length > 0) return rects[rects.length - 1];

  const fallback = range.getBoundingClientRect();
  if (fallback.width <= 0 || fallback.height <= 0) return null;
  return fallback;
}

function getRecentPointer(rootRect: DOMRect): { x: number; y: number } | null {
  if (!lastPointerUp || performance.now() - lastPointerUp.at > MENU_DELAY_MS + 300) return null;
  const isInside =
    lastPointerUp.x >= rootRect.left &&
    lastPointerUp.x <= rootRect.right &&
    lastPointerUp.y >= rootRect.top &&
    lastPointerUp.y <= rootRect.bottom;

  return isInside ? lastPointerUp : null;
}

function collectHighlightRects(range: Range) {
  if (!root.value) return [];

  const rootRect = root.value.getBoundingClientRect();
  const walker = document.createTreeWalker(root.value, NodeFilter.SHOW_TEXT);
  const rects: { left: number; top: number; width: number; height: number }[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!range.intersectsNode(node)) continue;

    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.data.length;
    if (end <= start) continue;

    const nodeRange = document.createRange();
    nodeRange.setStart(node, start);
    nodeRange.setEnd(node, end);

    for (const rect of Array.from(nodeRange.getClientRects())) {
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.bottom < rootRect.top ||
        rect.top > rootRect.bottom ||
        rect.right < rootRect.left ||
        rect.left > rootRect.right
      ) {
        continue;
      }

      rects.push({
        left: Math.max(rect.left, rootRect.left) - rootRect.left,
        top: Math.max(rect.top, rootRect.top) - rootRect.top,
        width: Math.min(rect.right, rootRect.right) - Math.max(rect.left, rootRect.left),
        height: rect.height,
      });
    }
  }

  return mergeHighlightRects(rects);
}

function mergeHighlightRects(
  rects: { left: number; top: number; width: number; height: number }[],
) {
  const lineThreshold = 3;
  const sorted = [...rects].sort((a, b) => (Math.abs(a.top - b.top) > lineThreshold ? a.top - b.top : a.left - b.left));
  const merged: typeof rects = [];

  for (const rect of sorted) {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      Math.abs(previous.top - rect.top) <= lineThreshold &&
      rect.left <= previous.left + previous.width + 2
    ) {
      const right = Math.max(previous.left + previous.width, rect.left + rect.width);
      previous.left = Math.min(previous.left, rect.left);
      previous.width = right - previous.left;
      previous.height = Math.max(previous.height, rect.height);
      continue;
    }

    merged.push({ ...rect });
  }

  return merged;
}

function scheduleEvaluateSelection() {
  clearMenuTimer();
  menuTimer = window.setTimeout(evaluateSelection, MENU_DELAY_MS);
}

function onRootPointerDown() {
  isPointerSelecting = true;
  clearMenu();
}

function onPointerUp(event: PointerEvent) {
  if (!isPointerSelecting) return;
  lastPointerUp = { x: event.clientX, y: event.clientY, at: performance.now() };
  isPointerSelecting = false;
  scheduleEvaluateSelection();
}

function onMouseDown(event: MouseEvent) {
  if (!showMenu.value) return;
  const target = event.target as Node | null;
  if (target && root.value && root.value.contains(target)) return;
  clearMenu();
}

function onScroll(event: Event) {
  const target = event.target as Node | null;
  if (target && root.value?.contains(target)) clearMenu();
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") clearMenu();
}

function onProgrammaticSelection() {
  suppressSelectionMenuUntil = performance.now() + 2200;
  clearMenu();
}

function handleAction(id: SelectionActionId) {
  const ctx = { text: selectedText.value, anchor: currentAnchor.value };
  clearMenu();
  void dispatchSelectionAction(id, ctx);
}

onMounted(() => {
  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("scroll", onScroll, true);
  window.addEventListener("catgraph:programmatic-selection", onProgrammaticSelection);
});

onBeforeUnmount(() => {
  document.removeEventListener("selectionchange", onSelectionChange);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerUp);
  document.removeEventListener("mousedown", onMouseDown);
  document.removeEventListener("keydown", onKeyDown);
  document.removeEventListener("scroll", onScroll, true);
  window.removeEventListener("catgraph:programmatic-selection", onProgrammaticSelection);
  clearMenuTimer();
});
</script>

<template>
  <div ref="root" class="selection-host" @pointerdown="onRootPointerDown">
    <slot />
    <div v-if="highlightRects.length > 0" class="selection-highlight-layer" aria-hidden="true">
      <span
        v-for="(rect, index) in highlightRects"
        :key="index"
        class="selection-highlight"
        :style="{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }"
      ></span>
    </div>
    <SelectionMenu
      v-if="showMenu"
      :position="menuPos"
      :disabled-actions="disabledActions"
      @action="handleAction"
    />
  </div>
</template>

<style scoped>
.selection-host {
  position: relative;
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selection-highlight-layer {
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

.selection-highlight {
  position: absolute;
  display: block;
  border-radius: 2px;
  background: color-mix(in srgb, var(--accent-color) 30%, transparent);
  mix-blend-mode: multiply;
}
</style>
