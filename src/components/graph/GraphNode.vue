<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position, type NodeProps } from "@vue-flow/core";
import { TYPE_TOKENS } from "../../types/common";
import type { NodeType } from "../../types/common";
import type { GraphNodeData } from "../../types/graph";
import { useSettingsStore } from "../../stores/settings.store";

const props = defineProps<NodeProps<GraphNodeData>>();
const settingsStore = useSettingsStore();

const labelMode = computed(() => settingsStore.settings.graph.nodeLabelMode);
const titleText = computed(() => (labelMode.value === "code" ? props.id : props.data.label));
const shouldShowSub = computed(() => labelMode.value !== "code");
const shouldShowDetails = computed(() => props.data.big && labelMode.value === "full");

function nodeFill(type: NodeType) {
  return `oklch(99% 0.005 ${TYPE_TOKENS[type].hue})`;
}
function nodeStroke(type: NodeType, isSelected: boolean) {
  const l = isSelected ? 50 : 70;
  const c = isSelected ? 0.18 : 0.1;
  return `oklch(${l}% ${c} ${TYPE_TOKENS[type].hue})`;
}
function stripFill(type: NodeType) {
  return `oklch(60% 0.16 ${TYPE_TOKENS[type].hue})`;
}
function typeLabelFill(type: NodeType) {
  return `oklch(55% 0.14 ${TYPE_TOKENS[type].hue})`;
}
</script>

<template>
  <div
    class="graph-node"
    :class="{ 'is-big': props.data.big, 'is-selected': props.selected }"
    :style="{
      background: nodeFill(props.data.type),
      borderColor: nodeStroke(props.data.type, !!props.selected),
    }"
  >
    <span class="strip" :style="{ background: stripFill(props.data.type) }" />
    <span class="type-label" :style="{ color: typeLabelFill(props.data.type) }">
      {{ TYPE_TOKENS[props.data.type].label.toUpperCase() }}
    </span>
    <div class="title">{{ titleText }}</div>
    <div v-if="shouldShowSub" class="sub">{{ props.data.sub }}</div>
    <template v-if="shouldShowDetails">
      <div class="formula-label">主公式</div>
      <div class="formula">{{ props.data.formula }}</div>
      <div class="footer">{{ props.data.footer }}</div>
    </template>
    <span v-if="props.data.emphasis" class="emphasis-dot" />

    <!-- All 4 sides as both source and target so edges can specify direction -->
    <Handle id="t-src" type="source" :position="Position.Top" class="hidden-handle" />
    <Handle id="t-tgt" type="target" :position="Position.Top" class="hidden-handle" />
    <Handle id="r-src" type="source" :position="Position.Right" class="hidden-handle" />
    <Handle id="r-tgt" type="target" :position="Position.Right" class="hidden-handle" />
    <Handle id="b-src" type="source" :position="Position.Bottom" class="hidden-handle" />
    <Handle id="b-tgt" type="target" :position="Position.Bottom" class="hidden-handle" />
    <Handle id="l-src" type="source" :position="Position.Left" class="hidden-handle" />
    <Handle id="l-tgt" type="target" :position="Position.Left" class="hidden-handle" />
  </div>
</template>

<style scoped>
.graph-node {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid;
  border-radius: 6px;
  padding: 8px 12px 8px 14px;
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
}
.graph-node.is-selected {
  border-width: 1.5px;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 12%, transparent);
}
.strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  border-radius: 6px 0 0 6px;
}
.type-label {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2933;
  margin-top: 2px;
}
.is-big .title {
  font-size: 16px;
  font-weight: 700;
}
.sub {
  font-size: 11px;
  color: #5a6670;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  margin-top: 2px;
}
.is-big .sub {
  font-size: 12px;
}
.formula-label {
  margin-top: 10px;
  font-size: 10px;
  color: #8a939c;
  letter-spacing: 0.06em;
}
.formula {
  font-size: 13px;
  color: #1f2933;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  margin-top: 4px;
}
.footer {
  margin-top: 4px;
  font-size: 10px;
  color: #8a939c;
}
.emphasis-dot {
  position: absolute;
  bottom: 8px;
  right: 10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: oklch(60% 0.18 145);
}
.hidden-handle {
  opacity: 0;
  pointer-events: none;
  width: 6px;
  height: 6px;
  min-width: 6px;
  min-height: 6px;
}
</style>
