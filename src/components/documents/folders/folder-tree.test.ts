import { describe, expect, it } from "vitest";
import type { DocumentRecord } from "../../../types/document";
import type { FolderRecord } from "../../../types/folder";
import {
  buildFolderTree,
  countFolderContents,
  flattenTree,
  UNFILED_FOLDER_ID,
} from "./folder-tree";

const folder = (
  id: string,
  name: string,
  parentId: string | null = null,
  pinned = false,
): FolderRecord => ({ id, name, parentId, pinned, createdAt: "2026-01-01T00:00:00Z" });

const doc = (id: string, title: string, folderId: string | null = null): DocumentRecord => ({
  id,
  title,
  kind: "pdf",
  originalName: `${id}.pdf`,
  storedPath: `documents/${id}.pdf`,
  byteSize: 1,
  contentHash: `h-${id}`,
  importedAt: "2026-01-01T00:00:00Z",
  folderId,
});

describe("buildFolderTree", () => {
  it("places unfiled documents in the trailing virtual folder", () => {
    const tree = buildFolderTree([], [doc("a", "A"), doc("b", "B")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].isUnfiled).toBe(true);
    expect(tree[0].folder.id).toBe(UNFILED_FOLDER_ID);
    expect(tree[0].documents.map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("nests folders by parentId and groups documents", () => {
    const folders = [folder("f1", "One"), folder("f2", "Two", "f1")];
    const docs = [doc("d1", "Doc", "f1"), doc("d2", "Sub", "f2")];
    const tree = buildFolderTree(folders, docs);

    expect(tree.map((n) => n.folder.id)).toEqual(["f1", UNFILED_FOLDER_ID]);
    const [f1] = tree;
    expect(f1.children.map((n) => n.folder.id)).toEqual(["f2"]);
    expect(f1.documents.map((d) => d.id)).toEqual(["d1"]);
    expect(f1.children[0].documents.map((d) => d.id)).toEqual(["d2"]);
  });

  it("sorts pinned folders first, then by name", () => {
    const folders = [folder("b", "Beta"), folder("a", "Alpha"), folder("p", "Zed", null, true)];
    const tree = buildFolderTree(folders, []);
    expect(tree.filter((n) => !n.isUnfiled).map((n) => n.folder.name)).toEqual([
      "Zed",
      "Alpha",
      "Beta",
    ]);
  });

  it("treats a dangling folderId as unfiled", () => {
    const tree = buildFolderTree([folder("f1", "One")], [doc("d", "D", "missing")]);
    const unfiled = tree.find((n) => n.isUnfiled);
    expect(unfiled?.documents.map((d) => d.id)).toEqual(["d"]);
  });
});

describe("flattenTree", () => {
  it("hides descendants of collapsed folders", () => {
    const tree = buildFolderTree([folder("f1", "One"), folder("f2", "Two", "f1")], [doc("d1", "X", "f1")]);
    const rows = flattenTree(tree, () => false);
    expect(rows.map((r) => r.id)).toEqual(["f1", UNFILED_FOLDER_ID]);
  });

  it("lists subfolders before documents and assigns depth", () => {
    const tree = buildFolderTree([folder("f1", "One"), folder("f2", "Two", "f1")], [doc("d1", "X", "f1")]);
    const rows = flattenTree(tree, () => true);
    expect(rows.map((r) => r.id)).toEqual(["f1", "f2", "d1", UNFILED_FOLDER_ID]);
    expect(rows.find((r) => r.id === "f2")?.depth).toBe(1);
    expect(rows.find((r) => r.id === "d1")?.depth).toBe(1);
  });
});

describe("countFolderContents", () => {
  it("counts descendant folders and documents in the subtree", () => {
    const folders = [folder("f1", "One"), folder("f2", "Two", "f1"), folder("f3", "Three", "f2")];
    const docs = [doc("d1", "a", "f1"), doc("d2", "b", "f2"), doc("d3", "c", "f3"), doc("d4", "x")];
    expect(countFolderContents(folders, docs, "f1")).toEqual({ folderCount: 2, documentCount: 3 });
    expect(countFolderContents(folders, docs, "f2")).toEqual({ folderCount: 1, documentCount: 2 });
    expect(countFolderContents(folders, docs, "f3")).toEqual({ folderCount: 0, documentCount: 1 });
  });
});
