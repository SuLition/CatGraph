<script setup lang="ts">
import { ref } from "vue";
import { Dismiss12Regular } from "@vicons/fluent";
import ContextMenu from "./folders/ContextMenu.vue";
import type { ContextMenuItem } from "./folders/context-menu";

interface TabItem {
  id: string;
  title: string;
  kind: string;
}

defineProps<{ tabs: TabItem[]; activeId: string | null }>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "close", id: string): void;
  (e: "close-others", id: string): void;
  (e: "close-all"): void;
}>();

const MENU_ITEMS: ContextMenuItem[] = [
  { key: "close", label: "关闭" },
  { key: "close-others", label: "关闭其他" },
  { key: "close-all", label: "关闭全部", separatorBefore: true },
];

const menu = ref<{ open: boolean; x: number; y: number; targetId: string | null }>({
  open: false,
  x: 0,
  y: 0,
  targetId: null,
});

function openMenu(id: string, event: MouseEvent) {
  menu.value = {
    open: true,
    x: Math.min(event.clientX, window.innerWidth - 184),
    y: Math.min(event.clientY, window.innerHeight - 140),
    targetId: id,
  };
}

function onMenuSelect(key: string) {
  const id = menu.value.targetId;
  if (!id) return;
  if (key === "close") emit("close", id);
  else if (key === "close-others") emit("close-others", id);
  else if (key === "close-all") emit("close-all");
}

// 中键关闭标签,贴合浏览器/编辑器习惯。
function onAuxClick(id: string, event: MouseEvent) {
  if (event.button !== 1) return;
  event.preventDefault();
  emit("close", id);
}

// 标签过多时,把竖向滚轮转为横向滚动整条标签栏。
function onWheel(event: WheelEvent) {
  const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
  if (delta === 0) return;
  (event.currentTarget as HTMLElement).scrollLeft += delta;
}
</script>

<template>
  <div class="tabs-bar">
    <div class="tabs-strip" role="tablist" @wheel.prevent="onWheel">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ 'is-active': tab.id === activeId }"
        role="tab"
        :aria-selected="tab.id === activeId"
        :title="tab.title"
        @click="emit('select', tab.id)"
        @auxclick="onAuxClick(tab.id, $event)"
        @contextmenu.prevent="openMenu(tab.id, $event)"
      >
        <span class="tab-badge">{{ tab.kind.toUpperCase() }}</span>
        <!-- 整条 .tab 负责切换;标题保留为 button,让键盘激活冒泡到容器,保持可聚焦。 -->
        <button type="button" class="tab-label">
          {{ tab.title }}
        </button>
        <button
          type="button"
          class="tab-close"
          :aria-label="`关闭 ${tab.title}`"
          @click.stop="emit('close', tab.id)"
        >
          <Dismiss12Regular aria-hidden="true" />
        </button>
      </div>
    </div>

    <ContextMenu
      :open="menu.open"
      :x="menu.x"
      :y="menu.y"
      :items="MENU_ITEMS"
      @select="onMenuSelect"
      @close="menu.open = false"
    />
  </div>
</template>

<style scoped>
.tabs-bar {
  flex: 0 0 auto;
  min-width: 0;
  background: var(--panel-background-color);
  border-bottom: 1px solid var(--border-color);
}

.tabs-strip {
  display: flex;
  align-items: stretch;
  height: 36px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.tabs-strip::-webkit-scrollbar {
  display: none;
}

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  max-width: 200px;
  height: 100%;
  padding: 0 6px 0 10px;
  border-right: 1px solid var(--border-color);
  color: var(--muted-text-color);
  background: transparent;
  cursor: pointer;
  user-select: none;
}

.tab:hover {
  background: var(--hover-color);
}

.tab.is-active {
  background: var(--content-background-color);
  color: var(--text-color);
}

/* 顶部强调线,标识当前激活标签(与下方阅读区底色相连)。 */
.tab.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-color);
}

.tab-badge {
  flex: 0 0 auto;
  font-size: 9px;
  font-weight: 700;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  color: var(--subtle-text-color);
  letter-spacing: 0.02em;
}

.tab-label {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}

.tab-close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--subtle-text-color);
  cursor: pointer;
  opacity: 0;
}

.tab:hover .tab-close,
.tab.is-active .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: var(--active-item-background-color);
  color: var(--text-color);
}

.tab-close :deep(svg) {
  width: 12px;
  height: 12px;
}
</style>
