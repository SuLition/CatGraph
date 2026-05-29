import type { NavId, NavRouteMeta } from "../types/navigation";

export const DEFAULT_NAV_ID: NavId = "documents";

export const NAV_ROUTES: Record<NavId, NavRouteMeta> = {
  documents: {
    navId: "documents",
    title: "文档",
    description: "项目文档、原始资料与导入记录。",
  },
  experiments: {
    navId: "experiments",
    title: "试验",
    description: "试验列表、计算链路与结果追踪。",
  },
  constants: {
    navId: "constants",
    title: "常量",
    description: "工程常量、符号定义和单位约束。",
  },
  graph: {
    navId: "graph",
    title: "图谱",
    description: "知识图谱节点和关系视图。",
  },
  references: {
    navId: "references",
    title: "文献",
    description: "标准、论文和引用依据。",
  },
  code: {
    navId: "code",
    title: "代码",
    description: "计算脚本、公式实现和验证逻辑。",
  },
  settings: {
    navId: "settings",
    title: "设置",
    description: "应用偏好与本地 JSON 配置。",
  },
};
