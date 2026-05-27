import type { DocumentRecord } from "../types/document";
import type { NavId } from "../types/navigation";

export type SideListNavId = Exclude<NavId, "settings">;
export type SideListVariant =
  | "document"
  | "experiment"
  | "variable"
  | "graph"
  | "reference"
  | "code";

export interface SideListItem {
  id: string;
  label: string;
  code?: string;
  meta?: string;
  status?: string;
  badge?: string;
  value?: string;
  unit?: string;
  description?: string;
  tone?: "success" | "warning" | "muted" | "info" | "danger";
}

export interface SideListGroup {
  title: string;
  items: SideListItem[];
}

export interface SideListConfig {
  title: string;
  searchPlaceholder: string;
  variant: SideListVariant;
  groups: SideListGroup[];
}

export const SIDE_LISTS: Record<SideListNavId, SideListConfig> = {
  documents: {
    title: "文档",
    searchPlaceholder: "搜索文档、导入记录、附件…",
    variant: "document",
    groups: [
      {
        title: "试验资料",
        items: [
          {
            id: "doc-test-plan",
            label: "基础惯量测定方案",
            code: "DOC-PLAN-001",
            meta: "2026-05-20 更新",
            badge: "方案",
            tone: "info",
          },
          {
            id: "doc-raw-log",
            label: "200Hz 原始采样记录",
            code: "DOC-LOG-014",
            meta: "12.4 MB",
            badge: "日志",
            tone: "muted",
          },
        ],
      },
      {
        title: "导入队列",
        items: [
          {
            id: "doc-import-sae",
            label: "SAE J2264 标准摘录",
            code: "IMP-STD-004",
            meta: "已解析 86%",
            badge: "PDF",
            tone: "warning",
          },
          {
            id: "doc-import-cal",
            label: "扭矩传感器校准证书",
            code: "IMP-CAL-002",
            meta: "已入库",
            badge: "证书",
            tone: "success",
          },
        ],
      },
    ],
  },
  experiments: {
    title: "试验",
    searchPlaceholder: "搜索试验、工况、标定…",
    variant: "experiment",
    groups: [
      {
        title: "基础试验",
        items: [
          {
            id: "exp-base-inertia",
            label: "基础惯量测定",
            code: "EXP-BI-001",
            status: "已完成",
            tone: "success",
          },
          {
            id: "exp-coastdown",
            label: "滑行系数测定",
            code: "EXP-CD-002",
            status: "进行中",
            tone: "warning",
          },
          {
            id: "exp-torque-cal",
            label: "扭矩校准",
            code: "EXP-TC-003",
            status: "待开始",
            tone: "muted",
          },
        ],
      },
      {
        title: "工况实验",
        items: [
          { id: "exp-nedc", label: "NEDC 循环", code: "EXP-NEDC", status: "待开始" },
          { id: "exp-wltc", label: "WLTC 循环", code: "EXP-WLTC", status: "待开始" },
          { id: "exp-cltc", label: "CLTC-P", code: "EXP-CLTC", status: "待开始" },
        ],
      },
      {
        title: "标定",
        items: [
          { id: "exp-zero", label: "力传感器零点", code: "EXP-ZE-008", status: "已完成" },
          { id: "exp-encoder-res", label: "编码器分辨率", code: "EXP-EN-009", status: "已完成" },
        ],
      },
    ],
  },
  constants: {
    title: "变量",
    searchPlaceholder: "搜索变量、常量、结果符号…",
    variant: "variable",
    groups: [
      {
        title: "输入常量",
        items: [
          {
            id: "c-r",
            label: "滚筒半径",
            code: "r",
            value: "0.2032",
            unit: "m",
            meta: "被 5 个计算引用",
            tone: "info",
          },
          {
            id: "c-fs",
            label: "采样频率",
            code: "fs",
            value: "200",
            unit: "Hz",
            meta: "被 3 个计算引用",
            tone: "info",
          },
          {
            id: "c-N",
            label: "编码器脉冲数",
            code: "N",
            value: "1024",
            unit: "脉冲/转",
            meta: "被 2 个计算引用",
            tone: "info",
          },
          {
            id: "c-vhi",
            label: "高速门限",
            code: "v_hi",
            value: "55",
            unit: "mph",
            meta: "被 1 个计算引用",
            tone: "muted",
          },
        ],
      },
      {
        title: "输出变量",
        items: [
          {
            id: "r-Ibase",
            label: "基础惯量",
            code: "I_base",
            value: "78.4",
            unit: "kg·m²",
            meta: "来自 EXP-BI-001",
            tone: "success",
          },
          {
            id: "r-Idrum",
            label: "滚筒旋转质量等效",
            code: "I_drum",
            value: "142.6",
            unit: "kg",
            meta: "来自 EXP-BI-001",
            tone: "success",
          },
        ],
      },
    ],
  },
  graph: {
    title: "图谱",
    searchPlaceholder: "搜索节点、关系、子图…",
    variant: "graph",
    groups: [
      {
        title: "节点视图",
        items: [
          {
            id: "graph-experiment",
            label: "试验节点",
            code: "NODE.EXP",
            value: "6",
            unit: "个节点",
            description: "试验流程、工况和标定节点。",
            tone: "info",
          },
          {
            id: "graph-variable",
            label: "变量节点",
            code: "NODE.VAR",
            value: "8",
            unit: "个节点",
            description: "常量、输入和结果变量。",
            tone: "success",
          },
          {
            id: "graph-reference",
            label: "依据节点",
            code: "NODE.REF",
            value: "3",
            unit: "个节点",
            description: "标准章节与引用来源。",
            tone: "danger",
          },
        ],
      },
      {
        title: "关系视图",
        items: [
          {
            id: "graph-calc-chain",
            label: "计算链路",
            code: "EDGE.CALC",
            value: "14",
            unit: "条关系",
            description: "从输入变量到结果的计算依赖。",
            tone: "warning",
          },
          {
            id: "graph-ref-chain",
            label: "引用链路",
            code: "EDGE.REF",
            value: "3",
            unit: "条关系",
            description: "标准与试验节点的依据绑定。",
            tone: "muted",
          },
        ],
      },
    ],
  },
  references: {
    title: "文献",
    searchPlaceholder: "搜索标准、章节、引用…",
    variant: "reference",
    groups: [
      {
        title: "标准",
        items: [
          {
            id: "ref-sae",
            label: "SAE J2264",
            code: "§4.2",
            description: "底盘测功机校准",
            meta: "被基础惯量测定引用",
            tone: "danger",
          },
          {
            id: "ref-gb",
            label: "GB/T 18352.6",
            code: "附录 C",
            description: "轻型汽车排放限值",
            meta: "被工况实验引用",
            tone: "danger",
          },
          {
            id: "ref-iso",
            label: "ISO 10521",
            code: "Part 1",
            description: "道路车辆 — 道路负载",
            meta: "被滑行系数测定引用",
            tone: "danger",
          },
        ],
      },
    ],
  },
  code: {
    title: "代码",
    searchPlaceholder: "搜索脚本、公式、验证逻辑…",
    variant: "code",
    groups: [
      {
        title: "计算脚本",
        items: [
          {
            id: "code-inertia",
            label: "inertia/base_inertia.ts",
            code: "TS",
            description: "I = T / α = F·r / α",
            meta: "计算核心",
            tone: "info",
          },
          {
            id: "code-sampling",
            label: "sampling/accel_window.ts",
            code: "TS",
            description: "200Hz 加减速窗口采样",
            meta: "数据预处理",
            tone: "warning",
          },
        ],
      },
      {
        title: "验证",
        items: [
          {
            id: "code-inertia-test",
            label: "inertia/base_inertia.test.ts",
            code: "TEST",
            description: "边界值和标准样例校验",
            meta: "通过",
            tone: "success",
          },
          {
            id: "code-unit-check",
            label: "units/dimensional_check.ts",
            code: "TS",
            description: "单位维度一致性检查",
            meta: "草稿",
            tone: "muted",
          },
        ],
      },
    ],
  },
};

export const DEFAULT_SIDE_LIST_SELECTIONS: Record<SideListNavId, string> = {
  documents: "",
  experiments: "exp-base-inertia",
  constants: "c-r",
  graph: "graph-experiment",
  references: "ref-sae",
  code: "code-inertia",
};

export function isSideListNavId(id: NavId): id is SideListNavId {
  return id !== "settings";
}

export function documentsToSideListGroups(documents: DocumentRecord[]): SideListGroup[] {
  if (documents.length === 0) return [];

  const sorted = [...documents].sort((a, b) => (a.importedAt < b.importedAt ? 1 : -1));
  const recent = sorted.slice(0, 5);
  const rest = sorted.slice(5);

  const toItem = (document: DocumentRecord): SideListItem => ({
    id: document.id,
    label: document.title,
    code: document.originalName,
    meta: new Date(document.importedAt).toLocaleString(),
    badge: document.kind.toUpperCase(),
    tone:
      document.kind === "pdf" ? "info" : document.kind === "markdown" ? "muted" : "success",
  });

  const groups: SideListGroup[] = [{ title: "最近导入", items: recent.map(toItem) }];
  if (rest.length > 0) {
    groups.push({ title: "全部", items: rest.map(toItem) });
  }
  return groups;
}
