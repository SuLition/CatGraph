import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSnippetsStore } from "./snippets.store";
import type { SnippetRecord } from "../types/snippet";

vi.mock("../services/snippets.service", () => ({
  listSnippets: vi.fn(),
  saveSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
}));

import * as svc from "../services/snippets.service";

const makeSnippet = (id: string, docId = "d-1"): SnippetRecord => ({
  id,
  text: `text-${id}`,
  anchor: { documentId: docId, locator: { kind: "text", charStart: 0, charEnd: 1 } },
  createdAt: "2026-05-27T10:00:00Z",
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(svc.listSnippets).mockReset();
  vi.mocked(svc.saveSnippet).mockReset();
  vi.mocked(svc.deleteSnippet).mockReset();
});

describe("snippets.store", () => {
  it("loads list", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([makeSnippet("a")]);
    const store = useSnippetsStore();
    await store.load();
    expect(store.snippets).toHaveLength(1);
  });

  it("add appends and persists", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([]);
    const next = makeSnippet("b");
    vi.mocked(svc.saveSnippet).mockResolvedValueOnce(next);
    const store = useSnippetsStore();
    await store.load();
    await store.add(next);
    expect(svc.saveSnippet).toHaveBeenCalledWith(next);
    expect(store.snippets).toHaveLength(1);
  });

  it("byDocument filters by anchor.documentId", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([
      makeSnippet("a", "d-1"),
      makeSnippet("b", "d-2"),
      makeSnippet("c", "d-1"),
    ]);
    const store = useSnippetsStore();
    await store.load();
    expect(store.byDocument("d-1").map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("remove drops by id", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([makeSnippet("a"), makeSnippet("b")]);
    vi.mocked(svc.deleteSnippet).mockResolvedValueOnce(undefined);
    const store = useSnippetsStore();
    await store.load();
    await store.remove("a");
    expect(store.snippets.map((s) => s.id)).toEqual(["b"]);
  });
});
