import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SnippetRecord } from "../types/snippet";

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

import { deleteSnippet, listSnippets, saveSnippet } from "./snippets.service";

const exampleSnippet: SnippetRecord = {
  id: "s-1",
  text: "hello",
  anchor: { documentId: "d-1", locator: { kind: "text", charStart: 0, charEnd: 5 } },
  createdAt: "2026-05-27T10:00:00.000Z",
};

describe("snippets.service", () => {
  it("listSnippets returns array", async () => {
    invokeMock.mockResolvedValueOnce([exampleSnippet]);
    expect(await listSnippets()).toEqual([exampleSnippet]);
  });

  it("saveSnippet forwards snippet payload", async () => {
    invokeMock.mockResolvedValueOnce(exampleSnippet);
    await saveSnippet(exampleSnippet);
    expect(invokeMock).toHaveBeenCalledWith("save_snippet", { snippet: exampleSnippet });
  });

  it("deleteSnippet forwards id", async () => {
    invokeMock.mockResolvedValueOnce(null);
    await deleteSnippet("s-1");
    expect(invokeMock).toHaveBeenCalledWith("delete_snippet", { id: "s-1" });
  });
});
