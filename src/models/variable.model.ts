import type { InputVariable, OutputVariable, EquipmentNode, ReferenceNode } from "../types/variable";
import type { GraphNodeData } from "../types/graph";
import type { NodeDetail, NodeRef } from "../types/graph";

// ─── 工厂函数 ────────────────────────────────────────────────
export interface CreateInputVariableInput {
  id: string;
  sym: string;
  name: string;
  value: string;
  unit: string;
  usedBy?: number;
}

export function createInputVariable(input: CreateInputVariableInput): InputVariable {
  return {
    id: input.id,
    sym: input.sym,
    name: input.name,
    value: input.value,
    unit: input.unit,
    usedBy: input.usedBy ?? 0,
  };
}

export interface CreateOutputVariableInput {
  id: string;
  sym: string;
  name: string;
  value: string;
  unit: string;
  fromExperimentId: string;
  downstream?: OutputVariable["downstream"];
}

export function createOutputVariable(input: CreateOutputVariableInput): OutputVariable {
  return {
    id: input.id,
    sym: input.sym,
    name: input.name,
    value: input.value,
    unit: input.unit,
    fromExperimentId: input.fromExperimentId,
    downstream: input.downstream ?? [],
  };
}

// ─── 转换为图谱节点 ─────────────────────────────────────────
export function constantToGraphNode(c: InputVariable): GraphNodeData {
  return {
    type: "constant",
    label: `${c.sym} · ${c.name}`,
    sub: `${c.value} ${c.unit}`,
  };
}

export function resultToGraphNode(r: OutputVariable, opts?: { emphasis?: boolean }): GraphNodeData {
  return {
    type: "result",
    label: `${r.sym} · ${r.name}`,
    sub: `${r.value} ${r.unit}`,
    emphasis: opts?.emphasis ?? false,
  };
}

export function equipmentToGraphNode(e: EquipmentNode): GraphNodeData {
  return {
    type: "equipment",
    label: e.name,
    sub: `${e.vendor} ${e.model}`,
  };
}

export function referenceToGraphNode(r: ReferenceNode): GraphNodeData {
  return {
    type: "reference",
    label: r.name,
    sub: `${r.section} ${r.title}`,
  };
}

// ─── 转换为详情面板数据 ─────────────────────────────────────
export function constantToNodeDetail(
  c: InputVariable,
  downstreamNodes: NodeRef[] = [],
): NodeDetail {
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
    downstream: downstreamNodes,
  };
}

export function resultToNodeDetail(
  r: OutputVariable,
  upstreamNodes: NodeRef[] = [],
): NodeDetail {
  return {
    type: "result",
    code: r.id,
    name: r.name,
    value: r.value,
    unit: r.unit,
    fields: [
      { label: "符号", value: r.sym, mono: true },
      { label: "来源试验", value: r.fromExperimentId },
    ],
    upstream: upstreamNodes,
    downstream: r.downstream.map((d) => ({
      type: "experiment" as const,
      name: d.name,
      via: d.via,
    })),
  };
}

export function equipmentToNodeDetail(
  e: EquipmentNode,
  downstreamNodes: NodeRef[] = [],
): NodeDetail {
  return {
    type: "equipment",
    code: e.id,
    name: e.name,
    fields: [
      { label: "型号", value: e.model, mono: true },
      { label: "厂商", value: e.vendor },
    ],
    downstream: downstreamNodes,
  };
}

export function referenceToNodeDetail(
  r: ReferenceNode,
  downstreamNodes: NodeRef[] = [],
): NodeDetail {
  return {
    type: "reference",
    code: r.id,
    name: r.name,
    fields: [
      { label: "章节", value: r.section, mono: true },
      { label: "标题", value: r.title },
    ],
    downstream: downstreamNodes,
  };
}
