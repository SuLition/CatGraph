import { describe, it, expect } from "vitest";
import { TYPE_TOKENS, EXPERIMENT_STATUSES, EXPERIMENT_STATUS_LABELS } from "../types/common";
import { createExperiment, validateExperiment } from "../models/experiment.model";
import { createInputVariable, createOutputVariable } from "../models/variable.model";
import { experimentToGraphNode, experimentToListItem, experimentToNodeDetail } from "../models/experiment.model";
import { constantToGraphNode, resultToGraphNode, equipmentToGraphNode, referenceToGraphNode } from "../models/variable.model";
import { constantToNodeDetail, resultToNodeDetail, equipmentToNodeDetail, referenceToNodeDetail } from "../models/variable.model";
import { buildNodeDetail } from "../models/graph.model";
import { createExperimentRegistry, createVariableRegistry } from "../models/registry";
import { EXPERIMENT } from "../data/experiments.data";
import { CONSTANTS } from "../data/constants.data";
import { EQUIPMENT } from "../data/equipment.data";
import { RESULTS } from "../data/results.data";
import { REFERENCES } from "../data/references.data";

// ─── common types ──────────────────────────────────────────────
describe("common types", () => {
  it("defines a token for every node type", () => {
    const types = ["experiment", "constant", "result", "equipment", "reference", "variable"] as const;
    for (const t of types) {
      expect(TYPE_TOKENS[t]).toBeDefined();
      expect(TYPE_TOKENS[t].hue).toBeTypeOf("number");
      expect(TYPE_TOKENS[t].label).toBeTypeOf("string");
    }
  });

  it("defines all experiment statuses", () => {
    expect(EXPERIMENT_STATUSES).toHaveLength(4);
    expect(EXPERIMENT_STATUSES).toContain("pending");
    expect(EXPERIMENT_STATUSES).toContain("completed");
  });

  it("maps all statuses to Chinese labels", () => {
    for (const s of EXPERIMENT_STATUSES) {
      expect(EXPERIMENT_STATUS_LABELS[s]).toBeTypeOf("string");
    }
  });
});

// ─── experiment model ─────────────────────────────────────────
describe("experiment model", () => {
  it("creates an experiment with defaults", () => {
    const exp = createExperiment({
      id: "test-1",
      name: "测试实验",
      code: "TEST-001",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
    });
    expect(exp.id).toBe("test-1");
    expect(exp.steps).toEqual([]);
    expect(exp.status).toBe("待开始");
    expect(exp.inputVariableIds).toEqual([]);
    expect(exp.outputVariableIds).toEqual([]);
  });

  it("validates experiment correctly", () => {
    const valid = createExperiment({
      id: "test-1",
      name: "测试",
      code: "T-001",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
      steps: [{ id: "s1", name: "步骤1", params: [], outputs: [] }],
    });
    const result = validateExperiment(valid);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reports validation errors", () => {
    const result = validateExperiment({
      id: "",
      name: "",
      code: "",
      standard: "",
      section: "",
      description: "",
      formula: "",
      status: "",
      finalResult: { name: "", value: "", unit: "", tolerance: "" },
      steps: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("converts experiment to graph node", () => {
    const exp = createExperiment({
      id: "test-1",
      name: "测试",
      code: "T-001",
      formula: "F = ma",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
      steps: [{ id: "s1", name: "步骤1", params: [], outputs: [] }],
    });
    const node = experimentToGraphNode(exp);
    expect(node.type).toBe("experiment");
    expect(node.label).toBe("测试");
    expect(node.formula).toBe("F = ma");
    expect(node.big).toBe(true);
  });

  it("converts experiment to list item", () => {
    const exp = createExperiment({
      id: "test-1",
      name: "测试",
      code: "T-001",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
    });
    const item = experimentToListItem(exp);
    expect(item.id).toBe("test-1");
    expect(item.label).toBe("测试");
    expect(item.code).toBe("T-001");
  });

  it("converts experiment to node detail", () => {
    const exp = createExperiment({
      id: "test-1",
      name: "测试",
      code: "T-001",
      description: "描述文本",
      formula: "F = ma",
      standard: "GB/T",
      section: "§1.0",
      status: "已完成",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
    });
    const detail = experimentToNodeDetail(exp, [], []);
    expect(detail.type).toBe("experiment");
    expect(detail.name).toBe("测试");
    expect(detail.value).toBe("1.0");
    expect(detail.unit).toBe("m");
    expect(detail.fields).toHaveLength(4);
  });
});

// ─── variable model ───────────────────────────────────────────
describe("variable model", () => {
  it("creates input variable", () => {
    const v = createInputVariable({
      id: "c-1",
      sym: "x",
      name: "变量X",
      value: "10",
      unit: "m",
      usedBy: 3,
    });
    expect(v.id).toBe("c-1");
    expect(v.sym).toBe("x");
    expect(v.usedBy).toBe(3);
  });

  it("creates input variable with default usedBy", () => {
    const v = createInputVariable({
      id: "c-1",
      sym: "x",
      name: "变量X",
      value: "10",
      unit: "m",
    });
    expect(v.usedBy).toBe(0);
  });

  it("creates output variable", () => {
    const v = createOutputVariable({
      id: "r-1",
      sym: "y",
      name: "结果Y",
      value: "20",
      unit: "kg",
      fromExperimentId: "exp-1",
    });
    expect(v.id).toBe("r-1");
    expect(v.sym).toBe("y");
    expect(v.fromExperimentId).toBe("exp-1");
    expect(v.downstream).toEqual([]);
  });

  it("converts constant to graph node", () => {
    const v = createInputVariable({
      id: "c-1",
      sym: "r",
      name: "半径",
      value: "0.2",
      unit: "m",
    });
    const node = constantToGraphNode(v);
    expect(node.type).toBe("constant");
    expect(node.label).toBe("r · 半径");
    expect(node.sub).toBe("0.2 m");
  });

  it("converts result to graph node", () => {
    const v = createOutputVariable({
      id: "r-1",
      sym: "I",
      name: "惯量",
      value: "78.4",
      unit: "kg·m²",
      fromExperimentId: "exp-1",
    });
    const node = resultToGraphNode(v);
    expect(node.type).toBe("result");
    expect(node.label).toBe("I · 惯量");
  });

  it("converts equipment to graph node", () => {
    const node = equipmentToGraphNode(EQUIPMENT[0]);
    expect(node.type).toBe("equipment");
    expect(node.label).toBe("滚筒");
    expect(node.sub).toBe("Horiba DC-48\"");
  });

  it("converts reference to graph node", () => {
    const node = referenceToGraphNode(REFERENCES[0]);
    expect(node.type).toBe("reference");
    expect(node.label).toBe("SAE J2264");
  });

  it("converts constant to node detail", () => {
    const v = createInputVariable({
      id: "c-r",
      sym: "r",
      name: "半径",
      value: "0.2",
      unit: "m",
      usedBy: 5,
    });
    const detail = constantToNodeDetail(v);
    expect(detail.type).toBe("constant");
    expect(detail.name).toBe("半径");
    expect(detail.value).toBe("0.2");
  });

  it("converts result to node detail", () => {
    const v = createOutputVariable({
      id: "r-1",
      sym: "I",
      name: "惯量",
      value: "78.4",
      unit: "kg·m²",
      fromExperimentId: "exp-1",
    });
    const detail = resultToNodeDetail(v);
    expect(detail.type).toBe("result");
    expect(detail.name).toBe("惯量");
  });

  it("converts equipment to node detail", () => {
    const detail = equipmentToNodeDetail(EQUIPMENT[0]);
    expect(detail.type).toBe("equipment");
    expect(detail.name).toBe("滚筒");
  });

  it("converts reference to node detail", () => {
    const detail = referenceToNodeDetail(REFERENCES[0]);
    expect(detail.type).toBe("reference");
    expect(detail.name).toBe("SAE J2264");
  });
});

// ─── graph model ──────────────────────────────────────────────
describe("graph model", () => {
  it("builds node detail for experiment", () => {
    const detail = buildNodeDetail("exp", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe("experiment");
    expect(detail!.name).toBe("基础惯量测定");
  });

  it("builds node detail for constant", () => {
    const detail = buildNodeDetail("c-r", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe("constant");
    expect(detail!.name).toBe("滚筒半径");
  });

  it("builds node detail for result", () => {
    const detail = buildNodeDetail("r-Ibase", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe("result");
    expect(detail!.name).toBe("基础惯量");
  });

  it("builds node detail for equipment", () => {
    const detail = buildNodeDetail("eq-drum", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe("equipment");
  });

  it("builds node detail for reference", () => {
    const detail = buildNodeDetail("ref-sae", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe("reference");
    expect(detail!.name).toBe("SAE J2264");
  });

  it("builds node detail for downstream experiment", () => {
    const detail = buildNodeDetail("exp-nedc", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).not.toBeNull();
    expect(detail!.type).toBe("experiment");
    expect(detail!.name).toBe("NEDC 工况");
  });

  it("returns null for unknown id", () => {
    const detail = buildNodeDetail("unknown-id", {
      experiments: [EXPERIMENT],
      inputVariables: CONSTANTS,
      outputVariables: RESULTS,
      equipment: EQUIPMENT,
      references: REFERENCES,
    });
    expect(detail).toBeNull();
  });
});

// ─── registry ─────────────────────────────────────────────────
describe("registry", () => {
  it("creates experiment registry and finds by id", () => {
    const exp = createExperiment({
      id: "test-1",
      name: "测试",
      code: "T-001",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
    });
    const registry = createExperimentRegistry([exp]);
    expect(registry.getExperiment("test-1")).toBe(exp);
    expect(registry.getExperiment("non-existent")).toBeUndefined();
    expect(registry.getExperiments()).toHaveLength(1);
  });

  it("creates experiment registry and finds by ids", () => {
    const e1 = createExperiment({
      id: "e1",
      name: "测试1",
      code: "T-001",
      finalResult: { name: "R", value: "1.0", unit: "m", tolerance: "±1%" },
    });
    const e2 = createExperiment({
      id: "e2",
      name: "测试2",
      code: "T-002",
      finalResult: { name: "R", value: "2.0", unit: "m", tolerance: "±1%" },
    });
    const registry = createExperimentRegistry([e1, e2]);
    const found = registry.findByIds(["e1", "e2", "missing"]);
    expect(found).toHaveLength(2);
  });

  it("creates variable registry and finds variables", () => {
    const iVars = [
      createInputVariable({
        id: "c-1",
        sym: "x",
        name: "变量X",
        value: "10",
        unit: "m",
      }),
    ];
    const oVars = [
      createOutputVariable({
        id: "r-1",
        sym: "y",
        name: "结果Y",
        value: "20",
        unit: "kg",
        fromExperimentId: "exp-1",
      }),
    ];
    const registry = createVariableRegistry(iVars, oVars);
    expect(registry.getInputVariable("c-1")).toBe(iVars[0]);
    expect(registry.getOutputVariable("r-1")).toBe(oVars[0]);
    expect(registry.getInputVariables()).toHaveLength(1);
    expect(registry.getOutputVariables()).toHaveLength(1);
  });
});
