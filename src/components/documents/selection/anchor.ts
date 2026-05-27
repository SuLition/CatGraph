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

function findPageContainer(node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      (current.classList.contains("pdf-page") || current.hasAttribute("data-page-index"))
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

export function computePdfAnchor(range: Range): SnippetLocator | null {
  const startPage = findPageContainer(range.startContainer);
  const endPage = findPageContainer(range.endContainer);
  if (!startPage || startPage !== endPage) return null;

  const layer =
    startPage.querySelector<HTMLElement>(".pdf-text-layer") ??
    startPage.querySelector<HTMLElement>(".vpv-text-layer-wrapper") ??
    startPage.querySelector<HTMLElement>(".textLayer");
  if (!layer) return null;

  const pageNum =
    Number(startPage.dataset.pageNumber) ||
    (Number.isFinite(Number(startPage.dataset.pageIndex))
      ? Number(startPage.dataset.pageIndex) + 1
      : NaN);
  if (!Number.isFinite(pageNum) || pageNum < 1) return null;

  const charStart = offsetInRoot(layer, range.startContainer, range.startOffset);
  const charEnd = offsetInRoot(layer, range.endContainer, range.endOffset);
  if (charEnd <= charStart) return null;

  return { kind: "pdf", page: pageNum, charStart, charEnd };
}
