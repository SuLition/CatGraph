// ─── 节点类型 ────────────────────────────────────────────────
export type NodeType =
  | "experiment"
  | "constant"
  | "result"
  | "equipment"
  | "reference"
  | "variable";

export interface TypeToken {
  hue: number;
  label: string;
  initial: string;
}

export const TYPE_TOKENS: Record<NodeType, TypeToken> = {
  experiment: { hue: 28, label: "试验", initial: "试" },
  constant: { hue: 200, label: "常量", initial: "常" },
  result: { hue: 145, label: "结果", initial: "果" },
  equipment: { hue: 280, label: "设备", initial: "设" },
  reference: { hue: 0, label: "标准", initial: "标" },
  variable: { hue: 50, label: "变量", initial: "变" },
};

// ─── 实验状态 ────────────────────────────────────────────────
export const EXPERIMENT_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  pending: "待开始",
  running: "进行中",
  completed: "已完成",
  failed: "失败",
};

// ─── 引用类型 ────────────────────────────────────────────────
/** 轻量引用，用于跨模型关联（序列化时只存 ID，运行时解析为对象） */
export interface ExperimentRef {
  id: string;
  name: string;
  via?: string;
}

export interface VariableRef {
  id: string;
  sym: string;
  name: string;
}
