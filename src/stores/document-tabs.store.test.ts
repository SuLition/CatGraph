import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useDocumentTabsStore } from "./document-tabs.store";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("document-tabs.store", () => {
  it("open appends and activates", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    expect(tabs.openIds).toEqual(["a", "b"]);
    expect(tabs.activeId).toBe("b");
  });

  it("open an already-open tab only activates it, no duplicate", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.open("a");
    expect(tabs.openIds).toEqual(["a", "b"]);
    expect(tabs.activeId).toBe("a");
  });

  it("setActive only switches when the tab is open", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.setActive("a");
    expect(tabs.activeId).toBe("a");
    tabs.setActive("zzz");
    expect(tabs.activeId).toBe("a");
  });

  it("closing the active tab activates the right neighbor", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.open("c");
    tabs.setActive("b");
    tabs.close("b");
    expect(tabs.openIds).toEqual(["a", "c"]);
    expect(tabs.activeId).toBe("c");
  });

  it("closing the last active tab falls back to the left neighbor", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.setActive("b");
    tabs.close("b");
    expect(tabs.openIds).toEqual(["a"]);
    expect(tabs.activeId).toBe("a");
  });

  it("closing the only tab clears the active id", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.close("a");
    expect(tabs.openIds).toEqual([]);
    expect(tabs.activeId).toBeNull();
  });

  it("closing a non-active tab keeps the active id", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.open("c");
    tabs.setActive("a");
    tabs.close("c");
    expect(tabs.openIds).toEqual(["a", "b"]);
    expect(tabs.activeId).toBe("a");
  });

  it("close is a no-op for a tab that is not open", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.close("missing");
    expect(tabs.openIds).toEqual(["a"]);
    expect(tabs.activeId).toBe("a");
  });

  it("closeOthers keeps only the given tab and activates it", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.open("c");
    tabs.closeOthers("b");
    expect(tabs.openIds).toEqual(["b"]);
    expect(tabs.activeId).toBe("b");
  });

  it("closeAll empties everything", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.closeAll();
    expect(tabs.openIds).toEqual([]);
    expect(tabs.activeId).toBeNull();
  });

  it("prune drops ids that no longer exist", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.open("c");
    tabs.setActive("b");
    tabs.prune(new Set(["a", "c"]));
    expect(tabs.openIds).toEqual(["a", "c"]);
    expect(tabs.activeId).toBe("a");
  });

  it("prune keeps the active id when it still exists", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    tabs.open("b");
    tabs.setActive("b");
    tabs.prune(new Set(["a", "b"]));
    expect(tabs.activeId).toBe("b");
  });

  it("isOpen reflects membership", () => {
    const tabs = useDocumentTabsStore();
    tabs.open("a");
    expect(tabs.isOpen("a")).toBe(true);
    expect(tabs.isOpen("b")).toBe(false);
  });
});
