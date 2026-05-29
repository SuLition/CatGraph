import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFoldersStore } from "./folders.store";

vi.mock("../services/folders.service", () => ({
  listFolders: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  setFolderPinned: vi.fn(),
  deleteFolder: vi.fn(),
}));

import * as svc from "../services/folders.service";

const folder = (id: string, name = `n-${id}`, parentId: string | null = null, pinned = false) => ({
  id,
  name,
  parentId,
  pinned,
  createdAt: "2026-01-01T00:00:00Z",
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(svc.listFolders).mockReset();
  vi.mocked(svc.createFolder).mockReset();
  vi.mocked(svc.renameFolder).mockReset();
  vi.mocked(svc.setFolderPinned).mockReset();
  vi.mocked(svc.deleteFolder).mockReset();
});

describe("folders.store", () => {
  it("loads folders into the reactive list", async () => {
    vi.mocked(svc.listFolders).mockResolvedValueOnce([folder("a"), folder("b")]);
    const store = useFoldersStore();
    await store.load();
    expect(store.folders).toHaveLength(2);
    expect(store.byId("a")?.name).toBe("n-a");
  });

  it("create appends the new folder", async () => {
    vi.mocked(svc.createFolder).mockResolvedValueOnce(folder("c", "New"));
    const store = useFoldersStore();
    const record = await store.create("New", null);
    expect(record.id).toBe("c");
    expect(store.folders.map((f) => f.id)).toEqual(["c"]);
  });

  it("rename replaces the folder record", async () => {
    vi.mocked(svc.listFolders).mockResolvedValueOnce([folder("a")]);
    vi.mocked(svc.renameFolder).mockResolvedValueOnce(folder("a", "Renamed"));
    const store = useFoldersStore();
    await store.load();
    await store.rename("a", "Renamed");
    expect(store.byId("a")?.name).toBe("Renamed");
  });

  it("setPinned updates the pinned flag", async () => {
    vi.mocked(svc.listFolders).mockResolvedValueOnce([folder("a")]);
    vi.mocked(svc.setFolderPinned).mockResolvedValueOnce(folder("a", "n-a", null, true));
    const store = useFoldersStore();
    await store.load();
    await store.setPinned("a", true);
    expect(store.byId("a")?.pinned).toBe(true);
  });

  it("remove drops every returned folder id", async () => {
    vi.mocked(svc.listFolders).mockResolvedValueOnce([
      folder("a"),
      folder("b", "n-b", "a"),
      folder("c"),
    ]);
    vi.mocked(svc.deleteFolder).mockResolvedValueOnce({
      deletedFolderIds: ["a", "b"],
      deletedDocumentIds: ["d1"],
    });
    const store = useFoldersStore();
    await store.load();
    const result = await store.remove("a");
    expect(store.folders.map((f) => f.id)).toEqual(["c"]);
    expect(result.deletedDocumentIds).toEqual(["d1"]);
  });
});
