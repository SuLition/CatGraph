<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { FolderAdd20Regular, Search20Regular } from "@vicons/fluent";
import Sortable, { type MoveEvent, type SortableEvent } from "sortablejs";
import DocumentImportButton from "../DocumentImportButton.vue";
import ContextMenu from "./ContextMenu.vue";
import type { ContextMenuItem } from "./context-menu";
import DocumentTreeRow from "./DocumentTreeRow.vue";
import { useExternalFileDrop } from "./useExternalFileDrop";
import {
  buildFolderTree,
  countFolderContents,
  flattenTree,
  UNFILED_FOLDER_ID,
  type FlatDocumentRow,
  type FlatFolderRow,
  type FlatRow,
} from "./folder-tree";
import { SIDE_LISTS } from "../../../data/nav-side-lists";
import { useDocumentsStore } from "../../../stores/documents.store";
import { useFoldersStore } from "../../../stores/folders.store";
import { useSnippetsStore } from "../../../stores/snippets.store";
import { useToastStore } from "../../../stores/toast.store";
import { useDocumentTabsStore } from "../../../stores/document-tabs.store";
import type { DocumentRecord } from "../../../types/document";

const folders = useFoldersStore();
const documents = useDocumentsStore();
const snippets = useSnippetsStore();
const tabs = useDocumentTabsStore();
const toast = useToastStore();

const config = SIDE_LISTS.documents;
const treeEl = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

onMounted(() => {
  if (folders.folders.length === 0) void folders.load();
});

onBeforeUnmount(() => {
  sortable?.destroy();
  sortable = null;
});

// ---- Tree + expand state -------------------------------------------------
const collapsedIds = useLocalStorage<string[]>("catgraph.folders.collapsed", []);
const collapsedSet = computed(() => new Set(collapsedIds.value));
const isExpanded = (id: string) => !collapsedSet.value.has(id);

const tree = computed(() => buildFolderTree(folders.folders, documents.documents));
const flatRows = computed<FlatRow[]>(() => flattenTree(tree.value, isExpanded));
const isEmpty = computed(
  () => folders.folders.length === 0 && documents.documents.length === 0,
);

const selectedDocId = computed(() => tabs.activeId);

function toggleExpand(id: string) {
  const set = new Set(collapsedIds.value);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  collapsedIds.value = [...set];
}

function expand(id: string) {
  if (collapsedIds.value.includes(id)) {
    collapsedIds.value = collapsedIds.value.filter((x) => x !== id);
  }
}

// ---- Selection -----------------------------------------------------------
function selectDocument(id: string) {
  tabs.open(id);
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ---- Inline rename -------------------------------------------------------
const editing = ref<{ id: string; kind: "folder" | "document" } | null>(null);
const isEditing = (row: FlatRow) =>
  editing.value?.id === row.id && editing.value?.kind === row.kind;

function startRename(row: FlatRow) {
  // The virtual "未分类" folder is UI-only (id __unfiled__) and has no backend
  // record, so it can't be renamed — guard every rename trigger here.
  if (row.kind === "folder" && row.isUnfiled) return;
  editing.value = { id: row.id, kind: row.kind };
}

function cancelRename() {
  editing.value = null;
}

async function commitRename(value: string) {
  const target = editing.value;
  editing.value = null;
  if (!target) return;
  const name = value.trim();
  if (!name) return;
  try {
    if (target.kind === "folder") await folders.rename(target.id, name);
    else await documents.rename(target.id, name);
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

// ---- Folder operations ---------------------------------------------------
async function createRootFolder() {
  try {
    const record = await folders.create("新建文件夹", null);
    startRenameFolder(record.id);
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

function startRenameFolder(id: string) {
  editing.value = { id, kind: "folder" };
}

function afterDocumentsRemoved(ids: string[]) {
  if (ids.length === 0) return;
  for (const id of ids) tabs.close(id);
  void snippets.load();
}

async function deleteFolderWithConfirm(row: FlatFolderRow) {
  const { folderCount, documentCount } = countFolderContents(
    folders.folders,
    documents.documents,
    row.id,
  );
  const parts: string[] = [];
  if (folderCount) parts.push(`${folderCount} 个子文件夹`);
  if (documentCount) parts.push(`${documentCount} 个文档`);
  let message = `确定删除文件夹「${row.folder.name}」吗?`;
  message += parts.length
    ? `\n其中的 ${parts.join("、")} 将一并被永久删除,磁盘文件不可恢复。`
    : "\n该操作不可恢复。";

  if (!(await confirmDestructive(message, "删除文件夹"))) return;
  try {
    const result = await folders.remove(row.id);
    documents.dropLocal(result.deletedDocumentIds);
    afterDocumentsRemoved(result.deletedDocumentIds);
    toast.push("文件夹已删除", "success");
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

async function revealFolderLocation() {
  try {
    await folders.revealDocumentsLocation();
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

// ---- Document operations -------------------------------------------------
async function deleteDocumentWithConfirm(doc: DocumentRecord) {
  const message = `确定删除文档「${doc.title}」吗?\n该操作将永久删除磁盘文件,不可恢复。`;
  if (!(await confirmDestructive(message, "删除文档"))) return;
  try {
    await documents.remove(doc.id);
    afterDocumentsRemoved([doc.id]);
    toast.push("文档已删除", "success");
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

async function revealDocumentLocation(doc: DocumentRecord) {
  try {
    await documents.reveal(doc.id);
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

async function moveDocument(docId: string, folderId: string | null) {
  const doc = documents.byId(docId);
  if (!doc) return;
  if ((doc.folderId ?? null) === folderId) return;
  try {
    await documents.setFolder(docId, folderId);
  } catch (e) {
    toast.push(errMessage(e), "error");
  }
}

function handleImported(id: string) {
  tabs.open(id);
}

async function confirmDestructive(message: string, title: string): Promise<boolean> {
  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { confirm } = await import("@tauri-apps/plugin-dialog");
      return await confirm(message, { title, kind: "warning" });
    } catch {
      // fall through to the browser fallback
    }
  }
  return window.confirm(message);
}

// ---- Context menu --------------------------------------------------------
type MenuTarget =
  | { kind: "folder"; row: FlatFolderRow }
  | { kind: "document"; row: FlatDocumentRow };

const menu = ref<{ open: boolean; x: number; y: number; items: ContextMenuItem[] }>({
  open: false,
  x: 0,
  y: 0,
  items: [],
});
const menuTarget = ref<MenuTarget | null>(null);

function clampMenu(x: number, y: number) {
  return {
    x: Math.min(x, window.innerWidth - 184),
    y: Math.min(y, window.innerHeight - 220),
  };
}

function openContextMenu(row: FlatRow, position: { x: number; y: number }) {
  if (row.kind === "folder") {
    menuTarget.value = { kind: "folder", row };
    menu.value = {
      open: true,
      ...clampMenu(position.x, position.y),
      items: [
        { key: "rename", label: "重命名", disabled: row.isUnfiled },
        { key: "delete", label: "删除", danger: true, disabled: row.isUnfiled },
        { key: "reveal", label: "打开文件夹所在位置", separatorBefore: true },
      ],
    };
  } else {
    menuTarget.value = { kind: "document", row };
    menu.value = {
      open: true,
      ...clampMenu(position.x, position.y),
      items: [
        { key: "rename", label: "重命名" },
        { key: "delete", label: "删除", danger: true },
        { key: "reveal", label: "打开所在位置", separatorBefore: true },
      ],
    };
  }
}

function onMenuSelect(key: string) {
  const target = menuTarget.value;
  if (!target) return;
  if (target.kind === "folder") {
    if (target.row.isUnfiled && key !== "reveal") return;
    if (key === "rename") startRename(target.row);
    else if (key === "delete") void deleteFolderWithConfirm(target.row);
    else if (key === "reveal") void revealFolderLocation();
  } else {
    const doc = target.row.document;
    if (key === "rename") startRename(target.row);
    else if (key === "delete") void deleteDocumentWithConfirm(doc);
    else if (key === "reveal") void revealDocumentLocation(doc);
  }
}

// ---- Drag & drop ---------------------------------------------------------
const dropTargetId = ref<string | null>(null);

function folderIdFromPoint(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY);
  const holder = el?.closest<HTMLElement>("[data-folder-id]");
  return holder?.getAttribute("data-folder-id") ?? null;
}

function clearSortableDropState() {
  dropTargetId.value = null;
}

function eventPoint(source: Event | undefined): { x: number; y: number } | null {
  if (source && "clientX" in source && "clientY" in source) {
    const pointer = source as MouseEvent | PointerEvent;
    return { x: pointer.clientX, y: pointer.clientY };
  }
  return null;
}

function onSortableMove(_event: MoveEvent, originalEvent: Event) {
  const point = eventPoint(originalEvent);
  dropTargetId.value = point ? folderIdFromPoint(point.x, point.y) : null;
  return true;
}

function onSortableEnd(event: SortableEvent) {
  const docId = event.item.dataset.rowId;
  const source = (event as SortableEvent & { originalEvent?: Event }).originalEvent;
  const point = eventPoint(source);
  const targetId = point ? folderIdFromPoint(point.x, point.y) : dropTargetId.value;
  clearSortableDropState();
  if (!docId || !targetId) return;
  void moveDocument(docId, targetId === UNFILED_FOLDER_ID ? null : targetId);
}

watch(
  () => treeEl.value,
  async (el) => {
    sortable?.destroy();
    sortable = null;
    if (!el) return;
    await nextTick();
    sortable = Sortable.create(el, {
      animation: 120,
      draggable: "[data-row-kind='document']",
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 4,
      ghostClass: "tree-row-ghost",
      chosenClass: "tree-row-chosen",
      dragClass: "tree-row-drag",
      onMove: onSortableMove,
      onEnd: onSortableEnd,
      onUnchoose: clearSortableDropState,
    });
  },
  { flush: "post", immediate: true },
);

// External OS file drop.
function resolveFolderId(clientX: number, clientY: number): string | null {
  return folderIdFromPoint(clientX, clientY);
}

async function importExternal(paths: string[], rawFolderId: string | null) {
  const folderId = rawFolderId && rawFolderId !== UNFILED_FOLDER_ID ? rawFolderId : null;
  let ok = 0;
  let failed = 0;
  let lastId: string | null = null;
  for (const path of paths) {
    try {
      const record = await documents.importFromPath(path, folderId);
      lastId = record.id;
      ok += 1;
    } catch {
      failed += 1;
    }
  }
  if (ok > 0 && lastId) {
    if (folderId) expand(folderId);
    tabs.open(lastId);
    const where = folderId ? `「${folders.byId(folderId)?.name ?? ""}」` : "未分类";
    toast.push(`已导入 ${ok} 个文档到${where}`, "success");
  }
  if (failed > 0) {
    toast.push(`${failed} 个文件无法导入(仅支持 PDF / Markdown / 文本 / docx / xlsx)`, "warning");
  }
}

useExternalFileDrop({
  resolveFolderId,
  onHover: (folderId) => (dropTargetId.value = folderId),
  onDrop: (paths, folderId) => importExternal(paths, folderId),
});
</script>

<template>
  <aside class="document-side-list">
    <header class="side-list-header">
      <div class="header-row">
        <h2 class="side-list-title">{{ config.title }}</h2>
        <div class="header-trailing">
          <button
            type="button"
            class="header-button"
            title="新建文件夹"
            @click="createRootFolder"
          >
            <FolderAdd20Regular class="icon" aria-hidden="true" />
          </button>
          <DocumentImportButton @imported="handleImported" />
          <span class="side-list-count">{{ documents.documents.length }} 项</span>
        </div>
      </div>
      <div class="search-box">
        <Search20Regular class="search-icon" aria-hidden="true" />
        <span class="search-placeholder">{{ config.searchPlaceholder }}</span>
        <kbd class="search-kbd">⌘K</kbd>
      </div>
    </header>

    <div ref="treeEl" class="tree">
      <DocumentTreeRow
        v-for="row in flatRows"
        :key="`${row.kind}-${row.id}`"
        :row="row"
        :selected="row.kind === 'document' && row.id === selectedDocId"
        :expanded="isExpanded(row.id)"
        :editing="isEditing(row)"
        :drop-target="dropTargetId === row.id"
        @toggle="toggleExpand(row.id)"
        @select="selectDocument(row.id)"
        @context="openContextMenu(row, $event)"
        @rename-start="startRename(row)"
        @rename-commit="commitRename"
        @rename-cancel="cancelRename"
      />

      <p v-if="isEmpty" class="empty-hint">
        还没有文档。点击右上角 <FolderAdd20Regular class="inline-icon" /> 新建文件夹,或拖入文件直接导入。
      </p>
    </div>

    <ContextMenu
      :open="menu.open"
      :x="menu.x"
      :y="menu.y"
      :items="menu.items"
      @select="onMenuSelect"
      @close="menu.open = false"
    />
  </aside>
</template>

<style scoped>
.document-side-list {
  width: var(--side-list-width, 240px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  font-size: 13px;
  color: var(--muted-text-color);
  background: var(--sidelist-background-color);
}

.side-list-header {
  flex: 0 0 auto;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--border-color);
}

.header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.header-trailing {
  display: flex;
  align-items: center;
  gap: 6px;
}

.side-list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.header-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--border-control-color);
  border-radius: 4px;
  background: var(--surface-control-color);
  color: var(--muted-text-color);
  cursor: pointer;
}

.header-button:hover {
  background: var(--hover-color);
  color: var(--text-color);
}

.header-button .icon {
  width: 14px;
  height: 14px;
}

.side-list-count {
  font-size: 11px;
  color: var(--subtle-text-color);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  height: 28px;
  padding: 0 8px;
  background: var(--surface-control-color);
  border: 1px solid var(--border-control-color);
  border-radius: 6px;
  color: var(--subtle-text-color);
}

.search-icon {
  width: 14px;
  height: 14px;
  color: var(--subtle-text-color);
}

.search-placeholder {
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.search-kbd {
  font: inherit;
  font-size: 10px;
  padding: 0 4px;
  border: 1px solid var(--border-strong-color);
  border-radius: 3px;
  color: var(--subtle-text-color);
}

.tree {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 8px 6px 12px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.empty-hint {
  margin: 12px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--subtle-text-color);
}

.inline-icon {
  width: 13px;
  height: 13px;
  vertical-align: -2px;
}
</style>
