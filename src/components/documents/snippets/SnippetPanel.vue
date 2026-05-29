<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  Search20Regular,
  Tag20Regular,
  Note20Regular,
  Link20Regular,
  Dismiss20Regular,
} from "@vicons/fluent";
import { onClickOutside, useWindowSize } from "@vueuse/core";
import { useSnippetsStore } from "../../../stores/snippets.store";
import { useSnippetPanel } from "../../../composables/useSnippetPanel";
import type { SnippetRecord } from "../../../types/snippet";

const props = defineProps<{ documentId: string | null }>();
const emit = defineEmits<{
  (e: "jump", snippet: SnippetRecord): void;
}>();

const snippets = useSnippetsStore();
const { isCollapsed, toggle } = useSnippetPanel();
const { width: vw, height: vh } = useWindowSize();

const searchQuery = ref("");
const editingSnippet = ref<SnippetRecord | null>(null);
const editNote = ref("");
const editTags = ref<string[]>([]);
const newTagInput = ref("");
const isSaving = ref(false);
const anchorRect = ref<DOMRect | null>(null);
const floatCardRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const FLOAT_W = 300;
const FLOAT_GAP = 10;
const FLOAT_MARGIN = 12;
const FLOAT_MAX_H = 520;

const list = computed<SnippetRecord[]>(() =>
  props.documentId ? snippets.byDocument(props.documentId) : [],
);

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list.value;
  return list.value.filter(
    (s) =>
      s.text.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q)) ||
      s.note?.toLowerCase().includes(q),
  );
});

const floatStyle = computed(() => {
  const rect = anchorRect.value;
  if (!rect) return {};
  const right = vw.value - rect.left + FLOAT_GAP;
  const top = Math.max(FLOAT_MARGIN, Math.min(rect.top, vh.value - FLOAT_MAX_H - FLOAT_MARGIN));
  return { right: `${right}px`, top: `${top}px`, width: `${FLOAT_W}px` };
});

// 点击浮动卡片外部关闭（忽略侧边栏自身，避免切换卡片时触发 leave/enter 动画）
onClickOutside(floatCardRef, () => { closeDetail(); }, { ignore: [panelRef] });

async function openDetail(snippet: SnippetRecord, e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const alreadyOpen = !!editingSnippet.value;

  // 切换卡片前捕获当前高度，用于 FLIP 高度动画
  const prevH =
    alreadyOpen && floatCardRef.value
      ? floatCardRef.value.offsetHeight
      : null;

  anchorRect.value = rect;
  editingSnippet.value = { ...snippet };
  editNote.value = snippet.note ?? "";
  editTags.value = [...(snippet.tags ?? [])];

  // 仅切换卡片时执行高度动画（首次打开由 <Transition> 处理）
  if (!alreadyOpen || prevH === null || !floatCardRef.value) return;

  const el = floatCardRef.value;
  await nextTick(); // 等待新内容渲染完成

  // 同步测量新自然高度（在同一帧内，浏览器不会重绘，无闪烁）
  el.style.height = "auto";
  const nextH = Math.min(el.scrollHeight, FLOAT_MAX_H);
  el.style.height = `${prevH}px`; // 立即还原，锁定旧高度

  if (nextH !== prevH) {
    requestAnimationFrame(() => {
      el.style.height = `${nextH}px`; // 触发 CSS height 过渡
      el.addEventListener(
        "transitionend",
        (ev) => {
          if ((ev as TransitionEvent).propertyName === "height") {
            el.style.removeProperty("height"); // 还原为 auto
          }
        },
        { once: true },
      );
    });
  }
}

function closeDetail() {
  editingSnippet.value = null;
  newTagInput.value = "";
}

function addTag() {
  const t = newTagInput.value.trim();
  if (t && !editTags.value.includes(t)) editTags.value.push(t);
  newTagInput.value = "";
}

function removeTag(tag: string) {
  editTags.value = editTags.value.filter((t) => t !== tag);
}

async function handleSave() {
  if (!editingSnippet.value || isSaving.value) return;
  isSaving.value = true;
  try {
    await snippets.add({
      ...editingSnippet.value,
      note: editNote.value.trim() || undefined,
      tags: editTags.value.length > 0 ? editTags.value : undefined,
    });
    closeDetail();
  } finally {
    isSaving.value = false;
  }
}

async function handleDelete(id: string) {
  await snippets.remove(id);
  closeDetail();
}

function handleJump() {
  if (editingSnippet.value) emit("jump", editingSnippet.value);
}

function getPageLabel(snippet: SnippetRecord): string {
  return snippet.anchor.locator.kind === "pdf"
    ? `P. ${snippet.anchor.locator.page}`
    : "文本";
}
</script>

<template>
  <aside ref="panelRef" class="snippet-panel" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 展开状态：面板内容 -->
    <div class="panel-inner" :class="{ 'is-hidden': isCollapsed }">
      <!-- 搜索区 -->
      <div class="panel-search">
        <div class="search-row">
          <Search20Regular class="search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="搜索知识..."
          />
          <span class="search-count">
            <template v-if="searchQuery.trim()">{{ filteredList.length }}/{{ list.length }}</template>
            <template v-else>{{ list.length }} 条</template>
          </span>
        </div>
      </div>

      <!-- 卡片列表 -->
      <div class="cards">
        <p v-if="list.length === 0" class="empty">在文档中选中文字，加入知识库。</p>
        <p v-else-if="filteredList.length === 0" class="empty">未找到匹配的知识。</p>
        <article
          v-for="snippet in filteredList"
          :key="snippet.id"
          class="card"
          :class="{ 'is-active': editingSnippet?.id === snippet.id }"
          @click="openDetail(snippet, $event)"
        >
          <p class="card-text">{{ snippet.text }}</p>
          <footer class="card-meta">
            <span class="meta-page">{{ getPageLabel(snippet) }}</span>
            <span v-if="snippet.tags?.length" class="meta-item meta-tags">
              <Tag20Regular class="meta-icon" />
              <span class="meta-label">
                {{ snippet.tags.slice(0, 2).join("、") }}{{ snippet.tags.length > 2 ? "…" : "" }}
              </span>
            </span>
            <Note20Regular v-if="snippet.note" class="meta-icon note-dot" title="有备注" />
            <span class="meta-item meta-ref">
              <Link20Regular class="meta-icon" />
              <span>0</span>
            </span>
          </footer>
        </article>
      </div>
    </div>
  </aside>

  <!-- 浮动详情卡片：Teleport 到 body，覆盖在 PDF 区域上 -->
  <Teleport to="body">
    <Transition name="float">
      <div v-if="editingSnippet" ref="floatCardRef" class="float-card" :style="floatStyle">
        <!-- 头部 -->
        <header class="float-header">
          <span class="float-page">{{ getPageLabel(editingSnippet) }}</span>
          <button class="float-jump" title="定位到原文" @click="handleJump">定位</button>
          <button class="float-close" title="关闭" @click="closeDetail">
            <Dismiss20Regular class="icon" />
          </button>
        </header>

        <!-- 主体（可滚动） -->
        <div class="float-body">
          <!-- 原文 -->
          <section class="float-text-section">
            <p class="float-text">{{ editingSnippet.text }}</p>
          </section>

          <!-- 标签 -->
          <section class="float-section">
            <h3 class="section-title"><Tag20Regular class="section-icon" />标签</h3>
            <div class="tag-editor">
              <span v-for="tag in editTags" :key="tag" class="tag-chip">
                {{ tag }}
                <button class="tag-remove" @click="removeTag(tag)">×</button>
              </span>
              <input
                v-model="newTagInput"
                class="tag-input"
                placeholder="添加标签…"
                @keydown.enter.prevent="addTag"
                @keydown.188.prevent="addTag"
              />
            </div>
          </section>

          <!-- 备注 -->
          <section class="float-section">
            <h3 class="section-title"><Note20Regular class="section-icon" />备注</h3>
            <textarea v-model="editNote" class="note-textarea" placeholder="添加备注…" rows="3" />
          </section>

          <!-- 引用关系 -->
          <section class="float-section">
            <h3 class="section-title"><Link20Regular class="section-icon" />引用关系</h3>
            <p class="empty-ref">暂无引用关系</p>
          </section>
        </div>

        <!-- 底部操作 -->
        <footer class="float-footer">
          <button class="btn-danger" @click="handleDelete(editingSnippet.id)">删除</button>
          <button class="btn-primary" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? "保存中…" : "保存" }}
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 面板容器 ── */
.snippet-panel {
  position: relative;
  flex: 0 0 auto;
  width: 280px;
  min-width: 280px;
  border-left: 1px solid var(--border-color);
  background: var(--panel-background-color);
  overflow: hidden;
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.snippet-panel.is-collapsed {
  width: 0;
  min-width: 0;
  border-left: none;
}

/* ── 面板主体 ── */
.panel-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 280px;
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0.18s ease;
}

.panel-inner.is-hidden {
  opacity: 0;
  pointer-events: none;
}

/* ── 搜索区 ── */
.panel-search {
  flex: 0 0 auto;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-color);
}

.search-row {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 6px;
  border: 1px solid var(--border-control-color);
  border-radius: 6px;
  background: var(--surface-control-color);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.search-row:focus-within {
  border-color: var(--accent-border-color);
  background: var(--surface-control-strong-color);
}

.search-icon {
  flex-shrink: 0;
  width: 13px;
  height: 13px;
  color: var(--subtle-text-color);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--text-color);
  outline: none;
}

.search-input::placeholder {
  color: var(--subtle-text-color);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.search-count {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--subtle-text-color);
  white-space: nowrap;
}

/* ── 卡片列表 ── */
.cards {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty {
  font-size: 11px;
  color: var(--subtle-text-color);
  padding: 20px 8px;
  text-align: center;
  line-height: 1.6;
}

/* ── 知识卡片 ── */
.card {
  flex: 0 0 auto;
  padding: 7px 10px 6px;
  border: 1px solid var(--border-control-color);
  border-radius: 6px;
  background: var(--surface-control-color);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.card:hover,
.card.is-active {
  background: var(--hover-color);
  border-color: var(--border-strong-color);
}

.card.is-active {
  border-color: var(--accent-border-color);
}

.card-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--subtle-text-color);
  overflow: hidden;
}

.meta-page {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px;
  color: var(--muted-text-color);
  flex-shrink: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
}

.meta-tags {
  flex: 1;
  min-width: 0;
}

.meta-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-icon {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

.note-dot {
  color: var(--accent-color);
  opacity: 0.7;
}

.meta-ref {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}

/* ── 浮动详情卡片（Teleport to body） ── */
.float-card {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  max-height: 520px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--surface-popover-color);
  box-shadow:
    0 8px 24px var(--shadow-popover-color),
    0 2px 8px var(--shadow-soft-color);
  overflow: hidden;
  /* 切换卡片时的位置和高度平滑过渡 */
  transition:
    top 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    right 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 打开：弹出 + 渐现（弹性曲线） */
.float-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 关闭：渐隐 + 快速收缩 */
.float-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.4, 0, 1, 1);
}

.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translateX(8px) scale(0.94);
}

/* ── 浮动头部 ── */
.float-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-color);
}

.float-page {
  font-size: 11px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  color: var(--subtle-text-color);
}

.float-jump {
  border: 1px solid var(--border-control-color);
  border-radius: 4px;
  background: var(--surface-control-color);
  cursor: pointer;
  font-size: 11px;
  color: var(--accent-color);
  padding: 2px 8px;
}

.float-jump:hover {
  background: var(--accent-color-soft);
  border-color: var(--accent-border-color);
}

.float-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: auto;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--muted-text-color);
}

.float-close:hover {
  background: var(--hover-color);
  color: var(--text-color);
}

/* ── 浮动主体 ── */
.float-body {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.float-text-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle-color);
  background: var(--surface-soft-color);
}

.float-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
}

.float-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-text-color);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-icon {
  width: 12px;
  height: 12px;
}

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: var(--accent-color-soft);
  border: 1px solid var(--accent-border-color);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-color);
}

.tag-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--muted-text-color);
  font-size: 13px;
  line-height: 1;
  padding: 0;
}

.tag-remove:hover {
  color: var(--danger-color);
}

.tag-input {
  flex: 1;
  min-width: 80px;
  height: 22px;
  padding: 0 6px;
  border: 1px dashed var(--border-control-color);
  border-radius: 12px;
  background: transparent;
  font-size: 11px;
  color: var(--text-color);
  outline: none;
}

.tag-input:focus {
  border-color: var(--accent-border-color);
  background: var(--accent-color-softer);
}

.note-textarea {
  resize: vertical;
  padding: 6px 8px;
  border: 1px solid var(--border-control-color);
  border-radius: 6px;
  background: var(--surface-control-color);
  font-size: 12px;
  font-family: inherit;
  color: var(--text-color);
  line-height: 1.5;
  outline: none;
}

.note-textarea:focus {
  border-color: var(--accent-border-color);
  background: var(--surface-control-strong-color);
}

.empty-ref {
  margin: 0;
  font-size: 11px;
  color: var(--subtle-text-color);
  text-align: center;
  padding: 8px 0;
}

/* ── 浮动底部 ── */
.float-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
}

.btn-danger {
  padding: 4px 10px;
  border: 1px solid var(--danger-color);
  border-radius: 5px;
  background: transparent;
  color: var(--danger-color);
  font-size: 12px;
  cursor: pointer;
}

.btn-danger:hover {
  background: color-mix(in srgb, var(--danger-color) 10%, transparent);
}

.btn-primary {
  padding: 4px 14px;
  border: none;
  border-radius: 5px;
  background: var(--accent-color);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-color-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 14px;
  height: 14px;
}
</style>
