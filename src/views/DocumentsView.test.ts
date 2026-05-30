/* eslint-disable vue/one-component-per-file, vue/require-prop-types */
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, h, defineComponent } from "vue";
import { useDocumentsStore } from "../stores/documents.store";
import { useDocumentTabsStore } from "../stores/document-tabs.store";

vi.mock("../services/documents.service", () => ({
  listDocuments: vi.fn(async () => []),
  importDocument: vi.fn(),
  deleteDocument: vi.fn(),
  readDocumentBytes: vi.fn(async () => new Uint8Array()),
  revealDocument: vi.fn(),
  renameDocument: vi.fn(),
  setDocumentFolder: vi.fn(),
}));

vi.mock("../services/snippets.service", () => ({
  listSnippetsByDocument: vi.fn(async () => []),
  searchSnippets: vi.fn(async () => []),
  upsertSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
}));

vi.mock("../components/documents/snippets/SnippetPanel.vue", () => ({
  default: defineComponent({
    name: "SnippetPanelStub",
    props: ["documentId"],
    emits: ["jump"],
    template: '<div class="snippet-panel-stub" />',
  }),
}));

vi.mock("../components/documents/DocumentTabsBar.vue", () => ({
  default: defineComponent({
    name: "DocumentTabsBarStub",
    props: ["tabs", "activeId"],
    template: '<div class="tabs-stub" />',
  }),
}));

vi.mock("../components/documents/DocumentEmpty.vue", () => ({
  default: defineComponent({
    name: "DocumentEmptyStub",
    props: ["hasDocuments"],
    template: '<div class="empty-stub" />',
  }),
}));

const jumpToSpy = vi.fn();
vi.mock("../components/documents/DocumentReader.vue", () => ({
  default: defineComponent({
    name: "DocumentReaderStub",
    props: ["documentId", "active"],
    setup(_, { expose }) {
      expose({ jumpTo: jumpToSpy });
      return () => h("div", { class: "reader-stub" });
    },
  }),
}));

import DocumentsView from "./DocumentsView.vue";

describe("DocumentsView reader registration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    jumpToSpy.mockClear();
  });

  it("registers the active reader so jump propagates to it", async () => {
    const documents = useDocumentsStore();
    documents.documents = [
      { id: "doc-a", title: "A", kind: "pdf", folderId: null } as never,
    ];
    const tabs = useDocumentTabsStore();
    tabs.open("doc-a");

    const wrapper = mount(DocumentsView);
    await flushPromises();
    await nextTick();

    const fakeSnippet = {
      id: "s1",
      anchor: { documentId: "doc-a", locator: { kind: "pdf", page: 1, charStart: 0, charEnd: 5 } },
      text: "",
    };
    const panel = wrapper.findComponent({ name: "SnippetPanelStub" });
    expect(panel.exists()).toBe(true);
    panel.vm.$emit("jump", fakeSnippet);
    await nextTick();

    expect(jumpToSpy).toHaveBeenCalledTimes(1);
    expect(jumpToSpy).toHaveBeenCalledWith(fakeSnippet.anchor.locator);
  });
});
