import type { DocumentKind } from "../types/document";

const EXTENSION_MAP: Record<string, DocumentKind> = {
  pdf: "pdf",
  md: "markdown",
  markdown: "markdown",
  txt: "text",
  text: "text",
  docx: "docx",
  xlsx: "xlsx",
};

export function kindFromExtension(ext: string): DocumentKind | null {
  const normalized = ext.replace(/^\./, "").toLowerCase();
  if (!normalized) return null;
  return EXTENSION_MAP[normalized] ?? null;
}

export function kindFromFileName(fileName: string): DocumentKind | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === fileName.length - 1) return null;
  return kindFromExtension(fileName.slice(lastDot + 1));
}

export function titleFromFileName(fileName: string): string {
  const lastSlash = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
  const base = lastSlash >= 0 ? fileName.slice(lastSlash + 1) : fileName;
  const lastDot = base.lastIndexOf(".");
  return lastDot > 0 ? base.slice(0, lastDot) : base;
}
