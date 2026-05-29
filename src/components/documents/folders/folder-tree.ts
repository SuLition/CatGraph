import type { DocumentRecord } from "../../../types/document";
import type { FolderRecord } from "../../../types/folder";

/** Virtual folder that holds documents not assigned to any real folder. */
export const UNFILED_FOLDER_ID = "__unfiled__";
export const UNFILED_FOLDER_NAME = "未分类";

export interface FolderTreeNode {
  folder: FolderRecord;
  isUnfiled: boolean;
  children: FolderTreeNode[];
  documents: DocumentRecord[];
}

export interface FlatFolderRow {
  kind: "folder";
  id: string;
  depth: number;
  folder: FolderRecord;
  isUnfiled: boolean;
  hasChildren: boolean;
  /** Documents in this folder and all of its descendants. */
  totalDocumentCount: number;
}

export interface FlatDocumentRow {
  kind: "document";
  id: string;
  depth: number;
  document: DocumentRecord;
  /** Id of the folder this document sits in (may be UNFILED_FOLDER_ID). */
  parentId: string;
}

export type FlatRow = FlatFolderRow | FlatDocumentRow;

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, "zh-Hans-CN", { numeric: true });
}

function sortFolders(folders: FolderRecord[]): FolderRecord[] {
  return [...folders].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return compareNames(a.name, b.name);
  });
}

function sortDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return [...documents].sort((a, b) => compareNames(a.title, b.title));
}

/**
 * Builds the folder/document tree. Documents with no folder — or pointing at a
 * folder that no longer exists — land in the virtual "未分类" node, which is
 * always appended last so it doubles as a stable drop target.
 */
export function buildFolderTree(
  folders: FolderRecord[],
  documents: DocumentRecord[],
): FolderTreeNode[] {
  const validIds = new Set(folders.map((f) => f.id));

  const docsByFolder = new Map<string, DocumentRecord[]>();
  const unfiled: DocumentRecord[] = [];
  for (const doc of documents) {
    const fid = doc.folderId ?? null;
    if (fid !== null && validIds.has(fid)) {
      const bucket = docsByFolder.get(fid);
      if (bucket) bucket.push(doc);
      else docsByFolder.set(fid, [doc]);
    } else {
      unfiled.push(doc);
    }
  }

  const childrenByParent = new Map<string | null, FolderRecord[]>();
  for (const folder of folders) {
    const pid = folder.parentId && validIds.has(folder.parentId) ? folder.parentId : null;
    const bucket = childrenByParent.get(pid);
    if (bucket) bucket.push(folder);
    else childrenByParent.set(pid, [folder]);
  }

  const build = (parentId: string | null): FolderTreeNode[] =>
    sortFolders(childrenByParent.get(parentId) ?? []).map((folder) => ({
      folder,
      isUnfiled: false,
      children: build(folder.id),
      documents: sortDocuments(docsByFolder.get(folder.id) ?? []),
    }));

  const tree = build(null);

  tree.push({
    folder: {
      id: UNFILED_FOLDER_ID,
      name: UNFILED_FOLDER_NAME,
      parentId: null,
      pinned: false,
      createdAt: "",
    },
    isUnfiled: true,
    children: [],
    documents: sortDocuments(unfiled),
  });

  return tree;
}

function countNodeDocuments(node: FolderTreeNode): number {
  return node.documents.length + node.children.reduce((sum, c) => sum + countNodeDocuments(c), 0);
}

/** Flattens the tree into visible rows, honouring the expanded set. */
export function flattenTree(
  nodes: FolderTreeNode[],
  isExpanded: (id: string) => boolean,
  depth = 0,
): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const node of nodes) {
    rows.push({
      kind: "folder",
      id: node.folder.id,
      depth,
      folder: node.folder,
      isUnfiled: node.isUnfiled,
      hasChildren: node.children.length > 0 || node.documents.length > 0,
      totalDocumentCount: countNodeDocuments(node),
    });

    if (isExpanded(node.folder.id)) {
      rows.push(...flattenTree(node.children, isExpanded, depth + 1));
      for (const doc of node.documents) {
        rows.push({
          kind: "document",
          id: doc.id,
          depth: depth + 1,
          document: doc,
          parentId: node.folder.id,
        });
      }
    }
  }
  return rows;
}

/** Counts descendant subfolders and the documents inside a subtree (for delete confirmation). */
export function countFolderContents(
  folders: FolderRecord[],
  documents: DocumentRecord[],
  folderId: string,
): { folderCount: number; documentCount: number } {
  const ids = new Set<string>([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }
  const documentCount = documents.filter((d) => d.folderId != null && ids.has(d.folderId)).length;
  return { folderCount: ids.size - 1, documentCount };
}
