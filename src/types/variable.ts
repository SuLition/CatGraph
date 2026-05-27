import type { ExperimentRef } from "./common";

// ─── 输入变量（常量） ────────────────────────────────────────
export interface InputVariable {
  id: string;
  sym: string;
  name: string;
  value: string;
  unit: string;
  usedBy: number;
}

// ─── 输出变量（计算结果） ────────────────────────────────────
export interface OutputVariable {
  id: string;
  sym: string;
  name: string;
  value: string;
  unit: string;
  fromExperimentId: string;
  downstream: ExperimentRef[];
}

// ─── 联合类型 ───────────────────────────────────────────────
export type Variable = InputVariable | OutputVariable;

// ─── 设备节点 ────────────────────────────────────────────────
export interface EquipmentNode {
  id: string;
  name: string;
  model: string;
  vendor: string;
}

// ─── 标准/引用节点 ──────────────────────────────────────────
export interface ReferenceNode {
  id: string;
  name: string;
  section: string;
  title: string;
}
