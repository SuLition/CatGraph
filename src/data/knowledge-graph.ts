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

export interface ExperimentStep {
  id: string;
  name: string;
  params: { k: string; v: string; u?: string }[];
  formula?: string;
  outputs: { k: string; v?: string }[];
}

export interface Experiment {
  id: string;
  name: string;
  code: string;
  standard: string;
  section: string;
  description: string;
  formula: string;
  status: string;
  finalResult: { name: string; value: string; unit: string; tolerance: string };
  steps: ExperimentStep[];
}

export interface ConstantNode {
  id: string;
  sym: string;
  name: string;
  value: string;
  unit: string;
  usedBy: number;
}

export interface EquipmentNode {
  id: string;
  name: string;
  model: string;
  vendor: string;
}

export interface ResultNode {
  id: string;
  sym: string;
  name: string;
  value: string;
  unit: string;
  from: string;
  downstream: { id: string; name: string; via: string }[];
}

export interface ReferenceNode {
  id: string;
  name: string;
  section: string;
  title: string;
}

export const EXPERIMENT: Experiment = {
  id: "exp-base-inertia",
  name: "基础惯量测定",
  code: "EXP-BI-001",
  standard: "SAE J2264",
  section: "§4.2",
  description: "通过加速/减速测量,确定底盘测功机系统的等效转动惯量",
  formula: "I = T / α = F·r / α",
  status: "已完成 · 3 次校验",
  finalResult: { name: "I_base", value: "78.4", unit: "kg·m²", tolerance: "±0.6%" },
  steps: [
    {
      id: "s1",
      name: "加速阶段测量",
      params: [
        { k: "v_low", v: "20", u: "mph" },
        { k: "v_high", v: "55", u: "mph" },
        { k: "fs", v: "200", u: "Hz" },
      ],
      formula: "F_ext, a_ext ← 200Hz 采样",
      outputs: [
        { k: "F_accel[]", v: "120 samples" },
        { k: "a_accel[]", v: "120 samples" },
      ],
    },
    {
      id: "s2",
      name: "减速阶段测量",
      params: [
        { k: "v_high", v: "50", u: "mph" },
        { k: "v_low", v: "15", u: "mph" },
        { k: "fs", v: "200", u: "Hz" },
      ],
      formula: "F_decel, a_decel ← 200Hz 采样",
      outputs: [
        { k: "F_decel[]", v: "118 samples" },
        { k: "a_decel[]", v: "118 samples" },
      ],
    },
    {
      id: "s3",
      name: "单次运行计算",
      params: [{ k: "runs", v: "5", u: "次/组" }],
      formula: "I_run = F̄ / ā",
      outputs: [{ k: "I_run", v: "5 次 × 4 组" }],
    },
    {
      id: "s4",
      name: "加速度组聚合",
      params: [{ k: "groups", v: "4", u: "组" }],
      formula: "I_group = mean(I_run × 5)",
      outputs: [
        { k: "I_group_1", v: "77.8 kg·m²" },
        { k: "I_group_2", v: "78.2 kg·m²" },
        { k: "I_group_3", v: "78.6 kg·m²" },
        { k: "I_group_4", v: "79.0 kg·m²" },
      ],
    },
    {
      id: "s5",
      name: "最终基础惯量",
      params: [{ k: "method", v: "max+min/2" }],
      formula: "I_base = (I_max + I_min) / 2",
      outputs: [{ k: "I_base", v: "78.4 kg·m²" }],
    },
  ],
};

export const CONSTANTS: ConstantNode[] = [
  { id: "c-r", sym: "r", name: "滚筒半径", value: "0.2032", unit: "m", usedBy: 5 },
  { id: "c-fs", sym: "fs", name: "采样频率", value: "200", unit: "Hz", usedBy: 3 },
  { id: "c-N", sym: "N", name: "编码器脉冲数", value: "1024", unit: "脉冲/转", usedBy: 2 },
  { id: "c-vlo", sym: "v_lo", name: "低速门限", value: "15", unit: "mph", usedBy: 1 },
  { id: "c-vhi", sym: "v_hi", name: "高速门限", value: "55", unit: "mph", usedBy: 1 },
  { id: "c-tau", sym: "τ_max", name: "扭矩量程", value: "2000", unit: "N·m", usedBy: 2 },
];

export const EQUIPMENT: EquipmentNode[] = [
  { id: "eq-drum", name: "滚筒", model: 'DC-48"', vendor: "Horiba" },
  { id: "eq-torque", name: "扭矩传感器", model: "T40B", vendor: "HBM" },
  { id: "eq-encoder", name: "编码器", model: "ERN1387", vendor: "Heidenhain" },
  { id: "eq-inverter", name: "变频器", model: "ACS880", vendor: "ABB" },
];

export const RESULTS: ResultNode[] = [
  {
    id: "r-Ibase",
    sym: "I_base",
    name: "基础惯量",
    value: "78.4",
    unit: "kg·m²",
    from: "exp-base-inertia",
    downstream: [
      { id: "exp-coastdown", name: "滑行系数测定", via: "修正补偿" },
      { id: "exp-nedc", name: "NEDC 工况", via: "模拟惯量" },
      { id: "exp-wltc", name: "WLTC 工况", via: "模拟惯量" },
    ],
  },
  {
    id: "r-Idrum",
    sym: "I_drum",
    name: "滚筒旋转质量等效",
    value: "142.6",
    unit: "kg",
    from: "exp-base-inertia",
    downstream: [{ id: "exp-nedc", name: "NEDC 工况", via: "I_sim = m_test − I_drum / r²" }],
  },
];

export const REFERENCES: ReferenceNode[] = [
  { id: "ref-sae", name: "SAE J2264", section: "§4.2", title: "底盘测功机校准" },
  { id: "ref-gb", name: "GB/T 18352.6", section: "附录C", title: "轻型汽车排放限值" },
  { id: "ref-iso", name: "ISO 10521", section: "Part 1", title: "道路车辆 — 道路负载" },
];

// ─── Experiment list groups for the middle pane ──────────────────
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

export const EXPERIMENT_GROUPS: ExperimentListGroup[] = [
  {
    title: "基础试验",
    items: [
      {
        id: "exp-base-inertia",
        label: "基础惯量测定",
        code: "EXP-BI-001",
        status: "已完成",
        active: true,
      },
      { id: "exp-coastdown", label: "滑行系数测定", code: "EXP-CD-002", status: "进行中" },
      { id: "exp-torque-cal", label: "扭矩校准", code: "EXP-TC-003", status: "待开始" },
    ],
  },
  {
    title: "工况实验",
    items: [
      { id: "exp-nedc", label: "NEDC 循环", code: "EXP-NEDC" },
      { id: "exp-wltc", label: "WLTC 循环", code: "EXP-WLTC" },
      { id: "exp-cltc", label: "CLTC-P", code: "EXP-CLTC" },
    ],
  },
  {
    title: "标定",
    items: [
      { id: "exp-zero", label: "力传感器零点", code: "EXP-ZE-008" },
      { id: "exp-encoder-res", label: "编码器分辨率", code: "EXP-EN-009" },
    ],
  },
];
