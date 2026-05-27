import { afterEach, describe, expect, it, vi } from "vitest";
import { createSnippet, normalizeSnippetText } from "./snippet.model";
import type { SnippetAnchor } from "../types/snippet";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const textAnchor: SnippetAnchor = {
  documentId: "doc-1",
  locator: { kind: "text", charStart: 12, charEnd: 30 },
};

describe("normalizeSnippetText", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeSnippetText("  hello\n  world  ")).toBe("hello world");
    expect(normalizeSnippetText("a\t\tb")).toBe("a b");
  });
});

describe("createSnippet", () => {
  it("fills id, createdAt, and normalizes text", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-2222-3333-4444-555555555555" as ReturnType<Crypto["randomUUID"]>,
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T10:00:00Z"));

    const snippet = createSnippet({ text: "  foo  bar  ", anchor: textAnchor });

    expect(snippet.id).toBe("11111111-2222-3333-4444-555555555555");
    expect(snippet.text).toBe("foo bar");
    expect(snippet.createdAt).toBe("2026-05-27T10:00:00.000Z");
    expect(snippet.anchor).toEqual(textAnchor);
  });

  it("preserves optional note when provided", () => {
    const snippet = createSnippet({ text: "x", anchor: textAnchor, note: "see p.3" });
    expect(snippet.note).toBe("see p.3");
  });
});
