import type { SnippetLocator } from "../../../types/snippet";

function isWithin(root: Node, node: Node | null): boolean {
  if (!node) return false;
  return root.contains(node);
}

function offsetInRoot(root: Node, target: Node, targetOffset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(target, targetOffset);
  return range.toString().length;
}

export function computeTextAnchor(root: HTMLElement, range: Range): SnippetLocator | null {
  if (!isWithin(root, range.startContainer) || !isWithin(root, range.endContainer)) {
    return null;
  }
  const charStart = offsetInRoot(root, range.startContainer, range.startOffset);
  const charEnd = offsetInRoot(root, range.endContainer, range.endOffset);
  if (charEnd <= charStart) return null;
  return { kind: "text", charStart, charEnd };
}

function readPageIndex(el: HTMLElement): number | null {
  const idxAttr = el.getAttribute("data-page-index");
  if (idxAttr !== null) {
    const idx = Number(idxAttr);
    if (Number.isFinite(idx)) return idx;
  }
  const numAttr = el.getAttribute("data-page-number");
  if (numAttr !== null) {
    const num = Number(numAttr);
    if (Number.isFinite(num) && num >= 1) return num - 1;
  }
  return null;
}

function findPageElement(node: Node | null): { el: HTMLElement; index: number } | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement) {
      const index = readPageIndex(current);
      if (index !== null) return { el: current, index };
    }
    current = current.parentNode;
  }
  return null;
}

function findTextLayerForPage(pageEl: HTMLElement): HTMLElement | null {
  if (
    pageEl.classList.contains("pdf-text-layer") ||
    pageEl.classList.contains("vpv-text-layer-wrapper") ||
    pageEl.classList.contains("textLayer")
  ) {
    return pageEl;
  }

  return (
    pageEl.querySelector<HTMLElement>(".pdf-text-layer") ??
    pageEl.querySelector<HTMLElement>(".vpv-text-layer-wrapper") ??
    pageEl.querySelector<HTMLElement>(".textLayer")
  );
}

function clampedOffset(
  layer: HTMLElement,
  range: Range,
  end: "start" | "end",
): number {
  const node = end === "start" ? range.startContainer : range.endContainer;
  const offset = end === "start" ? range.startOffset : range.endOffset;

  if (layer.contains(node)) {
    return offsetInRoot(layer, node, offset);
  }

  const probe = document.createRange();
  probe.selectNodeContents(layer);
  const layerStart = probe.cloneRange();
  layerStart.collapse(true);
  const layerEnd = probe.cloneRange();
  layerEnd.collapse(false);

  const target = document.createRange();
  target.setStart(node, offset);
  target.setEnd(node, offset);

  if (target.compareBoundaryPoints(Range.START_TO_START, layerStart) <= 0) return 0;
  if (target.compareBoundaryPoints(Range.END_TO_END, layerEnd) >= 0) {
    return probe.toString().length;
  }

  return end === "start" ? 0 : probe.toString().length;
}

export function computePdfAnchor(range: Range): SnippetLocator | null {
  const start = findPageElement(range.startContainer);
  const end = findPageElement(range.endContainer);
  if (!start || !end || start.index !== end.index) return null;

  const layer = findTextLayerForPage(start.el);
  if (!layer) return null;

  const charStart = clampedOffset(layer, range, "start");
  const charEnd = clampedOffset(layer, range, "end");
  if (charEnd <= charStart) return null;

  return { kind: "pdf", page: start.index + 1, charStart, charEnd };
}
