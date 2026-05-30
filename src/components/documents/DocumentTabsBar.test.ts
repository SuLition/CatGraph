import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { Component } from "vue";
import DocumentTabsBar from "./DocumentTabsBar.vue";

const iconStub = { template: "<span />" } as Component;
const contextMenuStub = {
  props: ["open", "x", "y", "items"],
  emits: ["select", "close"],
  template: "<div />",
} as Component;

const tabs = [
  { id: "a", title: "Alpha", kind: "pdf" },
  { id: "b", title: "Beta", kind: "md" },
];

function mountBar(activeId: string | null = "a") {
  return mount(DocumentTabsBar, {
    props: { tabs, activeId },
    global: {
      stubs: {
        Dismiss12Regular: iconStub,
        ContextMenu: contextMenuStub,
      },
    },
  });
}

describe("DocumentTabsBar", () => {
  it("renders one tab per item with its title and kind badge", () => {
    const wrapper = mountBar();
    const tabEls = wrapper.findAll(".tab");
    expect(tabEls).toHaveLength(2);
    expect(wrapper.findAll(".tab-label")[0].text()).toBe("Alpha");
    expect(wrapper.findAll(".tab-badge")[0].text()).toBe("PDF");
    expect(wrapper.findAll(".tab-badge")[1].text()).toBe("MD");
  });

  it("marks only the active tab", () => {
    const wrapper = mountBar("b");
    const tabEls = wrapper.findAll(".tab");
    expect(tabEls[0].classes()).not.toContain("is-active");
    expect(tabEls[1].classes()).toContain("is-active");
  });

  it("emits select with the tab id when the label is clicked", async () => {
    const wrapper = mountBar();
    await wrapper.findAll(".tab-label")[1].trigger("click");
    expect(wrapper.emitted("select")).toEqual([["b"]]);
  });

  it("emits select when clicking the tab body outside the label", async () => {
    const wrapper = mountBar();
    await wrapper.findAll(".tab")[1].trigger("click");
    expect(wrapper.emitted("select")).toEqual([["b"]]);
  });

  it("emits close when the close button is clicked", async () => {
    const wrapper = mountBar();
    await wrapper.findAll(".tab-close")[0].trigger("click");
    expect(wrapper.emitted("close")).toEqual([["a"]]);
  });

  it("emits close on a middle click of the tab", async () => {
    const wrapper = mountBar();
    await wrapper.findAll(".tab")[1].trigger("auxclick", { button: 1 });
    expect(wrapper.emitted("close")).toEqual([["b"]]);
  });

  it("ignores non-middle auxclicks", async () => {
    const wrapper = mountBar();
    await wrapper.findAll(".tab")[1].trigger("auxclick", { button: 2 });
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("routes context-menu actions to the right-clicked tab", async () => {
    const wrapper = mountBar();
    await wrapper.findAll(".tab")[1].trigger("contextmenu");
    const menu = wrapper.findComponent(contextMenuStub);

    menu.vm.$emit("select", "close-others");
    expect(wrapper.emitted("close-others")).toEqual([["b"]]);

    menu.vm.$emit("select", "close-all");
    expect(wrapper.emitted("close-all")).toHaveLength(1);
  });
});
