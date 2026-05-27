import type { Experiment, ExperimentStep, ExperimentResult } from "../types/experiment";
import type { GraphNodeData } from "../types/graph";
import type { NodeDetail, NodeRef } from "../types/graph";
import type { ExperimentListItem } from "../types/experiment";

// ─── 工厂函数 ────────────────────────────────────────────────
export interface CreateExperimentInput {
  id: string;
  name: string;
  code: string;
  standard?: string;
  section?: string;
  description?: string;
  formula?: string;
  status?: string;
  finalResult: ExperimentResult;
  steps?: ExperimentStep[];
  inputVariableIds?: string[];
  outputVariableIds?: string[];
  inputExperimentIds?: string[];
  outputExperimentIds?: string[];
}

export function createExperiment(input: CreateExperimentInput): Experiment {
  return {
    id: input.id,
    name: input.name,
    code: input.code,
    standard: input.standard ?? "",
    section: input.section ?? "",
    description: input.description ?? "",
    formula: input.formula ?? "",
    status: input.status ?? "待开始",
    finalResult: input.finalResult,
    steps: input.steps ?? [],
    inputVariableIds: input.inputVariableIds ?? [],
    outputVariableIds: input.outputVariableIds ?? [],
    inputExperimentIds: input.inputExperimentIds ?? [],
    outputExperimentIds: input.outputExperimentIds ?? [],
  };
}

// ─── 验证 ───────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExperiment(exp: Experiment): ValidationResult {
  const errors: string[] = [];

  if (!exp.id) errors.push("id 不能为空");
  if (!exp.name) errors.push("name 不能为空");
  if (!exp.code) errors.push("code 不能为空");
  if (exp.steps.length === 0) errors.push("steps 不能为空");
  if (!exp.finalResult.name) errors.push("finalResult.name 不能为空");
  if (!exp.finalResult.value) errors.push("finalResult.value 不能为空");
  if (!exp.finalResult.unit) errors.push("finalResult.unit 不能为空");

  for (const [i, step] of exp.steps.entries()) {
    if (!step.id) errors.push(`steps[${i}].id 不能为空`);
    if (!step.name) errors.push(`steps[${i}].name 不能为空`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── 转换为图谱节点 ─────────────────────────────────────────
export function experimentToGraphNode(
  exp: Experiment,
  opts?: { big?: boolean },
): GraphNodeData {
  return {
    type: "experiment",
    label: exp.name,
    sub: `${exp.code} · ${exp.steps.length} 步骤`,
    big: opts?.big ?? true,
    formula: exp.formula || undefined,
    footer: exp.steps.map((s, i) => `步骤 ${i + 1}`).join(" ─ "),
  };
}

// ─── 转换为侧边栏列表项 ─────────────────────────────────────
export function experimentToListItem(exp: Experiment): ExperimentListItem {
  return {
    id: exp.id,
    label: exp.name,
    code: exp.code,
    status: "已完成" as const,
  };
}

// ─── 转换为详情面板数据 ─────────────────────────────────────
export function experimentToNodeDetail(
  exp: Experiment,
  upstreamNodes: NodeRef[] = [],
  downstreamNodes: NodeRef[] = [],
): NodeDetail {
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
    upstream: upstreamNodes,
    downstream: downstreamNodes,
  };
}
