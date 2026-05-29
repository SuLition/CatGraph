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

import {
  deleteDocument,
  importDocument,
  listDocuments,
  readDocumentBytes,
  revealDocument,
  renameDocument,
  setDocumentFolder,
} from "./documents.service";

describe("documents.service", () => {
  it("importDocument forwards srcPath with a null folder by default", async () => {
    const record = { id: "abc", title: "x", kind: "pdf" };
    invokeMock.mockResolvedValueOnce(record);

    const result = await importDocument("/path/to/file.pdf");

    expect(invokeMock).toHaveBeenCalledWith("import_document", {
      srcPath: "/path/to/file.pdf",
      folderId: null,
    });
    expect(result).toEqual(record);
  });

  it("importDocument forwards the target folder", async () => {
    invokeMock.mockResolvedValueOnce({ id: "abc" });
    await importDocument("/path/to/file.pdf", "fld-1");
    expect(invokeMock).toHaveBeenCalledWith("import_document", {
      srcPath: "/path/to/file.pdf",
      folderId: "fld-1",
    });
  });

  it("setDocumentFolder forwards id and folderId", async () => {
    invokeMock.mockResolvedValueOnce({ id: "doc-1" });
    await setDocumentFolder("doc-1", null);
    expect(invokeMock).toHaveBeenCalledWith("set_document_folder", {
      id: "doc-1",
      folderId: null,
    });
  });

  it("renameDocument forwards id and title", async () => {
    invokeMock.mockResolvedValueOnce({ id: "doc-1", title: "new" });
    await renameDocument("doc-1", "new");
    expect(invokeMock).toHaveBeenCalledWith("rename_document", { id: "doc-1", title: "new" });
  });

  it("revealDocument forwards id", async () => {
    invokeMock.mockResolvedValueOnce(null);
    await revealDocument("doc-1");
    expect(invokeMock).toHaveBeenCalledWith("reveal_document", { id: "doc-1" });
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
