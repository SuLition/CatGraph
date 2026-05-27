import { beforeEach, describe, expect, it } from "vitest";
import { computePdfAnchor, computeTextAnchor } from "./anchor";

describe("computeTextAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns char offsets within a single-text-node container", () => {
    const root = document.createElement("div");
    root.textContent = "Hello world, this is text.";
    document.body.appendChild(root);

    const range = document.createRange();
    range.setStart(root.firstChild!, 6);
    range.setEnd(root.firstChild!, 11);

    const anchor = computeTextAnchor(root, range);
    expect(anchor).toEqual({ kind: "text", charStart: 6, charEnd: 11 });
  });

  it("walks nested elements to compute offsets", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>abc</p><p>defghi</p>";
    document.body.appendChild(root);

    const second = root.querySelectorAll("p")[1].firstChild!;
    const range = document.createRange();
    range.setStart(second, 1);
    range.setEnd(second, 4);

    const anchor = computeTextAnchor(root, range);
    expect(anchor).toEqual({ kind: "text", charStart: 4, charEnd: 7 });
  });

  it("returns null when range is outside root", () => {
    const root = document.createElement("div");
    root.textContent = "abc";
    const other = document.createElement("div");
    other.textContent = "xyz";
    document.body.append(root, other);

    const range = document.createRange();
    range.setStart(other.firstChild!, 0);
    range.setEnd(other.firstChild!, 1);
    expect(computeTextAnchor(root, range)).toBeNull();
  });
});

describe("computePdfAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function buildPage(pageNum: number, html: string) {
    const div = document.createElement("div");
    div.className = "pdf-page";
    div.dataset.pageNumber = String(pageNum);
    div.innerHTML = `<div class="pdf-text-layer">${html}</div>`;
    document.body.appendChild(div);
    return div;
  }

  it("returns page + char offsets for a single-page selection", () => {
    const page = buildPage(3, "<span>abcdef</span><span>ghij</span>");
    const text = page.querySelector(".pdf-text-layer")!;
    const span2 = text.querySelectorAll("span")[1].firstChild!;
    const range = document.createRange();
    range.setStart(span2, 1);
    range.setEnd(span2, 3);

    const anchor = computePdfAnchor(range);
    expect(anchor).toEqual({ kind: "pdf", page: 3, charStart: 7, charEnd: 9 });
  });

  it("returns null when selection spans two pages", () => {
    const p1 = buildPage(1, "<span>aaa</span>");
    const p2 = buildPage(2, "<span>bbb</span>");

    const range = document.createRange();
    range.setStart(p1.querySelector("span")!.firstChild!, 1);
    range.setEnd(p2.querySelector("span")!.firstChild!, 2);

    expect(computePdfAnchor(range)).toBeNull();
  });

  it("accepts same-page selection when endpoints resolve via different page-tagged ancestors", () => {
    const outer = document.createElement("div");
    outer.className = "vpv-page-inner-container";
    outer.dataset.pageIndex = "4";
    const wrapper = document.createElement("div");
    wrapper.className = "vpv-text-layer-wrapper pdf-text-layer";
    wrapper.dataset.pageIndex = "4";
    wrapper.innerHTML = "<span>abcdef</span><span>ghij</span>";
    outer.appendChild(wrapper);
    document.body.appendChild(outer);

    const span = wrapper.querySelectorAll("span")[0].firstChild!;
    const range = document.createRange();
    range.setStart(span, 2);
    range.setEnd(outer, outer.childNodes.length);

    const anchor = computePdfAnchor(range);
    expect(anchor).toEqual({ kind: "pdf", page: 5, charStart: 2, charEnd: 10 });
  });
});
