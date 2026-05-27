<script setup lang="ts">
import { Search20Regular, ChevronDown20Regular } from "@vicons/fluent";
import { EXPERIMENT_GROUPS, type ExperimentListItem } from "../data/knowledge-graph";

defineProps<{
  selectedId: string;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

function statusColor(status?: ExperimentListItem["status"]) {
  switch (status) {
    case "已完成":
      return "#10b981";
    case "进行中":
      return "#f59e0b";
    case "待开始":
      return "#9aa8b1";
    default:
      return "#9aa8b1";
  }
}

const totalCount = EXPERIMENT_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
</script>

<template>
  <aside class="side-list">
    <header class="side-list-header">
      <div class="header-row">
        <h2 class="side-list-title">试验</h2>
        <span class="side-list-count">{{ totalCount }} 项</span>
      </div>
      <div class="search-box">
        <Search20Regular class="search-icon" aria-hidden="true" />
        <span class="search-placeholder">搜索试验、常量、文献…</span>
        <kbd class="search-kbd">⌘K</kbd>
      </div>
    </header>

    <div class="groups">
      <section v-for="group in EXPERIMENT_GROUPS" :key="group.title" class="group">
        <div class="group-header">
          <ChevronDown20Regular class="group-chevron" aria-hidden="true" />
          <span class="group-title">{{ group.title }}</span>
          <span class="group-count">{{ group.items.length }}</span>
        </div>
        <ul class="group-items">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="list-item"
            :class="{ 'is-active': selectedId === item.id }"
            @click="emit('select', item.id)"
          >
            <div class="item-row">
              <span
                class="item-dot"
                :style="{
                  background:
                    selectedId === item.id ? '#1a6b8a' : statusColor(item.status),
                }"
              ></span>
              <span class="item-label">{{ item.label }}</span>
            </div>
            <div class="item-meta">
              <span class="item-code">{{ item.code }}</span>
              <span v-if="item.status" class="item-status">· {{ item.status }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.side-list {
  width: 240px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  font-size: 13px;
  color: #3d4f58;
}

.side-list-header {
  flex: 0 0 auto;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgb(137 160 174 / 14%);
}

.header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.side-list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2933;
  letter-spacing: 0;
}

.side-list-count {
  font-size: 11px;
  color: #8a939c;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  height: 28px;
  padding: 0 8px;
  background: rgb(255 255 255 / 50%);
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 6px;
  color: #8a939c;
}

.search-icon {
  width: 14px;
  height: 14px;
  color: #8a939c;
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
  border: 1px solid rgb(137 160 174 / 26%);
  border-radius: 3px;
  color: #8a939c;
}

.groups {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 6px 6px 10px;
}

.group {
  margin-bottom: 6px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  color: #5a6670;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.group-chevron {
  width: 12px;
  height: 12px;
  color: #8a939c;
}

.group-title {
  flex: 0 1 auto;
}

.group-count {
  color: #8a939c;
  font-weight: 400;
}

.group-items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.list-item {
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: default;
}

.list-item:hover {
  background: #dcebf0;
}

.list-item.is-active {
  background: rgb(26 107 138 / 10%);
  border-color: rgb(26 107 138 / 22%);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.item-label {
  font-size: 13px;
  font-weight: 500;
  color: #1f2933;
}

.list-item.is-active .item-label {
  color: #1a6b8a;
  font-weight: 600;
}

.item-meta {
  margin-top: 2px;
  padding-left: 12px;
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: #8a939c;
}

.item-code {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
</style>
