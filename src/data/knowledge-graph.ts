// barrel file — re-exports from new modular structure
// 保持向后兼容，所有旧导入路径仍然有效

export { TYPE_TOKENS, type NodeType, type TypeToken } from "../types/common";
export { type ExperimentStatus, EXPERIMENT_STATUSES } from "../types/common";

export {
  type Experiment,
  type ExperimentStep,
  type ExperimentResult,
  type ExperimentListItem,
  type ExperimentListGroup,
} from "../types/experiment";

export {
  type InputVariable as ConstantNode,
  type OutputVariable as ResultNode,
  type Variable,
  type EquipmentNode,
  type ReferenceNode,
} from "../types/variable";

export { EXPERIMENT, EXPERIMENT_GROUPS } from "./experiments.data";
export { CONSTANTS } from "./constants.data";
export { EQUIPMENT } from "./equipment.data";
export { RESULTS } from "./results.data";
export { REFERENCES } from "./references.data";
