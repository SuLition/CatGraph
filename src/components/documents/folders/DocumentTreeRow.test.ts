import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { Component } from "vue";
import type { DocumentRecord } from "../../../types/document";
import type { FolderRecord } from "../../../types/folder";
import DocumentTreeRow from "./DocumentTreeRow.vue";
import type { FlatDocumentRow, FlatFolderRow } from "./folder-tree";

const iconStub = { template: "<span />" } as Component;

const folder = (overrides: Partial<FolderRecord> = {}): FolderRecord => ({
  id: "folder-1",
  name: "Folder",
  parentId: null,
  pinned: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const doc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id: "doc-1",
  title: "Doc",
  kind: "pdf",
  originalName: "doc.pdf",
  storedPath: "documents/doc.pdf",
  byteSize: 1,
  contentHash: "hash-doc",
  importedAt: "2026-01-01T00:00:00Z",
  folderId: "folder-1",
  ...overrides,
});

const folderRow = (overrides: Partial<FlatFolderRow> = {}): FlatFolderRow => ({
  kind: "folder",
  id: "folder-1",
  depth: 0,
  folder: folder(),
  isUnfiled: false,
  hasChildren: true,
  totalDocumentCount: 1,
  ...overrides,
});

const documentRow = (overrides: Partial<FlatDocumentRow> = {}): FlatDocumentRow => ({
  kind: "document",
  id: "doc-1",
  depth: 1,
  document: doc(),
  parentId: "folder-1",
  ...overrides,
});

function mountRow(row: FlatFolderRow | FlatDocumentRow) {
  return mount(DocumentTreeRow, {
    props: {
      row,
      selected: false,
      expanded: true,
      editing: false,
      dropTarget: false,
    },
    global: {
      stubs: {
        ChevronDown20Regular: iconStub,
        ChevronRight20Regular: iconStub,
        Folder20Regular: iconStub,
        FolderOpen20Regular: iconStub,
        Pin20Filled: iconStub,
      },
    },
  });
}

describe("DocumentTreeRow", () => {
  it("toggles a folder on a single click", async () => {
    const wrapper = mountRow(folderRow());

    await wrapper.find(".tree-row").trigger("click");

    expect(wrapper.emitted("toggle")).toHaveLength(1);
  });

  it("does not start folder rename on double click", async () => {
    const wrapper = mountRow(folderRow());

    await wrapper.find(".tree-row").trigger("dblclick");

    expect(wrapper.emitted("rename-start")).toBeUndefined();
  });

  it("does not start folder rename from the label on double click", async () => {
    const wrapper = mountRow(folderRow());
    const label = wrapper.find(".row-label");

    await label.trigger("dblclick");

    expect(wrapper.emitted("rename-start")).toBeUndefined();
  });

  it("emits the context menu position for folder rows", async () => {
    const wrapper = mountRow(folderRow());

    await wrapper.find(".tree-row").trigger("contextmenu", {
      clientX: 120,
      clientY: 80,
    });

    expect(wrapper.emitted("context")).toEqual([[{ x: 120, y: 80 }]]);
  });

  it("marks document rows for SortableJS and leaves folder rows non-draggable", async () => {
    const docWrapper = mountRow(documentRow());
    const folderWrapper = mountRow(folderRow());

    expect(docWrapper.find(".tree-row").attributes("data-row-kind")).toBe("document");
    expect(docWrapper.find(".tree-row").attributes("data-row-id")).toBe("doc-1");
    expect(folderWrapper.find(".tree-row").attributes("data-row-kind")).toBe("folder");
    expect(folderWrapper.find(".tree-row").attributes("data-row-id")).toBe("folder-1");
  });

  it("selects a document on a single click without double-click rename", async () => {
    const wrapper = mountRow(documentRow());

    await wrapper.find(".tree-row").trigger("click");
    await wrapper.find(".tree-row").trigger("dblclick");

    expect(wrapper.emitted("select")).toHaveLength(1);
    expect(wrapper.emitted("rename-start")).toBeUndefined();
  });
});
