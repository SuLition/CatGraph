import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "./documents.store";

vi.mock("../services/documents.service", () => ({
  listDocuments: vi.fn(),
  importDocument: vi.fn(),
  deleteDocument: vi.fn(),
  readDocumentBytes: vi.fn(),
  setDocumentFolder: vi.fn(),
  renameDocument: vi.fn(),
}));

import * as svc from "../services/documents.service";

const sample = (id: string) => ({
  id,
  title: `t-${id}`,
  kind: "pdf" as const,
  originalName: `${id}.pdf`,
  storedPath: `documents/${id}.pdf`,
  byteSize: 10,
  contentHash: `hash-${id}`,
  importedAt: "2026-05-27T10:00:00Z",
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(svc.listDocuments).mockReset();
  vi.mocked(svc.importDocument).mockReset();
  vi.mocked(svc.deleteDocument).mockReset();
  vi.mocked(svc.setDocumentFolder).mockReset();
  vi.mocked(svc.renameDocument).mockReset();
});

describe("documents.store", () => {
  it("loads documents into reactive list", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a"), sample("b")]);
    const store = useDocumentsStore();
    await store.load();
    expect(store.documents).toHaveLength(2);
    expect(store.byId("a")?.title).toBe("t-a");
  });

  it("import appends to list and returns record", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([]);
    vi.mocked(svc.importDocument).mockResolvedValueOnce(sample("c"));
    const store = useDocumentsStore();
    await store.load();
    const rec = await store.importFromPath("/path/c.pdf");
    expect(rec.id).toBe("c");
    expect(store.documents).toHaveLength(1);
  });

  it("import skips duplicate when id already present", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a")]);
    vi.mocked(svc.importDocument).mockResolvedValueOnce(sample("a"));
    const store = useDocumentsStore();
    await store.load();
    await store.importFromPath("/path/a.pdf");
    expect(store.documents).toHaveLength(1);
  });

  it("remove deletes record by id", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a"), sample("b")]);
    vi.mocked(svc.deleteDocument).mockResolvedValueOnce(undefined);
    const store = useDocumentsStore();
    await store.load();
    await store.remove("a");
    expect(store.documents.map((d) => d.id)).toEqual(["b"]);
  });

  it("setFolder updates the record's folderId", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a")]);
    vi.mocked(svc.setDocumentFolder).mockResolvedValueOnce({ ...sample("a"), folderId: "f1" });
    const store = useDocumentsStore();
    await store.load();
    await store.setFolder("a", "f1");
    expect(store.byId("a")?.folderId).toBe("f1");
  });

  it("rename updates the title", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a")]);
    vi.mocked(svc.renameDocument).mockResolvedValueOnce({ ...sample("a"), title: "renamed" });
    const store = useDocumentsStore();
    await store.load();
    await store.rename("a", "renamed");
    expect(store.byId("a")?.title).toBe("renamed");
  });

  it("dropLocal removes records without a backend call", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a"), sample("b"), sample("c")]);
    const store = useDocumentsStore();
    await store.load();
    store.dropLocal(["a", "c"]);
    expect(store.documents.map((d) => d.id)).toEqual(["b"]);
    expect(svc.deleteDocument).not.toHaveBeenCalled();
  });
});
