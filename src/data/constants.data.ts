import type { InputVariable } from "../types/variable";

export const CONSTANTS: InputVariable[] = [
  { id: "c-r", sym: "r", name: "滚筒半径", value: "0.2032", unit: "m", usedBy: 5 },
  { id: "c-fs", sym: "fs", name: "采样频率", value: "200", unit: "Hz", usedBy: 3 },
  { id: "c-N", sym: "N", name: "编码器脉冲数", value: "1024", unit: "脉冲/转", usedBy: 2 },
  { id: "c-vlo", sym: "v_lo", name: "低速门限", value: "15", unit: "mph", usedBy: 1 },
  { id: "c-vhi", sym: "v_hi", name: "高速门限", value: "55", unit: "mph", usedBy: 1 },
  { id: "c-tau", sym: "τ_max", name: "扭矩量程", value: "2000", unit: "N·m", usedBy: 2 },
];
