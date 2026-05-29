<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import type { ContextMenuItem } from "./context-menu";

const props = defineProps<{
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}>();

const emit = defineEmits<{
  (e: "select", key: string): void;
  (e: "close"): void;
}>();

function close() {
  emit("close");
}

function onSelect(item: ContextMenuItem) {
  if (item.disabled) return;
  emit("select", item.key);
  close();
}

function onGlobalPointer(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest(".context-menu")) return;
  close();
}

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") close();
}

function addListeners() {
  window.addEventListener("pointerdown", onGlobalPointer, true);
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", close);
  window.addEventListener("blur", close);
}

function removeListeners() {
  window.removeEventListener("pointerdown", onGlobalPointer, true);
  window.removeEventListener("keydown", onKey, true);
  window.removeEventListener("resize", close);
  window.removeEventListener("blur", close);
}

watch(
  () => props.open,
  (open) => (open ? addListeners() : removeListeners()),
);

onBeforeUnmount(removeListeners);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="context-menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
      role="menu"
      @contextmenu.prevent
    >
      <template v-for="item in items" :key="item.key">
        <div v-if="item.separatorBefore" class="context-menu-separator" aria-hidden="true"></div>
        <button
          type="button"
          class="context-menu-item"
          :class="{ 'is-danger': item.danger, 'is-disabled': item.disabled }"
          :disabled="item.disabled"
          role="menuitem"
          @click="onSelect(item)"
        >
          {{ item.label }}
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 168px;
  padding: 4px;
  background: var(--surface-popover-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--shadow-popover-color);
  display: flex;
  flex-direction: column;
  gap: 1px;
  backdrop-filter: blur(8px);
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-color);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.context-menu-item:hover:not(.is-disabled) {
  background: var(--hover-color);
}

.context-menu-item.is-danger {
  color: var(--danger-color);
}

.context-menu-item.is-disabled {
  color: var(--subtle-text-color);
  cursor: default;
}

.context-menu-separator {
  height: 1px;
  margin: 3px 6px;
  background: var(--border-subtle-color);
}
</style>
