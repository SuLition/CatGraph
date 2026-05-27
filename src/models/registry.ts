import type { Experiment } from "../types/experiment";
import type { InputVariable, OutputVariable, EquipmentNode, ReferenceNode } from "../types/variable";

// ─── 注册表查询接口 ─────────────────────────────────────────

export interface ExperimentRegistry {
  getExperiment(id: string): Experiment | undefined;
  getExperiments(): Experiment[];
  findByIds(ids: string[]): Experiment[];
}

export interface VariableRegistry {
  getInputVariable(id: string): InputVariable | undefined;
  getOutputVariable(id: string): OutputVariable | undefined;
  getInputVariables(): InputVariable[];
  getOutputVariables(): OutputVariable[];
}

export interface GraphRegistry {
  getEquipment(id: string): EquipmentNode | undefined;
  getEquipmentList(): EquipmentNode[];
  getReference(id: string): ReferenceNode | undefined;
  getReferenceList(): ReferenceNode[];
}

// ─── 基于数组的默认实现 ─────────────────────────────────────

export function createExperimentRegistry(experiments: Experiment[]): ExperimentRegistry {
  const map = new Map(experiments.map((e) => [e.id, e]));

  return {
    getExperiment(id) {
      return map.get(id);
    },
    getExperiments() {
      return experiments;
    },
    findByIds(ids) {
      return ids.map((id) => map.get(id)).filter((e): e is Experiment => e !== undefined);
    },
  };
}

export function createVariableRegistry(
  inputVariables: InputVariable[],
  outputVariables: OutputVariable[],
): VariableRegistry {
  const inputMap = new Map(inputVariables.map((v) => [v.id, v]));
  const outputMap = new Map(outputVariables.map((v) => [v.id, v]));

  return {
    getInputVariable(id) {
      return inputMap.get(id);
    },
    getOutputVariable(id) {
      return outputMap.get(id);
    },
    getInputVariables() {
      return inputVariables;
    },
    getOutputVariables() {
      return outputVariables;
    },
  };
}

export function createGraphRegistry(
  equipment: EquipmentNode[],
  references: ReferenceNode[],
): GraphRegistry {
  const equipmentMap = new Map(equipment.map((e) => [e.id, e]));
  const referenceMap = new Map(references.map((r) => [r.id, r]));

  return {
    getEquipment(id) {
      return equipmentMap.get(id);
    },
    getEquipmentList() {
      return equipment;
    },
    getReference(id) {
      return referenceMap.get(id);
    },
    getReferenceList() {
      return references;
    },
  };
}
