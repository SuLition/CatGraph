import type { OutputVariable } from "../types/variable";

export const RESULTS: OutputVariable[] = [
  {
    id: "r-Ibase",
    sym: "I_base",
    name: "基础惯量",
    value: "78.4",
    unit: "kg·m²",
    fromExperimentId: "exp-base-inertia",
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
    fromExperimentId: "exp-base-inertia",
    downstream: [{ id: "exp-nedc", name: "NEDC 工况", via: "I_sim = m_test − I_drum / r²" }],
  },
];
