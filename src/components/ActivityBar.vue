<script lang="ts">
import {
  Beaker24Regular,
  BookInformation24Regular,
  Code24Regular,
  DocumentText24Regular,
  Flowchart24Regular,
  NumberSymbolSquare24Regular,
  Settings24Regular,
} from "@vicons/fluent";
import type { Component } from "vue";

export interface SidebarItem {
  id: string;
  label: string;
  icon: Component;
}

export const sidebarItems: SidebarItem[] = [
  { id: "documents", label: "文档", icon: DocumentText24Regular },
  { id: "experiments", label: "试验", icon: Beaker24Regular },
  { id: "constants", label: "常量", icon: NumberSymbolSquare24Regular },
  { id: "graph", label: "图谱", icon: Flowchart24Regular },
  { id: "references", label: "文献", icon: BookInformation24Regular },
  { id: "code", label: "代码", icon: Code24Regular },
];
</script>

<script setup lang="ts">
defineProps<{
  activeId: string;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

function handleSelect(id: string) {
  emit("select", id);
}
</script>

<template>
  <nav class="activity-bar" aria-label="功能导航">
    <button
      v-for="item in sidebarItems"
      :key="item.id"
      class="activity-button"
      :class="{ 'is-active': activeId === item.id }"
      :aria-label="item.label"
      type="button"
      @click="handleSelect(item.id)"
    >
      <component :is="item.icon" class="activity-icon" aria-hidden="true" />
    </button>

    <div class="activity-spacer"></div>

    <button class="activity-button" aria-label="设置" type="button">
      <Settings24Regular class="activity-icon" aria-hidden="true" />
    </button>
  </nav>
</template>

<style scoped>
.activity-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 6px;
  padding-bottom: 6px;
  border-right: 1px solid rgb(137 160 174 / 18%);
}

.activity-spacer {
  flex: 1 1 auto;
  min-height: 8px;
}

.activity-button {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 6px;
  color: #5a6670;
  background: transparent;
  cursor: pointer;
}

.activity-button:hover {
  background: #dcebf0;
}

.activity-button.is-active {
  color: #1a6b8a;
  background: rgb(137 160 174 / 12%);
}

.activity-icon {
  display: block;
  width: 18px;
  height: 18px;
  color: currentColor;
}
</style>
