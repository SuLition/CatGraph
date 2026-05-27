import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

beforeEach(() => {
  invokeMock.mockReset();
  (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ = {};
});

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
});

import { deleteDocument, importDocument, listDocuments, readDocumentBytes } from "./documents.service";

describe("documents.service", () => {
  it("importDocument forwards srcPath", async () => {
    const record = { id: "abc", title: "x", kind: "pdf" };
    invokeMock.mockResolvedValueOnce(record);

    const result = await importDocument("/path/to/file.pdf");

    expect(invokeMock).toHaveBeenCalledWith("import_document", { srcPath: "/path/to/file.pdf" });
    expect(result).toEqual(record);
  });

  it("listDocuments returns empty array on first run", async () => {
    invokeMock.mockResolvedValueOnce([]);
    expect(await listDocuments()).toEqual([]);
  });

  it("readDocumentBytes converts number array to Uint8Array", async () => {
    invokeMock.mockResolvedValueOnce([72, 101, 108, 108, 111]);
    const bytes = await readDocumentBytes("doc-1");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });

  it("deleteDocument forwards id", async () => {
    invokeMock.mockResolvedValueOnce(null);
    await deleteDocument("doc-1");
    expect(invokeMock).toHaveBeenCalledWith("delete_document", { id: "doc-1" });
  });

  it("throws in non-Tauri runtime", async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
    await expect(importDocument("x")).rejects.toThrow(/desktop/i);
  });
});
