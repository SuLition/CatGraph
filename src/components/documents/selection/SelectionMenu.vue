<script setup lang="ts">
export interface SelectionMenuAction {
  id: "add-to-snippets" | "ask-ai" | "translate" | "search";
  label: string;
}

const props = defineProps<{
  position: { x: number; y: number };
  disabledActions?: SelectionMenuAction["id"][];
}>();

const emit = defineEmits<{
  (e: "action", id: SelectionMenuAction["id"]): void;
}>();

const ACTIONS: SelectionMenuAction[] = [
  { id: "add-to-snippets", label: "加入知识库" },
  { id: "ask-ai", label: "询问 AI" },
  { id: "translate", label: "翻译" },
  { id: "search", label: "搜索" },
];

function isDisabled(id: SelectionMenuAction["id"]): boolean {
  return props.disabledActions?.includes(id) ?? false;
}
</script>

<template>
  <div
    class="selection-menu"
    role="menu"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @pointerdown.stop
    @mousedown.stop
  >
    <button
      v-for="action in ACTIONS"
      :key="action.id"
      type="button"
      role="menuitem"
      class="menu-item"
      :disabled="isDisabled(action.id)"
      :title="isDisabled(action.id) ? '选区跨越多页，请缩小到一页内' : undefined"
      @click="emit('action', action.id)"
    >
      {{ action.label }}
    </button>
  </div>
</template>

<style scoped>
.selection-menu {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: stretch;
  background: rgb(30 30 30 / 95%);
  color: #fff;
  border-radius: 6px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 25%);
  overflow: hidden;
  transform: translateX(-50%);
  font-size: 12px;
}

.menu-item {
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.menu-item:hover:not(:disabled) {
  background: rgb(255 255 255 / 12%);
}

.menu-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.menu-item + .menu-item {
  border-left: 1px solid rgb(255 255 255 / 15%);
}
</style>
