
// ─── 实验步骤 ────────────────────────────────────────────────
export interface StepParam {
  k: string;
  v: string;
  u?: string;
}

export interface StepOutput {
  k: string;
  v?: string;
}

export interface ExperimentStep {
  id: string;
  name: string;
  params: StepParam[];
  formula?: string;
  outputs: StepOutput[];
}

// ─── 实验结果 ────────────────────────────────────────────────
export interface ExperimentResult {
  name: string;
  value: string;
  unit: string;
  tolerance: string;
}

// ─── 实验 ────────────────────────────────────────────────────
export interface Experiment {
  id: string;
  name: string;
  code: string;
  standard: string;
  section: string;
  description: string;
  formula: string;
  status: string;
  finalResult: ExperimentResult;
  steps: ExperimentStep[];
  /** 输入变量 ID 引用（序列化用） */
  inputVariableIds?: string[];
  /** 输出变量 ID 引用（序列化用） */
  outputVariableIds?: string[];
  /** 上游实验 ID 引用（序列化用） */
  inputExperimentIds?: string[];
  /** 下游实验 ID 引用（序列化用） */
  outputExperimentIds?: string[];
}

// ─── 侧边栏列表 ──────────────────────────────────────────────
export interface ExperimentListItem {
  id: string;
  label: string;
  code: string;
  status?: "已完成" | "进行中" | "待开始";
  active?: boolean;
}

export interface ExperimentListGroup {
  title: string;
  items: ExperimentListItem[];
}
