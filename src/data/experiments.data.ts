import type { Experiment } from "../types/experiment";
import type { ExperimentListGroup } from "../types/experiment";

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
  inputVariableIds: ["c-r", "c-fs", "c-N", "c-vhi"],
  outputVariableIds: ["r-Ibase", "r-Idrum"],
  outputExperimentIds: ["exp-nedc", "exp-wltc", "exp-coastdown"],
};

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
