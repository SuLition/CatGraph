<script setup lang="ts">
import { computed } from "vue";
import { Search20Regular, ChevronDown20Regular } from "@vicons/fluent";
import {
  isSideListNavId,
  SIDE_LISTS,
  type SideListItem,
  type SideListVariant,
} from "../../data/nav-side-lists";
import type { NavId } from "../../types/navigation";

const props = defineProps<{
  navId: NavId;
  selectedId: string;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

const config = computed(() => {
  if (isSideListNavId(props.navId)) {
    return SIDE_LISTS[props.navId];
  }

  return SIDE_LISTS.experiments;
});

const totalCount = computed(() =>
  config.value.groups.reduce((sum, group) => sum + group.items.length, 0),
);

function toneClass(item: SideListItem) {
  return `tone-${item.tone ?? "muted"}`;
}

function variantClass(variant: SideListVariant) {
  return `variant-${variant}`;
}

function handleSelect(id: string) {
  emit("select", id);
}
</script>

<template>
  <aside class="side-list" :class="variantClass(config.variant)">
    <header class="side-list-header">
      <div class="header-row">
        <h2 class="side-list-title">{{ config.title }}</h2>
        <span class="side-list-count">{{ totalCount }} 项</span>
      </div>
      <div class="search-box">
        <Search20Regular class="search-icon" aria-hidden="true" />
        <span class="search-placeholder">{{ config.searchPlaceholder }}</span>
        <kbd class="search-kbd">⌘K</kbd>
      </div>
    </header>

    <div class="groups">
      <section v-for="group in config.groups" :key="group.title" class="group">
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
            :class="[{ 'is-active': selectedId === item.id }, toneClass(item)]"
            @click="handleSelect(item.id)"
          >
            <template v-if="config.variant === 'experiment'">
              <div class="item-row">
                <span class="item-dot"></span>
                <span class="item-label">{{ item.label }}</span>
              </div>
              <div class="item-meta">
                <span class="item-code">{{ item.code }}</span>
                <span v-if="item.status" class="item-status">· {{ item.status }}</span>
              </div>
            </template>

            <template v-else-if="config.variant === 'variable'">
              <div class="variable-row">
                <span class="symbol-chip">{{ item.code }}</span>
                <div class="variable-copy">
                  <span class="item-label">{{ item.label }}</span>
                  <span class="item-meta">{{ item.meta }}</span>
                </div>
              </div>
              <div class="value-row">
                <span class="value-text">{{ item.value }}</span>
                <span class="unit-text">{{ item.unit }}</span>
              </div>
            </template>

            <template v-else-if="config.variant === 'document'">
              <div class="document-row">
                <span class="type-badge">{{ item.badge }}</span>
                <span class="item-label">{{ item.label }}</span>
              </div>
              <div class="item-meta">
                <span class="item-code">{{ item.code }}</span>
                <span>· {{ item.meta }}</span>
              </div>
            </template>

            <template v-else-if="config.variant === 'graph'">
              <div class="graph-row">
                <div>
                  <span class="item-label">{{ item.label }}</span>
                  <span class="item-code block-code">{{ item.code }}</span>
                </div>
                <div class="graph-stat">
                  <span class="value-text">{{ item.value }}</span>
                  <span class="unit-text">{{ item.unit }}</span>
                </div>
              </div>
              <p class="item-desc">{{ item.description }}</p>
            </template>

            <template v-else-if="config.variant === 'reference'">
              <div class="reference-row">
                <span class="item-label">{{ item.label }}</span>
                <span class="section-chip">{{ item.code }}</span>
              </div>
              <p class="item-desc">{{ item.description }}</p>
              <div class="item-meta">{{ item.meta }}</div>
            </template>

            <template v-else>
              <div class="code-row">
                <span class="language-chip">{{ item.code }}</span>
                <span class="code-path">{{ item.label }}</span>
              </div>
              <p class="item-desc mono-desc">{{ item.description }}</p>
              <div class="item-meta">{{ item.meta }}</div>
            </template>
          </li>
        </ul>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.side-list {
  width: var(--side-list-width, 240px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  font-size: 13px;
  color: var(--muted-text-color);
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

.side-list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  letter-spacing: 0;
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
  background: rgb(255 255 255 / 50%);
  border: 1px solid rgb(137 160 174 / 22%);
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
  border: 1px solid rgb(137 160 174 / 26%);
  border-radius: 3px;
  color: var(--subtle-text-color);
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
  color: var(--muted-text-color);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.group-chevron {
  width: 12px;
  height: 12px;
  color: var(--subtle-text-color);
}

.group-title {
  flex: 0 1 auto;
}

.group-count {
  color: var(--subtle-text-color);
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
  background: var(--hover-color);
}

.list-item.is-active {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent-color) 22%, transparent);
}

.item-row,
.document-row,
.reference-row,
.code-row,
.graph-row,
.variable-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.graph-row {
  align-items: flex-start;
  justify-content: space-between;
}

.item-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  background: var(--tone-color, #9aa8b1);
}

.item-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item.is-active .item-label {
  color: var(--accent-color);
  font-weight: 600;
}

.item-meta {
  margin-top: 2px;
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: var(--subtle-text-color);
}

.variant-experiment .item-meta {
  padding-left: 12px;
}

.item-code,
.symbol-chip,
.code-path,
.block-code,
.language-chip,
.section-chip {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.symbol-chip,
.type-badge,
.language-chip,
.section-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 30px;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--tone-color, #9aa8b1) 14%, transparent);
  color: var(--tone-color, #5a6670);
  font-size: 10px;
  font-weight: 700;
}

.variable-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 5px;
  padding-left: 36px;
}

.value-text {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 700;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.unit-text {
  color: var(--subtle-text-color);
  font-size: 10px;
}

.graph-stat {
  display: grid;
  justify-items: end;
  gap: 1px;
  flex: 0 0 auto;
}

.block-code {
  display: block;
  margin-top: 2px;
  color: var(--subtle-text-color);
  font-size: 10px;
}

.item-desc {
  margin: 4px 0 0;
  color: var(--subtle-text-color);
  font-size: 11px;
  line-height: 1.35;
}

.code-path {
  color: var(--text-color);
  font-size: 12px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono-desc {
  color: var(--muted-text-color);
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.tone-success {
  --tone-color: #10b981;
}

.tone-warning {
  --tone-color: #f59e0b;
}

.tone-info {
  --tone-color: #1a6b8a;
}

.tone-danger {
  --tone-color: #d44747;
}

.tone-muted {
  --tone-color: #9aa8b1;
}
</style>
