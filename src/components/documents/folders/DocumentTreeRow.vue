<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Folder20Regular,
  FolderOpen20Regular,
  Pin20Filled,
} from "@vicons/fluent";
import type { FlatRow } from "./folder-tree";

const props = defineProps<{
  row: FlatRow;
  selected: boolean;
  expanded: boolean;
  editing: boolean;
  dropTarget: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "select"): void;
  (e: "context", payload: { x: number; y: number }): void;
  (e: "rename-start"): void;
  (e: "rename-commit", value: string): void;
  (e: "rename-cancel"): void;
  (e: "drag-start", event: DragEvent): void;
  (e: "drag-end"): void;
  (e: "drop-enter"): void;
  (e: "drop-leave"): void;
  (e: "drop-here", event: DragEvent): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);
const draft = ref("");

const indentStyle = () => ({ paddingLeft: `${props.row.depth * 14 + 8}px` });

function currentName(): string {
  return props.row.kind === "folder" ? props.row.folder.name : props.row.document.title;
}

watch(
  () => props.editing,
  async (editing) => {
    if (editing) {
      draft.value = currentName();
      await nextTick();
      inputEl.value?.focus();
      inputEl.value?.select();
    }
  },
  { immediate: true },
);

function commit() {
  emit("rename-commit", draft.value);
}

function onRowClick() {
  if (props.editing) return;
  if (props.row.kind === "folder") emit("toggle");
  else emit("select");
}

function onContext(event: MouseEvent) {
  emit("context", { x: event.clientX, y: event.clientY });
}

// Drop targets (internal drag): only folder rows accept document drops.
function onDragOver(event: DragEvent) {
  if (props.row.kind !== "folder") return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
}
function onDragEnter() {
  if (props.row.kind === "folder") emit("drop-enter");
}
function onDrop(event: DragEvent) {
  if (props.row.kind !== "folder") return;
  event.preventDefault();
  emit("drop-here", event);
}
</script>

<template>
  <div
    class="tree-row"
    :class="{
      'is-folder': row.kind === 'folder',
      'is-document': row.kind === 'document',
      'is-selected': selected,
      'is-drop-target': dropTarget,
    }"
    :style="indentStyle()"
    :data-folder-id="row.kind === 'folder' ? row.id : row.parentId"
    :draggable="row.kind === 'document' && !editing"
    @click="onRowClick"
    @contextmenu.prevent="onContext"
    @dragstart="emit('drag-start', $event)"
    @dragend="emit('drag-end')"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="emit('drop-leave')"
    @drop="onDrop"
  >
    <!-- Folder row -->
    <template v-if="row.kind === 'folder'">
      <span class="twisty" :class="{ 'is-hidden': !row.hasChildren }">
        <ChevronDown20Regular v-if="expanded" />
        <ChevronRight20Regular v-else />
      </span>
      <FolderOpen20Regular v-if="expanded && row.hasChildren" class="row-icon folder-icon" />
      <Folder20Regular v-else class="row-icon folder-icon" />

      <input
        v-if="editing"
        ref="inputEl"
        v-model="draft"
        class="rename-input"
        type="text"
        @click.stop
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="emit('rename-cancel')"
        @blur="commit"
      />
      <span v-else class="row-label">{{ row.folder.name }}</span>

      <Pin20Filled v-if="!editing && row.folder.pinned" class="pin-icon" />
      <span v-if="!editing && row.totalDocumentCount > 0" class="row-count">
        {{ row.totalDocumentCount }}
      </span>
    </template>

    <!-- Document row -->
    <template v-else>
      <span class="type-badge">{{ row.document.kind.toUpperCase() }}</span>
      <input
        v-if="editing"
        ref="inputEl"
        v-model="draft"
        class="rename-input"
        type="text"
        @click.stop
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="emit('rename-cancel')"
        @blur="commit"
      />
      <span v-else class="row-label">
        {{ row.document.title }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding-right: 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  color: var(--text-color);
  cursor: default;
  user-select: none;
}

.tree-row:hover {
  background: var(--hover-color);
}

.tree-row.is-selected {
  background: var(--accent-color-soft);
  border-color: var(--accent-border-color);
}

.tree-row.is-drop-target {
  background: var(--accent-color-soft);
  border-color: var(--accent-color);
}

.twisty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  color: var(--subtle-text-color);
}

.twisty.is-hidden {
  visibility: hidden;
}

.twisty :deep(svg) {
  width: 14px;
  height: 14px;
}

.row-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.folder-icon {
  color: var(--muted-text-color);
}

.row-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-document .row-label {
  font-weight: 500;
}

.is-selected .row-label {
  color: var(--accent-color);
  font-weight: 600;
}

.rename-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 20px;
  padding: 0 4px;
  font: inherit;
  font-size: 13px;
  color: var(--text-color);
  background: var(--surface-control-strong-color);
  border: 1px solid var(--accent-color);
  border-radius: 4px;
  outline: none;
}

.pin-icon {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  color: var(--accent-color);
}

.row-count {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--subtle-text-color);
}

.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 30px;
  height: 18px;
  padding: 0 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--subtle-text-color) 14%, transparent);
  color: var(--muted-text-color);
  font-size: 10px;
  font-weight: 700;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
</style>
