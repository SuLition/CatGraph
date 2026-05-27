<script setup lang="ts">
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
import { useRouter } from "vue-router";
import { useWorkspaceStore } from "../../stores/workspace.store";
import type { NavId } from "../../types/navigation";

interface SidebarItem {
  id: NavId;
  label: string;
  icon: Component;
}

const sidebarItems: SidebarItem[] = [
  { id: "documents", label: "文档", icon: DocumentText24Regular },
  { id: "experiments", label: "试验", icon: Beaker24Regular },
  { id: "constants", label: "常量", icon: NumberSymbolSquare24Regular },
  { id: "graph", label: "图谱", icon: Flowchart24Regular },
  { id: "references", label: "文献", icon: BookInformation24Regular },
  { id: "code", label: "代码", icon: Code24Regular },
];

const router = useRouter();
const workspace = useWorkspaceStore();

function handleSelect(id: NavId) {
  workspace.setActiveNavId(id);
  void router.push({ name: id });
}
</script>

<template>
  <nav class="activity-bar" aria-label="功能导航">
    <button
      v-for="item in sidebarItems"
      :key="item.id"
      class="activity-button"
      :class="{ 'is-active': workspace.activeNavId === item.id }"
      :aria-label="item.label"
      type="button"
      @click="handleSelect(item.id)"
    >
      <component :is="item.icon" class="activity-icon" aria-hidden="true" />
    </button>

    <div class="activity-spacer"></div>

    <button
      class="activity-button"
      :class="{ 'is-active': workspace.activeNavId === 'settings' }"
      aria-label="设置"
      type="button"
      @click="handleSelect('settings')"
    >
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
  background: var(--hover-color);
}

.activity-button.is-active {
  color: var(--accent-color);
  background: rgb(137 160 174 / 12%);
}

.activity-icon {
  display: block;
  width: 18px;
  height: 18px;
  color: currentColor;
}
</style>
