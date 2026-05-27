<script setup lang="ts">
import { computed } from "vue";
import { Layer24Regular } from "@vicons/fluent";
import { TYPE_TOKENS, type NodeType } from "../../data/knowledge-graph";

interface GraphNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  big?: boolean;
  emphasis?: boolean;
}

type EdgeStyle = "default" | "topDown" | "bottomUp";

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  style: EdgeStyle;
  dashed?: boolean;
}

const props = defineProps<{
  selected: string;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

const W = 1000;
const H = 500;

const nodes: GraphNode[] = [
  // 标准 (top row)
  {
    id: "ref-sae",
    type: "reference",
    x: 220,
    y: 36,
    w: 150,
    h: 36,
    label: "SAE J2264",
    sub: "§4.2 校准",
  },
  {
    id: "ref-gb",
    type: "reference",
    x: 400,
    y: 36,
    w: 150,
    h: 36,
    label: "GB/T 18352.6",
    sub: "附录 C",
  },
  {
    id: "ref-iso",
    type: "reference",
    x: 580,
    y: 36,
    w: 150,
    h: 36,
    label: "ISO 10521",
    sub: "Part 1",
  },
  // 常量 (left column)
  {
    id: "c-r",
    type: "constant",
    x: 30,
    y: 110,
    w: 170,
    h: 56,
    label: "r · 滚筒半径",
    sub: "0.2032 m",
  },
  {
    id: "c-fs",
    type: "constant",
    x: 30,
    y: 180,
    w: 170,
    h: 56,
    label: "fs · 采样频率",
    sub: "200 Hz",
  },
  {
    id: "c-N",
    type: "constant",
    x: 30,
    y: 250,
    w: 170,
    h: 56,
    label: "N · 编码器脉冲",
    sub: "1024 脉冲/转",
  },
  {
    id: "c-vhi",
    type: "constant",
    x: 30,
    y: 320,
    w: 170,
    h: 56,
    label: "v_hi / v_lo · 速度门限",
    sub: "55 / 15 mph",
  },
  // 设备 (left bottom)
  {
    id: "eq-drum",
    type: "equipment",
    x: 30,
    y: 410,
    w: 170,
    h: 56,
    label: "滚筒",
    sub: 'Horiba DC-48"',
  },
  // 试验主体 (center)
  {
    id: "exp",
    type: "experiment",
    x: 320,
    y: 200,
    w: 360,
    h: 130,
    label: "基础惯量测定",
    sub: "EXP-BI-001 · 5 步骤",
    big: true,
  },
  // 设备 (center bottom)
  {
    id: "eq-torque",
    type: "equipment",
    x: 320,
    y: 360,
    w: 170,
    h: 56,
    label: "扭矩传感器",
    sub: "HBM T40B · 2000 N·m",
  },
  {
    id: "eq-encoder",
    type: "equipment",
    x: 510,
    y: 360,
    w: 170,
    h: 56,
    label: "编码器",
    sub: "Heidenhain ERN1387",
  },
  // 结果 (right column)
  {
    id: "r-Ibase",
    type: "result",
    x: 800,
    y: 140,
    w: 170,
    h: 70,
    label: "I_base · 基础惯量",
    sub: "78.4 kg·m² ±0.6%",
    emphasis: true,
  },
  {
    id: "r-Idrum",
    type: "result",
    x: 800,
    y: 230,
    w: 170,
    h: 56,
    label: "I_drum · 滚筒旋转质量",
    sub: "142.6 kg",
  },
  // 下游试验 (far right)
  {
    id: "exp-nedc",
    type: "experiment",
    x: 800,
    y: 330,
    w: 170,
    h: 56,
    label: "NEDC 工况",
    sub: "使用 I_sim",
  },
  {
    id: "exp-wltc",
    type: "experiment",
    x: 800,
    y: 410,
    w: 170,
    h: 56,
    label: "WLTC 工况",
    sub: "使用 I_sim",
  },
];

const nodeIndex = Object.fromEntries(nodes.map((n) => [n.id, n]));

const edges: GraphEdge[] = [
  { from: "ref-sae", to: "exp", label: "规范", style: "topDown", dashed: true },
  { from: "ref-gb", to: "exp", style: "topDown", dashed: true },
  { from: "c-r", to: "exp", label: "r", style: "default" },
  { from: "c-fs", to: "exp", label: "fs", style: "default" },
  { from: "c-N", to: "exp", style: "default" },
  { from: "c-vhi", to: "exp", style: "default" },
  { from: "eq-drum", to: "exp", style: "default" },
  { from: "eq-torque", to: "exp", label: "T", style: "bottomUp" },
  { from: "eq-encoder", to: "exp", label: "α", style: "bottomUp" },
  { from: "exp", to: "r-Ibase", label: "I_base", style: "default" },
  { from: "exp", to: "r-Idrum", label: "I_drum", style: "default" },
  { from: "r-Ibase", to: "exp-nedc", label: "模拟惯量", style: "default" },
  { from: "r-Idrum", to: "exp-nedc", style: "default" },
  { from: "r-Ibase", to: "exp-wltc", label: "模拟惯量", style: "default" },
];

interface ComputedEdge {
  d: string;
  label?: string;
  labelX: number;
  labelY: number;
  isSelected: boolean;
  dashed: boolean;
  key: string;
}

function routeDefault(a: GraphNode, b: GraphNode) {
  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const mx = (ax + bx) / 2;
  return {
    d: `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${bx} ${by}`,
    labelX: mx,
    labelY: (ay + by) / 2,
  };
}

function routeTopDown(a: GraphNode, b: GraphNode) {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h;
  const bx = b.x + b.w / 2;
  const by = b.y;
  const my = (ay + by) / 2;
  return {
    d: `M ${ax} ${ay} L ${ax} ${my} L ${bx} ${my} L ${bx} ${by}`,
    labelX: (ax + bx) / 2,
    labelY: my,
  };
}

function routeBottomUp(a: GraphNode, b: GraphNode) {
  const ax = a.x + a.w / 2;
  const ay = a.y;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h;
  const my = (ay + by) / 2;
  return {
    d: `M ${ax} ${ay} L ${ax} ${my} L ${bx} ${my} L ${bx} ${by}`,
    labelX: (ax + bx) / 2,
    labelY: my,
  };
}

const computedEdges = computed<ComputedEdge[]>(() => {
  return edges.map((e, i) => {
    const a = nodeIndex[e.from];
    const b = nodeIndex[e.to];
    let geom;
    if (e.style === "topDown") geom = routeTopDown(a, b);
    else if (e.style === "bottomUp") geom = routeBottomUp(a, b);
    else geom = routeDefault(a, b);
    const isSelected = props.selected === e.from || props.selected === e.to;
    return {
      key: `${e.from}-${e.to}-${i}`,
      d: geom.d,
      label: e.label,
      labelX: geom.labelX,
      labelY: geom.labelY,
      isSelected,
      dashed: !!e.dashed,
    };
  });
});

const ACCENT = "#1a6b8a";
const MUTED = "#5a6670";
const BORDER_STRONG = "#b3c0c7";

function nodeFill(type: NodeType) {
  return `oklch(99% 0.005 ${TYPE_TOKENS[type].hue})`;
}

function nodeStroke(type: NodeType, isSelected: boolean) {
  const l = isSelected ? 50 : 70;
  const c = isSelected ? 0.18 : 0.1;
  return `oklch(${l}% ${c} ${TYPE_TOKENS[type].hue})`;
}

function nodeStripFill(type: NodeType) {
  return `oklch(60% 0.16 ${TYPE_TOKENS[type].hue})`;
}

function nodeTypeLabelFill(type: NodeType) {
  return `oklch(55% 0.14 ${TYPE_TOKENS[type].hue})`;
}

const legend: { type: NodeType; label: string }[] = [
  { type: "experiment", label: "试验" },
  { type: "constant", label: "常量" },
  { type: "result", label: "结果" },
  { type: "equipment", label: "设备" },
  { type: "reference", label: "标准" },
];
</script>

<template>
  <div class="bp-graph">
    <div class="canvas-corner">
      <Layer24Regular class="corner-icon" aria-hidden="true" />
      <span>知识图谱 — 局部视图 · 14 节点 · 14 关系</span>
    </div>

    <div class="lane-labels">
      <span class="lane lane-top">── 标准引用 ──</span>
      <span class="lane lane-input">│ 输入域</span>
      <span class="lane lane-main">│ 试验主体</span>
      <span class="lane lane-output">│ 产出与下游</span>
    </div>

    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet" class="graph-svg">
      <defs>
        <marker
          id="arr-bp"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9 Z" :fill="MUTED" />
        </marker>
        <marker
          id="arr-bp-sel"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9 Z" :fill="ACCENT" />
        </marker>
      </defs>

      <g v-for="edge in computedEdges" :key="edge.key">
        <path
          :d="edge.d"
          fill="none"
          :stroke="edge.isSelected ? ACCENT : BORDER_STRONG"
          :stroke-width="edge.isSelected ? 1.6 : 1"
          :stroke-dasharray="edge.dashed ? '4 3' : '0'"
          :marker-end="edge.isSelected ? 'url(#arr-bp-sel)' : 'url(#arr-bp)'"
        />
        <g v-if="edge.label">
          <rect
            :x="edge.labelX - edge.label.length * 4 - 4"
            :y="edge.labelY - 9"
            :width="edge.label.length * 8 + 8"
            height="16"
            rx="4"
            fill="#ffffff"
            :stroke="edge.isSelected ? ACCENT : 'rgba(137, 160, 174, 0.4)'"
          />
          <text
            :x="edge.labelX"
            :y="edge.labelY + 3.5"
            text-anchor="middle"
            font-family="ui-monospace, 'JetBrains Mono', monospace"
            font-size="10"
            :fill="edge.isSelected ? ACCENT : MUTED"
            :font-weight="edge.isSelected ? 600 : 500"
          >
            {{ edge.label }}
          </text>
        </g>
      </g>

      <g
        v-for="n in nodes"
        :key="n.id"
        class="graph-node"
        :data-id="n.id"
        @click="emit('select', n.id)"
      >
        <rect
          v-if="selected === n.id"
          :x="n.x - 3"
          :y="n.y - 3"
          :width="n.w + 6"
          :height="n.h + 6"
          rx="8"
          fill="none"
          :stroke="ACCENT"
          stroke-width="1"
          stroke-dasharray="3 3"
        />
        <rect
          :x="n.x"
          :y="n.y"
          :width="n.w"
          :height="n.h"
          rx="6"
          :fill="nodeFill(n.type)"
          :stroke="nodeStroke(n.type, selected === n.id)"
          :stroke-width="selected === n.id ? 1.5 : 1"
        />
        <rect :x="n.x" :y="n.y" width="5" :height="n.h" rx="6" :fill="nodeStripFill(n.type)" />
        <text
          :x="n.x + n.w - 8"
          :y="n.y + 13"
          text-anchor="end"
          font-size="9"
          font-weight="700"
          :fill="nodeTypeLabelFill(n.type)"
        >
          {{ TYPE_TOKENS[n.type].label.toUpperCase() }}
        </text>
        <text
          :x="n.x + 14"
          :y="n.y + 22"
          :font-size="n.big ? 16 : 13"
          :font-weight="n.big ? 700 : 600"
          fill="#1f2933"
        >
          {{ n.label }}
        </text>
        <text
          :x="n.x + 14"
          :y="n.y + 22 + (n.big ? 22 : 18)"
          :font-size="n.big ? 12 : 11"
          fill="#5a6670"
          font-family="ui-monospace, 'JetBrains Mono', monospace"
        >
          {{ n.sub }}
        </text>
        <circle
          v-if="n.emphasis"
          :cx="n.x + n.w - 12"
          :cy="n.y + n.h - 12"
          r="3"
          fill="oklch(60% 0.18 145)"
        />
        <template v-if="n.big">
          <text :x="n.x + 14" :y="n.y + 80" font-size="10" fill="#8a939c" letter-spacing="0.6">
            主公式
          </text>
          <text
            :x="n.x + 14"
            :y="n.y + 100"
            font-size="13"
            font-family="ui-monospace, 'JetBrains Mono', monospace"
            fill="#1f2933"
          >
            I = T / α = F·r / α
          </text>
          <text :x="n.x + 14" :y="n.y + 118" font-size="10" fill="#8a939c">
            步骤 1 ─ 2 ─ 3 ─ 4 ─ 5 · 4 加速度组 · 20 次运行
          </text>
        </template>
      </g>
    </svg>

    <div class="legend">
      <div v-for="l in legend" :key="l.type" class="legend-item">
        <span class="legend-swatch" :style="{ background: nodeStripFill(l.type) }"></span>
        {{ l.label }}
      </div>
      <span class="legend-divider"></span>
      <div class="legend-item">
        <svg width="20" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="20" y2="5" :stroke="MUTED" stroke-width="1" />
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
            :stroke="MUTED"
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
  background:
    radial-gradient(circle at 30% 20%, oklch(98% 0.01 240) 0, transparent 70%),
    linear-gradient(rgb(15 23 42 / 5%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(15 23 42 / 5%) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px,
    24px 24px;
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
}

.corner-icon {
  width: 13px;
  height: 13px;
  color: #8a939c;
}

.lane-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-size: 10px;
  color: #9aa8b1;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  z-index: 0;
}

.lane {
  position: absolute;
}

.lane-top {
  left: 30%;
  top: 4%;
}

.lane-input {
  left: 2%;
  top: 18%;
}

.lane-main {
  left: 32%;
  top: 18%;
}

.lane-output {
  left: 78%;
  top: 18%;
}

.graph-svg {
  width: 100%;
  height: 100%;
  display: block;
  position: relative;
  z-index: 1;
}

.graph-node {
  cursor: pointer;
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
