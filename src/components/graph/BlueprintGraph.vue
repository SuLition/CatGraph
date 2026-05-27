<script setup lang="ts">
import { computed, markRaw, ref } from "vue";
import { VueFlow, type Node, type Edge, type NodeMouseEvent } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { Layer24Regular } from "@vicons/fluent";
import { TYPE_TOKENS, type NodeType } from "../../data/knowledge-graph";
import { useSettingsStore } from "../../stores/settings.store";
import GraphNode from "./GraphNode.vue";

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";

interface GraphNodeData {
  type: NodeType;
  label: string;
  sub: string;
  big?: boolean;
  emphasis?: boolean;
  formula?: string;
  footer?: string;
}

const props = defineProps<{ selected: string }>();
const emit = defineEmits<{ (e: "select", id: string): void }>();

const settingsStore = useSettingsStore();
const nodeTypes = { custom: markRaw(GraphNode) };

const nodes = ref<Node<GraphNodeData>[]>([
  {
    id: "ref-sae",
    type: "custom",
    position: { x: 220, y: 36 },
    width: 150,
    height: 36,
    data: { type: "reference", label: "SAE J2264", sub: "§4.2 校准" },
  },
  {
    id: "ref-gb",
    type: "custom",
    position: { x: 400, y: 36 },
    width: 150,
    height: 36,
    data: { type: "reference", label: "GB/T 18352.6", sub: "附录 C" },
  },
  {
    id: "ref-iso",
    type: "custom",
    position: { x: 580, y: 36 },
    width: 150,
    height: 36,
    data: { type: "reference", label: "ISO 10521", sub: "Part 1" },
  },
  {
    id: "c-r",
    type: "custom",
    position: { x: 30, y: 110 },
    width: 170,
    height: 56,
    data: { type: "constant", label: "r · 滚筒半径", sub: "0.2032 m" },
  },
  {
    id: "c-fs",
    type: "custom",
    position: { x: 30, y: 180 },
    width: 170,
    height: 56,
    data: { type: "constant", label: "fs · 采样频率", sub: "200 Hz" },
  },
  {
    id: "c-N",
    type: "custom",
    position: { x: 30, y: 250 },
    width: 170,
    height: 56,
    data: { type: "constant", label: "N · 编码器脉冲", sub: "1024 脉冲/转" },
  },
  {
    id: "c-vhi",
    type: "custom",
    position: { x: 30, y: 320 },
    width: 170,
    height: 56,
    data: { type: "constant", label: "v_hi / v_lo · 速度门限", sub: "55 / 15 mph" },
  },
  {
    id: "eq-drum",
    type: "custom",
    position: { x: 30, y: 410 },
    width: 170,
    height: 56,
    data: { type: "equipment", label: "滚筒", sub: 'Horiba DC-48"' },
  },
  {
    id: "exp",
    type: "custom",
    position: { x: 320, y: 200 },
    width: 360,
    height: 130,
    data: {
      type: "experiment",
      label: "基础惯量测定",
      sub: "EXP-BI-001 · 5 步骤",
      big: true,
      formula: "I = T / α = F·r / α",
      footer: "步骤 1 ─ 2 ─ 3 ─ 4 ─ 5 · 4 加速度组 · 20 次运行",
    },
  },
  {
    id: "eq-torque",
    type: "custom",
    position: { x: 320, y: 360 },
    width: 170,
    height: 56,
    data: { type: "equipment", label: "扭矩传感器", sub: "HBM T40B · 2000 N·m" },
  },
  {
    id: "eq-encoder",
    type: "custom",
    position: { x: 510, y: 360 },
    width: 170,
    height: 56,
    data: { type: "equipment", label: "编码器", sub: "Heidenhain ERN1387" },
  },
  {
    id: "r-Ibase",
    type: "custom",
    position: { x: 800, y: 140 },
    width: 170,
    height: 70,
    data: {
      type: "result",
      label: "I_base · 基础惯量",
      sub: "78.4 kg·m² ±0.6%",
      emphasis: true,
    },
  },
  {
    id: "r-Idrum",
    type: "custom",
    position: { x: 800, y: 230 },
    width: 170,
    height: 56,
    data: { type: "result", label: "I_drum · 滚筒旋转质量", sub: "142.6 kg" },
  },
  {
    id: "exp-nedc",
    type: "custom",
    position: { x: 800, y: 330 },
    width: 170,
    height: 56,
    data: { type: "experiment", label: "NEDC 工况", sub: "使用 I_sim" },
  },
  {
    id: "exp-wltc",
    type: "custom",
    position: { x: 800, y: 410 },
    width: 170,
    height: 56,
    data: { type: "experiment", label: "WLTC 工况", sub: "使用 I_sim" },
  },
]);

const BORDER_STRONG = "#b3c0c7";

function edgeStyle(from: string, to: string, dashed = false) {
  const isSel = props.selected === from || props.selected === to;
  return {
    stroke: isSel ? settingsStore.settings.appearance.accentColor : BORDER_STRONG,
    strokeWidth: isSel ? 1.6 : 1,
    strokeDasharray: dashed ? "4 3" : undefined,
  };
}

function labelStyle(from: string, to: string) {
  const isSel = props.selected === from || props.selected === to;
  return {
    fill: isSel ? settingsStore.settings.appearance.accentColor : "#5a6670",
    fontWeight: isSel ? 600 : 500,
    fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
    fontSize: 10,
  };
}
function labelBg(from: string, to: string) {
  const isSel = props.selected === from || props.selected === to;
  return {
    fill: "#ffffff",
    stroke: isSel ? settingsStore.settings.appearance.accentColor : "rgba(137, 160, 174, 0.4)",
  };
}

interface EdgeSpec {
  id: string;
  from: string;
  to: string;
  label?: string;
  dir: "lr" | "td" | "bu";
  dashed?: boolean;
}

const edgeSpecs: EdgeSpec[] = [
  { id: "e1", from: "ref-sae", to: "exp", label: "规范", dir: "td", dashed: true },
  { id: "e2", from: "ref-gb", to: "exp", dir: "td", dashed: true },
  { id: "e3", from: "c-r", to: "exp", label: "r", dir: "lr" },
  { id: "e4", from: "c-fs", to: "exp", label: "fs", dir: "lr" },
  { id: "e5", from: "c-N", to: "exp", dir: "lr" },
  { id: "e6", from: "c-vhi", to: "exp", dir: "lr" },
  { id: "e7", from: "eq-drum", to: "exp", dir: "lr" },
  { id: "e8", from: "eq-torque", to: "exp", label: "T", dir: "bu" },
  { id: "e9", from: "eq-encoder", to: "exp", label: "α", dir: "bu" },
  { id: "e10", from: "exp", to: "r-Ibase", label: "I_base", dir: "lr" },
  { id: "e11", from: "exp", to: "r-Idrum", label: "I_drum", dir: "lr" },
  { id: "e12", from: "r-Ibase", to: "exp-nedc", label: "模拟惯量", dir: "lr" },
  { id: "e13", from: "r-Idrum", to: "exp-nedc", dir: "lr" },
  { id: "e14", from: "r-Ibase", to: "exp-wltc", label: "模拟惯量", dir: "lr" },
];

const HANDLE_MAP = {
  lr: { source: "r-src", target: "l-tgt" },
  td: { source: "b-src", target: "t-tgt" },
  bu: { source: "t-src", target: "b-tgt" },
} as const;

const edges = computed<Edge[]>(() =>
  edgeSpecs.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    sourceHandle: HANDLE_MAP[e.dir].source,
    targetHandle: HANDLE_MAP[e.dir].target,
    type: "smoothstep",
    label: e.label,
    style: edgeStyle(e.from, e.to, e.dashed),
    labelStyle: labelStyle(e.from, e.to),
    labelBgStyle: labelBg(e.from, e.to),
    labelShowBg: !!e.label,
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    markerEnd: "arrowclosed",
    animated:
      settingsStore.settings.graph.edgeAnimation &&
      (props.selected === e.from || props.selected === e.to),
  })),
);

function onNodeClick({ node }: NodeMouseEvent) {
  emit("select", node.id);
}

const legend: { type: NodeType; label: string }[] = [
  { type: "experiment", label: "试验" },
  { type: "constant", label: "常量" },
  { type: "result", label: "结果" },
  { type: "equipment", label: "设备" },
  { type: "reference", label: "标准" },
];

function legendSwatch(type: NodeType) {
  return `oklch(60% 0.16 ${TYPE_TOKENS[type].hue})`;
}
</script>

<template>
  <div class="bp-graph">
    <div class="canvas-corner">
      <Layer24Regular class="corner-icon" aria-hidden="true" />
      <span>知识图谱 — 局部视图 · 14 节点 · 14 关系</span>
    </div>

    <VueFlow
      v-model:nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :fit-view-on-init="true"
      :min-zoom="0.3"
      :max-zoom="2"
      :default-edge-options="{ type: 'smoothstep' }"
      :nodes-connectable="false"
      :edges-updatable="false"
      :select-nodes-on-drag="false"
      class="flow"
      @node-click="onNodeClick"
    >
      <Background
        v-if="settingsStore.settings.graph.showGrid"
        pattern-color="rgba(15, 23, 42, 0.08)"
        :gap="24"
      />
      <Controls
        v-if="settingsStore.settings.graph.showMinimap"
        position="bottom-right"
        :show-interactive="false"
      />
    </VueFlow>

    <div class="legend">
      <div v-for="l in legend" :key="l.type" class="legend-item">
        <span class="legend-swatch" :style="{ background: legendSwatch(l.type) }"></span>
        {{ l.label }}
      </div>
      <span class="legend-divider"></span>
      <div class="legend-item">
        <svg width="20" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="20" y2="5" stroke="#5a6670" stroke-width="1" />
        </svg>
        引用
      </div>
      <div class="legend-item">
        <svg width="20" height="10" aria-hidden="true">
          <line
            x1="0"
            y1="5"
            x2="20"
            y2="5"
            stroke="#5a6670"
            stroke-width="1"
            stroke-dasharray="3 2"
          />
        </svg>
        规范
      </div>
    </div>
  </div>
</template>

<style scoped>
.bp-graph {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #fafbfc;
}

.canvas-corner {
  position: absolute;
  top: 12px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #8a939c;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  z-index: 2;
  pointer-events: none;
}

.corner-icon {
  width: 13px;
  height: 13px;
  color: #8a939c;
}

.flow {
  width: 100%;
  height: 100%;
}

.legend {
  position: absolute;
  left: 16px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 14px;
  background: rgb(255 255 255 / 80%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 6px;
  font-size: 11px;
  color: #5a6670;
  z-index: 2;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-divider {
  width: 1px;
  align-self: stretch;
  background: rgb(137 160 174 / 22%);
}
</style>

<style>
.vue-flow__node-custom {
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}
</style>
