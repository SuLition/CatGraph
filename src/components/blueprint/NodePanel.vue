<script setup lang="ts">
import { Dismiss20Regular, ChevronRight20Regular } from "@vicons/fluent";
import { TYPE_TOKENS, type NodeType } from "../../data/knowledge-graph";

export interface NodeRef {
  type: NodeType;
  name: string;
  via?: string;
}

export interface NodeDetailField {
  label: string;
  value: string;
  mono?: boolean;
}

export interface NodeDetail {
  type: NodeType;
  code?: string;
  name: string;
  value?: string;
  unit?: string;
  fields?: NodeDetailField[];
  upstream?: NodeRef[];
  downstream?: NodeRef[];
}

defineProps<{
  node: NodeDetail | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function tokenOf(type: NodeType) {
  return TYPE_TOKENS[type];
}
</script>

<template>
  <aside v-if="node" class="node-panel">
    <header class="panel-header">
      <div
        class="type-badge"
        :style="{
          background: `oklch(94% 0.04 ${tokenOf(node.type).hue})`,
          color: `oklch(45% 0.18 ${tokenOf(node.type).hue})`,
        }"
      >
        {{ tokenOf(node.type).initial }}
      </div>
      <div class="panel-title">
        <div class="panel-kicker">
          {{ tokenOf(node.type).label }} · {{ node.code }}
        </div>
        <h3 class="panel-name">{{ node.name }}</h3>
      </div>
      <button class="close-btn" type="button" aria-label="关闭" @click="emit('close')">
        <Dismiss20Regular class="close-icon" aria-hidden="true" />
      </button>
    </header>

    <div class="panel-body">
      <div v-for="f in node.fields" :key="f.label" class="field">
        <div class="field-label">{{ f.label }}</div>
        <div class="field-value" :class="{ mono: f.mono }">{{ f.value }}</div>
      </div>

      <div
        v-if="node.value"
        class="value-block"
        :style="{
          color: `oklch(45% 0.18 ${tokenOf(node.type).hue})`,
        }"
      >
        <span class="value-num">{{ node.value }}</span>
        <span class="value-unit">{{ node.unit }}</span>
      </div>

      <section v-if="node.upstream?.length" class="refs">
        <div class="field-label">上游 · {{ node.upstream.length }} 项</div>
        <div class="ref-list">
          <div v-for="(u, i) in node.upstream" :key="i" class="ref-row">
            <span
              class="ref-tag"
              :style="{
                background: `oklch(94% 0.04 ${tokenOf(u.type).hue})`,
                color: `oklch(55% 0.18 ${tokenOf(u.type).hue})`,
              }"
            >
              {{ tokenOf(u.type).initial }}
            </span>
            <span class="ref-name">{{ u.name }}</span>
            <span v-if="u.via" class="ref-via">{{ u.via }}</span>
            <ChevronRight20Regular class="ref-chevron up" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section v-if="node.downstream?.length" class="refs">
        <div class="field-label">下游 · {{ node.downstream.length }} 项</div>
        <div class="ref-list">
          <div v-for="(d, i) in node.downstream" :key="i" class="ref-row">
            <span
              class="ref-tag"
              :style="{
                background: `oklch(94% 0.04 ${tokenOf(d.type).hue})`,
                color: `oklch(55% 0.18 ${tokenOf(d.type).hue})`,
              }"
            >
              {{ tokenOf(d.type).initial }}
            </span>
            <span class="ref-name">{{ d.name }}</span>
            <span v-if="d.via" class="ref-via">{{ d.via }}</span>
            <ChevronRight20Regular class="ref-chevron" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.node-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 300px;
  max-height: calc(100% - 32px);
  display: flex;
  flex-direction: column;
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 12px;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 6%),
    0 12px 28px rgb(15 23 42 / 10%);
  color: #1f2933;
  z-index: 10;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgb(137 160 174 / 16%);
}

.type-badge {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
}

.panel-title {
  flex: 1;
  min-width: 0;
}

.panel-kicker {
  font-size: 10px;
  color: #8a939c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel-name {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  border-radius: 4px;
  color: #5a6670;
  cursor: pointer;
}

.close-btn:hover {
  background: #dcebf0;
}

.close-icon {
  width: 14px;
  height: 14px;
}

.panel-body {
  flex: 1;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.field-label {
  font-size: 10px;
  color: #8a939c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.field-value {
  font-size: 13px;
  line-height: 1.5;
  color: #1f2933;
}

.field-value.mono {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12.5px;
}

.value-block {
  padding: 12px;
  background: rgb(249 249 247 / 80%);
  border: 1px solid rgb(137 160 174 / 18%);
  border-radius: 8px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.value-num {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 22px;
  font-weight: 600;
}

.value-unit {
  color: #5a6670;
  font-size: 13px;
}

.refs {
  display: flex;
  flex-direction: column;
}

.ref-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ref-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgb(248 249 251 / 70%);
  border: 1px solid rgb(137 160 174 / 16%);
  border-radius: 6px;
}

.ref-tag {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.ref-name {
  flex: 1;
  font-size: 12px;
  color: #1f2933;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref-via {
  font-size: 10px;
  color: #8a939c;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.ref-chevron {
  width: 12px;
  height: 12px;
  color: #8a939c;
  flex-shrink: 0;
}

.ref-chevron.up {
  transform: rotate(180deg);
}
</style>
