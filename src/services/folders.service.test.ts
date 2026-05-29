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
  createFolder,
  deleteFolder,
  listFolders,
  revealDocumentsFolder,
  renameFolder,
  setFolderPinned,
} from "./folders.service";

describe("folders.service", () => {
  it("createFolder forwards name and parentId", async () => {
    invokeMock.mockResolvedValueOnce({ id: "fld-1" });
    await createFolder("New", null);
    expect(invokeMock).toHaveBeenCalledWith("create_folder", { name: "New", parentId: null });
  });

  it("renameFolder forwards id and name", async () => {
    invokeMock.mockResolvedValueOnce({ id: "fld-1" });
    await renameFolder("fld-1", "X");
    expect(invokeMock).toHaveBeenCalledWith("rename_folder", { id: "fld-1", name: "X" });
  });

  it("setFolderPinned forwards id and pinned", async () => {
    invokeMock.mockResolvedValueOnce({ id: "fld-1" });
    await setFolderPinned("fld-1", true);
    expect(invokeMock).toHaveBeenCalledWith("set_folder_pinned", { id: "fld-1", pinned: true });
  });

  it("deleteFolder forwards id", async () => {
    invokeMock.mockResolvedValueOnce({ deletedFolderIds: [], deletedDocumentIds: [] });
    await deleteFolder("fld-1");
    expect(invokeMock).toHaveBeenCalledWith("delete_folder", { id: "fld-1" });
  });

  it("revealDocumentsFolder forwards command", async () => {
    invokeMock.mockResolvedValueOnce(null);
    await revealDocumentsFolder();
    expect(invokeMock).toHaveBeenCalledWith("reveal_documents_folder");
  });

  it("throws in non-Tauri runtime", async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
    await expect(listFolders()).rejects.toThrow(/desktop/i);
  });
});
