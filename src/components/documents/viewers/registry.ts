import { defineAsyncComponent, type Component } from "vue";
import type { DocumentKind } from "../../../types/document";

const VIEWERS: Record<DocumentKind, Component> = {
  pdf: defineAsyncComponent(() => import("./PdfViewer.vue")),
  text: defineAsyncComponent(() => import("./TextViewer.vue")),
  markdown: defineAsyncComponent(() => import("./TextViewer.vue")),
  docx: defineAsyncComponent(() => import("./DocxViewer.vue")),
  xlsx: defineAsyncComponent(() => import("./XlsxViewer.vue")),
};

export function getViewer(kind: DocumentKind): Component | undefined {
  return VIEWERS[kind];
}
