<script setup lang="ts">
import { computed, ref } from "vue";
import BPHeader from "./BPHeader.vue";
import BlueprintGraph from "./BlueprintGraph.vue";
import StepRail from "./StepRail.vue";
import NodePanel, { type NodeDetail } from "./NodePanel.vue";
import {
  CONSTANTS,
  EQUIPMENT,
  EXPERIMENT,
  REFERENCES,
  RESULTS,
} from "../../data/knowledge-graph";

const selected = ref<string>("exp");
const showPanel = ref(true);

function onSelect(id: string) {
  selected.value = id;
  showPanel.value = true;
}

function closePanel() {
  showPanel.value = false;
}

const detail = computed<NodeDetail | null>(() => {
  const id = selected.value;

  if (id === "exp") {
    return {
      type: "experiment",
      code: EXPERIMENT.code,
      name: EXPERIMENT.name,
      value: EXPERIMENT.finalResult.value,
      unit: EXPERIMENT.finalResult.unit,
      fields: [
        { label: "描述", value: EXPERIMENT.description },
        { label: "主公式", value: EXPERIMENT.formula, mono: true },
        { label: "依据标准", value: `${EXPERIMENT.standard} ${EXPERIMENT.section}` },
        { label: "状态", value: EXPERIMENT.status },
      ],
      upstream: [
        { type: "constant", name: "滚筒半径 r = 0.2032 m" },
        { type: "constant", name: "采样频率 fs = 200 Hz" },
        { type: "equipment", name: "HBM T40B 扭矩传感器" },
        { type: "reference", name: "SAE J2264 §4.2" },
      ],
      downstream: [
        { type: "experiment", name: "NEDC 工况", via: "I_sim" },
        { type: "experiment", name: "WLTC 工况", via: "I_sim" },
        { type: "experiment", name: "滑行系数测定", via: "补偿" },
      ],
    };
  }

  if (id.startsWith("c-")) {
    const c = CONSTANTS.find((x) => x.id === id);
    if (!c) return null;
    return {
      type: "constant",
      code: c.id,
      name: c.name,
      value: c.value,
      unit: c.unit,
      fields: [
        { label: "符号", value: c.sym, mono: true },
        { label: "引用次数", value: `${c.usedBy} 次` },
      ],
      downstream: [{ type: "experiment", name: "基础惯量测定", via: "步骤 1, 2" }],
    };
  }

  if (id.startsWith("r-")) {
    const r = RESULTS.find((x) => x.id === id);
    if (!r) return null;
    return {
      type: "result",
      code: r.id,
      name: r.name,
      value: r.value,
      unit: r.unit,
      fields: [
        { label: "符号", value: r.sym, mono: true },
        { label: "来源试验", value: "基础惯量测定 EXP-BI-001" },
      ],
      upstream: [{ type: "experiment", name: "基础惯量测定" }],
      downstream: r.downstream.map((d) => ({ type: "experiment", name: d.name, via: d.via })),
    };
  }

  if (id.startsWith("eq-")) {
    const e = EQUIPMENT.find((x) => x.id === id);
    if (!e) return null;
    return {
      type: "equipment",
      code: e.id,
      name: e.name,
      fields: [
        { label: "型号", value: e.model, mono: true },
        { label: "厂商", value: e.vendor },
      ],
      downstream: [{ type: "experiment", name: "基础惯量测定" }],
    };
  }

  if (id.startsWith("ref-")) {
    const r = REFERENCES.find((x) => x.id === id);
    if (!r) return null;
    return {
      type: "reference",
      code: r.id,
      name: r.name,
      fields: [
        { label: "章节", value: r.section, mono: true },
        { label: "标题", value: r.title },
      ],
      downstream: [{ type: "experiment", name: "基础惯量测定", via: "依据" }],
    };
  }

  if (id.startsWith("exp-")) {
    // Downstream experiment nodes (NEDC / WLTC etc.)
    const labelMap: Record<string, string> = {
      "exp-nedc": "NEDC 工况",
      "exp-wltc": "WLTC 工况",
      "exp-coastdown": "滑行系数测定",
    };
    return {
      type: "experiment",
      code: id.toUpperCase(),
      name: labelMap[id] ?? id,
      fields: [
        { label: "类型", value: "工况实验" },
        { label: "依赖", value: "I_base, I_drum", mono: true },
      ],
      upstream: [
        { type: "result", name: "I_base · 基础惯量" },
        { type: "result", name: "I_drum · 滚筒旋转质量" },
      ],
    };
  }

  return null;
});
</script>

<template>
  <div class="blueprint-canvas">
    <BPHeader :experiment="EXPERIMENT" />

    <div class="graph-area">
      <BlueprintGraph :selected="selected" @select="onSelect" />
      <NodePanel v-if="showPanel" :node="detail" @close="closePanel" />
    </div>

    <StepRail :experiment="EXPERIMENT" />
  </div>
</template>

<style scoped>
.blueprint-canvas {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.graph-area {
  flex: 1;
  min-height: 0;
  position: relative;
}
</style>
