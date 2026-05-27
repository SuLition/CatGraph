# CatGraph

Tauri 2 + Vue 3 + TypeScript desktop application scaffold.

## 项目目录结构

```
CatGraph/
├── src/                          # 前端源码（Vue 3 + TypeScript）
│   ├── main.ts                   # 应用入口：创建 Vue App → Pinia → Router
│   ├── App.vue                   # 根布局：TitleBar + ActivityBar + SideList + ContentArea + StatusBar
│   ├── style.css                 # 全局 CSS 变量、亮/暗主题、密度模式
│   │
│   ├── types/                    # 类型定义（所有 interface/type）
│   │   ├── common.ts             # 共享基础类型：NodeType, TypeToken, ExperimentStatus, ExperimentRef, VariableRef
│   │   ├── experiment.ts         # 实验相关：Experiment, ExperimentStep, ExperimentResult, ExperimentListItem
│   │   ├── variable.ts           # 变量相关：InputVariable, OutputVariable, EquipmentNode, ReferenceNode
│   │   ├── graph.ts              # 图谱相关：GraphNodeData, EdgeSpec, NodeDetail, NodeRef, NodeDetailField
│   │   ├── navigation.ts         # 导航相关：NavId, NavRouteMeta
│   │   └── settings.ts           # 设置相关：AppSettings, ThemeMode, DensityMode, NodeLabelMode
│   │
│   ├── models/                   # 领域模型函数（工厂函数 + 验证 + 转换逻辑）
│   │   ├── experiment.model.ts   # createExperiment, validateExperiment, experimentToGraphNode, toListItem, toNodeDetail
│   │   ├── variable.model.ts     # createInputVariable, createOutputVariable, constantToGraphNode, resultToGraphNode 等
│   │   ├── graph.model.ts        # buildNodeDetail, findUpstreamVariables, findDownstreamExperiments, GraphData
│   │   └── registry.ts           # 注册表查询服务：ExperimentRegistry, VariableRegistry, GraphRegistry + 工厂函数
│   │
│   ├── data/                     # 静态示例数据
│   │   ├── experiments.data.ts   # 实验数据：基础惯量测定等试验定义及实验分组列表
│   │   ├── constants.data.ts     # 输入常量数据：r, fs, N, v_lo, v_hi, τ_max
│   │   ├── equipment.data.ts     # 设备数据：滚筒、扭矩传感器、编码器、变频器
│   │   ├── results.data.ts      # 输出变量数据：I_base, I_drum 及下游引用
│   │   ├── references.data.ts   # 标准文献数据：SAE J2264, GB/T 18352.6, ISO 10521
│   │   └── nav-side-lists.ts    # 侧边栏列表配置：各导航页面的搜索占位符、分组、条目
│   │
│   ├── stores/                   # Pinia 状态管理
│   │   ├── settings.store.ts     # 应用设置 store（响应式 AppSettings，自动持久化）
│   │   └── workspace.store.ts    # 工作区 store（activeNavId, selectedSideListIds, 折叠状态）
│   │
│   ├── router/                   # Vue Router 路由
│   │   └── index.ts              # hash 历史路由，7 条命名路由
│   │
│   ├── services/                 # I/O 服务层
│   │   └── settings.service.ts   # readSettings / writeSettings（Tauri IPC 或 localStorage 降级）
│   │
│   ├── constants/                # 应用常量
│   │   ├── navigation.ts         # NAV_ROUTES（7 条导航配置），DEFAULT_NAV_ID
│   │   └── settings.ts           # DEFAULT_SETTINGS 常量
│   │
│   ├── components/               # Vue 组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── TitleBar.vue      # 自定义标题栏：窗口控制、侧边栏切换、菜单
│   │   │   ├── ActivityBar.vue   # 左侧导航栏（7 项导航 + 底部设置入口）
│   │   │   ├── SideList.vue      # 可折叠列表面板（6 种变体布局：实验/变量/文档/图谱/引用/代码）
│   │   │   ├── ContentArea.vue   # 内容区包装器（<RouterView> + 圆角左边框）
│   │   │   └── StatusBar.vue     # 底部状态栏：同步状态、图谱统计、代码、版本
│   │   └── graph/                # 图谱功能组件
│   │       ├── BlueprintCanvas.vue   # 编排器：BPHeader + BlueprintGraph + StepRail + NodePanel
│   │       ├── BlueprintGraph.vue    # Vue Flow 知识图谱（14 节点、14 边、图例、缩放/平移）
│   │       ├── GraphNode.vue         # 自定义 Vue Flow 节点组件（四方向 Handle）
│   │       ├── NodePanel.vue         # 浮动详情面板（上游/下游、字段、值块）
│   │       ├── StepRail.vue          # 底部步骤栏（5 个类 Jupyter 单元：输入/输出、参数、公式）
│   │       └── BPHeader.vue          # 实验头部：标签页、元数据、结果芯片、"重新计算"按钮
│   │
│   └── views/                    # 视图页面
│       ├── ExperimentsView.vue   # 试验视图（默认首页，渲染 BlueprintCanvas）
│       ├── GraphView.vue         # 图谱视图（复用 BlueprintCanvas）
│       ├── ConstantsView.vue      # 常量/变量视图（占位）
│       ├── DocumentsView.vue      # 文档视图（占位）
│       ├── ReferencesView.vue     # 引用视图（占位）
│       ├── CodeView.vue           # 代码视图（占位）
│       ├── SettingsView.vue       # 设置页面（外观、工作区、图谱、数据）
│       └── PlaceholderView.vue    # 通用占位组件
│
├── src-tauri/                    # Tauri 2 桌面端（Rust）
│   ├── src/
│   │   ├── main.rs               # 入口点
│   │   └── lib.rs                # Tauri 命令：greet, read_settings, write_settings
│   ├── capabilities/default.json # 权限声明
│   ├── build.rs                  # 构建脚本
│   ├── Cargo.toml                # Rust 依赖（tauri 2, serde, serde_json）
│   ├── tauri.conf.json           # Tauri 配置（窗口 1200x800、无边框、透明、Mica 效果）
│   └── icons/                    # 应用图标
│
├── dist/                         # Vite 构建输出（前端产物）
├── docs/                         # 项目文档
│   └── software-design-style-guide.md
├── design-source/                # 设计素材
├── index.html                    # 入口 HTML
├── package.json                  # Node 依赖声明
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 构建配置
├── vitest.config.ts              # Vitest 测试配置
└── eslint.config.js              # ESLint 9 flat config
```

### 各目录职责说明

| 目录/文件 | 说明 |
|---|---|
| `src/types/` | 领域类型定义层。所有 `interface` 和 `type` 集中管理，按领域拆分为 common（共享）、experiment（实验）、variable（变量）、graph（图谱）等模块。采用纯 TypeScript 类型，与 Vue/Pinia 响应式系统原生兼容。 |
| `src/models/` | 领域模型函数层。包含工厂函数（createExperiment 等）、验证函数（validateExperiment）、类型转换函数（experimentToGraphNode 等）。纯函数设计，可独立测试，可 tree-shake。 |
| `src/data/` | 静态示例数据。当前为硬编码的底盘测功机试验数据，后续可替换为真实数据源。 |
| `src/stores/` | Pinia 状态管理。`settings.store` 管理应用设置（主题、密度、图谱选项），自动持久化到 Tauri 本地存储；`workspace.store` 管理导航和侧边栏选中状态。 |
| `src/router/` | Vue Router 路由配置。使用 hash 历史模式（适配 Tauri 文件协议），定义 7 条命名路由。 |
| `src/services/` | I/O 服务抽象层。封装 Tauri IPC 调用，提供浏览器环境 localStorage 降级方案。 |
| `src/constants/` | 应用常量配置。导航路由表、默认设置值等不在运行时改变的静态配置。 |
| `src/components/layout/` | 布局组件。负责应用的整体骨架——标题栏、活动栏、侧边栏、内容区和状态栏。 |
| `src/components/graph/` | 图谱功能组件。基于 Vue Flow 实现的知识图谱可视化，包含节点渲染、边连接、详情面板和步骤栏。 |
| `src/views/` | 路由视图页面。每个导航项对应一个视图，当前试验和图谱视图已完成，其余为占位。 |
| `src-tauri/` | Tauri 2 Rust 后端。负责窗口管理（无边框透明窗口 + Mica 效果）、本地文件读写（settings.json）和原生系统集成。 |
| `dist/` | 前端构建产物目录。`vite build` 输出，由 Tauri 打包到桌面应用中。 |
| `docs/` | 项目文档。设计风格指南等。 |
| `design-source/` | 设计素材与原型讨论记录。 |

## Docs

- [软件设计风格指南](docs/software-design-style-guide.md)

## Scripts

- `npm run dev` starts the Vite web UI.
- `npm run build` type-checks and builds the web UI.
- `npm run tauri:dev` starts the desktop app in development mode.
- `npm run tauri:build` builds the desktop app.
