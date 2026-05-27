import type { NodeType } from "./common";

// ─── 图谱节点（Vue Flow 渲染用） ─────────────────────────────
export interface GraphNodeData {
  type: NodeType;
  label: string;
  sub: string;
  big?: boolean;
  emphasis?: boolean;
  formula?: string;
  footer?: string;
}

// ─── 图谱边规格 ─────────────────────────────────────────────
export interface EdgeSpec {
  id: string;
  from: string;
  to: string;
  label?: string;
  dir: "lr" | "td" | "bu";
  dashed?: boolean;
}

// ─── 节点详情面板 ───────────────────────────────────────────
export interface NodeRef {
  type: NodeType;
  name: string;
  via?: string;
}

export interface NodeDetailField {
  label: string;
  value: string;
  mono?: boolean;
}

export interface NodeDetail {
  type: NodeType;
  code?: string;
  name: string;
  value?: string;
  unit?: string;
  fields?: NodeDetailField[];
  upstream?: NodeRef[];
  downstream?: NodeRef[];
}
