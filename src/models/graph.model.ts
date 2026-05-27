import type { ExperimentRef } from "../types/common";
import type { Experiment } from "../types/experiment";
import type { InputVariable, OutputVariable, EquipmentNode, ReferenceNode } from "../types/variable";
import type { NodeDetail, NodeRef } from "../types/graph";

// ─── 图谱数据容器 ───────────────────────────────────────────
export interface GraphData {
  experiments: Experiment[];
  inputVariables: InputVariable[];
  outputVariables: OutputVariable[];
  equipment: EquipmentNode[];
  references: ReferenceNode[];
}

// ─── 上游/下游查询 ──────────────────────────────────────────

/** 根据实验 ID 查找输入变量（上游常量） */
export function findUpstreamVariables(
  exp: Experiment,
  inputVariables: InputVariable[],
): InputVariable[] {
  if (!exp.inputVariableIds) return [];
  return exp.inputVariableIds
    .map((id) => inputVariables.find((v) => v.id === id))
    .filter((v): v is InputVariable => v !== undefined);
}

/** 根据实验 ID 查找输出变量（下游结果） */
export function findDownstreamVariables(
  exp: Experiment,
  outputVariables: OutputVariable[],
): OutputVariable[] {
  if (!exp.outputVariableIds) return [];
  return exp.outputVariableIds
    .map((id) => outputVariables.find((v) => v.id === id))
    .filter((v): v is OutputVariable => v !== undefined);
}

/** 根据变量 ID 查找引用它的实验 */
export function findExperimentsByVariable(
  variableId: string,
  experiments: Experiment[],
): Experiment[] {
  return experiments.filter((exp) => {
    const allVarIds = [
      ...(exp.inputVariableIds ?? []),
      ...(exp.outputVariableIds ?? []),
    ];
    return allVarIds.includes(variableId);
  });
}

/** 根据实验 ID 查找所有下游实验 */
export function findDownstreamExperiments(
  exp: Experiment,
  allExperiments: Experiment[],
): ExperimentRef[] {
  if (!exp.outputExperimentIds) return [];
  return exp.outputExperimentIds
    .map((id) => {
      const found = allExperiments.find((e) => e.id === id);
      return found ? { id: found.id, name: found.name } : undefined;
    })
    .filter((r): r is ExperimentRef => r !== undefined);
}

/** 构建节点详情（根据 ID 分发到不同类型） */
export function buildNodeDetail(
  nodeId: string,
  data: GraphData,
): NodeDetail | null {
  // 实验节点
  if (nodeId === "exp") {
    const exp = data.experiments[0];
    if (!exp) return null;
    return {
      type: "experiment",
      code: exp.code,
      name: exp.name,
      value: exp.finalResult.value,
      unit: exp.finalResult.unit,
      fields: [
        { label: "描述", value: exp.description },
        { label: "主公式", value: exp.formula, mono: true },
        { label: "依据标准", value: `${exp.standard} ${exp.section}` },
        { label: "状态", value: exp.status },
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

  // 常量节点
  if (nodeId.startsWith("c-")) {
    const c = data.inputVariables.find((x) => x.id === nodeId);
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

  // 结果节点
  if (nodeId.startsWith("r-")) {
    const r = data.outputVariables.find((x) => x.id === nodeId);
    if (!r) return null;
    const upstream: NodeRef[] = [{ type: "experiment", name: "基础惯量测定" }];
    const downstream: NodeRef[] = r.downstream.map((d) => ({
      type: "experiment" as const,
      name: d.name,
      via: d.via,
    }));
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
      upstream,
      downstream,
    };
  }

  // 设备节点
  if (nodeId.startsWith("eq-")) {
    const e = data.equipment.find((x) => x.id === nodeId);
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

  // 引用节点
  if (nodeId.startsWith("ref-")) {
    const r = data.references.find((x) => x.id === nodeId);
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

  // 下游实验节点（NEDC/WLTC 等）
  if (nodeId.startsWith("exp-")) {
    const labelMap: Record<string, string> = {
      "exp-nedc": "NEDC 工况",
      "exp-wltc": "WLTC 工况",
      "exp-coastdown": "滑行系数测定",
    };
    return {
      type: "experiment",
      code: nodeId.toUpperCase(),
      name: labelMap[nodeId] ?? nodeId,
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
}
