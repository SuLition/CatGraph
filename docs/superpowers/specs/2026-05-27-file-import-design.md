# 文件导入与在线阅读功能设计

> 状态：草案 — 待用户审阅
> 作者：与 Claude 共同设计
> 日期：2026-05-27

## 1. 目标

为 CatGraph 增加"文档"功能闭环：

1. 从本地文件系统导入常用格式文档（PDF / Word / TXT / Excel）。
2. 在应用内"在线阅读"——可翻页、缩放、可选区。
3. 选中文字弹出浮动菜单，提供：**加入知识库 / 询问 AI / 翻译 / 搜索**。
4. "加入知识库"产出独立的"片段卡片"集合，与现有知识图谱并行；其余 3 个动作本期仅做 UI 占位 + 事件路由。

## 2. 决策摘要（已与用户确认）

| 维度 | 决定 |
|---|---|
| 知识库集成模型 | 独立片段集合；本期不与图谱节点打通 |
| AI / 翻译 / 搜索 | 仅 UI 占位 + 统一 action 事件，不接入真实后端 |
| 文件存储 | 导入时复制到 Tauri `app_data_dir/documents/` |
| MVP 格式 | PDF + TXT/Markdown；Word/Excel 占位组件，架构兼容 |
| 渲染架构 | 前端插件式渲染器（方案 A）；Tauri 端只负责 IO 与权限 |

## 3. 数据模型

### 3.1 文档

```ts
// src/types/document.ts
export type DocumentKind = "pdf" | "markdown" | "text" | "docx" | "xlsx";

export interface DocumentRecord {
  id: string;               // 内部 ID（contentHash 前 12 位）
  title: string;            // 默认取文件名（不含扩展名），可编辑
  kind: DocumentKind;
  originalName: string;     // 原始完整文件名
  storedPath: string;       // 相对 app_data_dir 的路径，如 "documents/<id>.pdf"
  byteSize: number;
  contentHash: string;      // sha256(file bytes)；用于去重
  importedAt: string;       // ISO datetime
  lastOpenedAt?: string;    // ISO datetime
  tags?: string[];          // 预留：用户分组
}
```

### 3.2 片段

```ts
// src/types/snippet.ts
export interface SnippetAnchor {
  documentId: string;
  locator:
    | { kind: "pdf"; page: number; charStart: number; charEnd: number }
    | { kind: "text"; charStart: number; charEnd: number };
}

export interface SnippetRecord {
  id: string;             // uuid
  text: string;           // 选中文字（trim + 折叠空白）
  anchor: SnippetAnchor;
  note?: string;          // 用户备注（数据字段就绪，MVP UI 不暴露）
  createdAt: string;      // ISO datetime
  tags?: string[];        // 预留
}
```

判别联合的 `locator` 设计是为未来新增格式（docx/xlsx）时无侵入扩展；MVP 只实现 `pdf` 与 `text` 两个分支。

## 4. 存储布局

走与 `settings.service.ts` 完全相同的 IPC + JSON 模式：所有读写在 Tauri 命令中完成。

**与 settings 不同的一点**：settings 在浏览器模式下降级到 `localStorage`；本特性涉及二进制文件读写，**Tauri-only**，浏览器模式下 documents service 直接抛"该功能需在桌面端运行"。不引入半成品降级路径。

```
<app_data_dir>/
├── documents.json              # DocumentRecord[]
├── snippets.json               # SnippetRecord[]
└── documents/                  # 原始字节
    ├── <id>.pdf
    ├── <id>.md
    └── ...
```

注：现有 `settings.json` 走 `app_config_dir`（应用配置）；新增的两个 JSON 与文件目录走 `app_data_dir`（用户内容）。在 Windows 上两者实际是同一个 `%APPDATA%\<bundle>\` 但语义不同，便于未来分离。

**为什么不用 SQLite**：
- 项目已有的 IO 模式只有 JSON，引入第二种会让 service 层分裂；
- 桌面单用户场景下数千条 JSON 完全够用；
- service 层封装好之后，未来切到 SQLite 只换内部实现。

**容量退化风险**：
- 每次全量读写，几千条之后会慢。
- 缓解：service 层做 in-memory 缓存 + 写操作 debounce；原始字节不在 JSON 内。

## 5. 项目结构变更

★ 新增，◇ 修改，未列出的保持原样。

```
src/
├── types/
│   ├── document.ts                       ★
│   └── snippet.ts                        ★
├── models/
│   ├── document.model.ts                 ★ createDocument / kindFromExt / hashBytes
│   └── snippet.model.ts                  ★ createSnippet / 选区→anchor 工具
├── stores/
│   ├── documents.store.ts                ★ 响应式 list + import/remove/touch
│   └── snippets.store.ts                 ★ 响应式 list + add/remove/byDocument
├── services/
│   ├── documents.service.ts              ★ 封装 7 个 Tauri 命令
│   └── snippets.service.ts               ★
├── components/
│   └── documents/                        ★ 新目录
│       ├── DocumentReader.vue            # 按 kind 路由 viewer
│       ├── DocumentImportButton.vue      # 触发 dialog + 调 import_document
│       ├── DocumentEmpty.vue             # 空态提示
│       ├── viewers/
│       │   ├── PdfViewer.vue             # PDF.js
│       │   ├── TextViewer.vue            # TXT / Markdown
│       │   ├── DocxViewer.vue            # 占位
│       │   ├── XlsxViewer.vue            # 占位
│       │   └── registry.ts               # ext → ViewerComponent
│       ├── selection/
│       │   ├── SelectionHost.vue
│       │   ├── SelectionMenu.vue
│       │   └── selection-actions.ts      # action id → handler
│       └── snippets/
│           └── SnippetPanel.vue          # 片段卡片面板
├── views/
│   └── DocumentsView.vue                 ◇ 从 PlaceholderView 替换为 DocumentReader
└── data/
    └── nav-side-lists.ts                 ◇ documents 块改为"从 store 派生 groups"

src/components/layout/
└── SideList.vue                          ◇ 新增"动态 groups"注入点

src-tauri/
├── src/lib.rs                            ◇ 新增 7 个命令；注册 plugin-dialog
├── Cargo.toml                            ◇ 增加 tauri-plugin-dialog, sha2 依赖
└── capabilities/default.json             ◇ 增加 dialog:allow-open 等权限
```

## 6. Tauri 命令

7 个新命令，错误统一返回 `Result<T, String>`。

```rust
import_document(src_path: String, app: AppHandle) -> Result<DocumentRecord, String>
// 1. 读取源文件字节 → 计算 sha256
// 2. 若 documents.json 已有相同 hash，返回已有 record（前端可弹"已存在"）
// 3. 否则复制到 <app_data_dir>/documents/<id>.<ext>
// 4. 写入 documents.json，返回新 record

list_documents(app: AppHandle) -> Result<Vec<DocumentRecord>, String>
// 读取 documents.json；不存在时返回 []

read_document_bytes(id: String, app: AppHandle) -> Result<Vec<u8>, String>
// 按 id 找到 storedPath，读取并返回字节
// 注意：大 PDF 会一次性进内存；MVP 接受，二期可换成 stream

delete_document(id: String, app: AppHandle) -> Result<(), String>
// 删除磁盘文件 + JSON 条目；附带删除指向该文档的 snippet

list_snippets(app: AppHandle) -> Result<Vec<SnippetRecord>, String>
save_snippet(snippet: SnippetRecord, app: AppHandle) -> Result<SnippetRecord, String>  // upsert
delete_snippet(id: String, app: AppHandle) -> Result<(), String>
```

权限（`capabilities/default.json`）：
- 新增 `"dialog:allow-open"`（由 `@tauri-apps/plugin-dialog` 提供）。
- 文件读写均在 Rust 端进行，**不需要** `plugin-fs` 权限。

Cargo.toml 新增：
- `tauri-plugin-dialog = "2"`
- `sha2 = "0.10"`（计算 contentHash）
- `uuid = { version = "1", features = ["v4"] }`（snippet id）

`lib.rs` `run()` 中 `.plugin(tauri_plugin_dialog::init())` 注册插件。

## 7. 组件职责

### 7.1 路由 / 容器层

| 组件 | 输入 | 输出 / 职责 |
|---|---|---|
| `DocumentsView.vue` | router | 组合 `<DocumentReader>` + `<SnippetPanel>`（默认抽屉折叠） |
| `DocumentReader.vue` | `workspace.store.selectedSideListIds.documents` | 查 store 拿到 record → `registry[kind]` 选 viewer → 渲染 |
| `DocumentImportButton.vue` | — | 调 plugin-dialog → 多文件 → `documents.store.import(srcPath)` |

### 7.2 Viewers（插件式）

| 组件 | 渲染方式 | 文本可选 |
|---|---|---|
| `PdfViewer.vue` | lazy import `pdfjs-dist`；canvas + TextLayer | ✅ TextLayer DOM |
| `TextViewer.vue` | `.md` → markdown-it 渲染 HTML；`.txt` → `<pre>` | ✅ 原生 DOM |
| `DocxViewer.vue` | 占位卡片"二期支持" | — |
| `XlsxViewer.vue` | 占位卡片"二期支持" | — |
| `registry.ts` | `getViewer(kind): Component \| null` | — |

### 7.3 Selection 子系统

| 组件 / 模块 | 职责 |
|---|---|
| `SelectionHost.vue` | 包裹 viewer 的 slot；监听 `document.selectionchange`；选区落在 host 内时显示菜单 |
| `SelectionMenu.vue` | 浮动 UI；4 个按钮 emit 统一 `SelectionAction` |
| `selection-actions.ts` | `Record<ActionId, (ctx) => Promise<void> \| void>`；统一调度 |

### 7.4 Snippets 子系统

| 组件 | 职责 |
|---|---|
| `SnippetPanel.vue` | 卡片列表（按文档分组）；点击卡片 → emit `jump-to-anchor` → 当前 viewer 滚动并高亮 |

## 8. 浮动菜单交互

### 8.1 触发

- 监听 `document.selectionchange`。
- 条件：`selection.toString().trim().length > 0` 且 `selection.anchorNode` 落在 SelectionHost 内。
- 防抖：选区变化后 80ms 内仅显示一次。

### 8.2 位置算法

```
range = selection.getRangeAt(0);
rect  = range.getBoundingClientRect();
锚点  = { x: rect.left + rect.width/2, y: rect.top };
菜单显示在锚点上方 8px；
若上方空间 < 40px 则翻转到下方；
水平方向 clamp 在视口内 8px 边距。
```

### 8.3 关闭

- 点击菜单外部 → `mousedown` 命中非菜单/非选区区域。
- 选区清空（`selection.toString() === ""`）。
- ESC。
- 切换文档 / 路由离开。

### 8.4 Anchor 生成（"加入知识库"）

- **PDF**：依赖 PDF.js TextLayer 的 DOM 结构。每个 page 容器有 `data-page-number`，文本节点位于该容器内。计算选区 `charStart/charEnd` 时：
  - 找到选区所在 page；
  - 用 `Range.toString().length` 与 page 容器内的累积 offset 推得字符位置。
  - **MVP 限制：选区起止必须在同一 page**；跨页时浮动菜单的"加入知识库"按钮置灰并提示"请将选区限制在一页内"。
- **TXT/MD**：把全文挂在单一容器，`Range` 直接给到容器内 character offset。

### 8.5 跳回原文（"点片段卡片"）

- PDF：滚到目标 page → 在 TextLayer 上用临时高亮覆盖 char 区间（CSS class + 2s 衰减）。
- TXT/MD：`scrollIntoView` + 高亮 span。

## 9. SideList 集成

`nav-side-lists.ts` 当前的 `documents` 块是硬编码 demo 数据。改造为：

- `SIDE_LISTS.documents` 保留 `title / searchPlaceholder / variant`；
- `groups` 变为 **computed 函数**，从 `documents.store` 派生：
  - "最近导入"组：按 `importedAt` 倒序前 N 条；
  - "全部"组：剩余条目。
- `SideList.vue` 增加 `dynamicGroups?: SideListGroup[]` prop；documents 分支优先使用 dynamicGroups。

顶部导入按钮（"+"图标）放在 SideList header 内（具体放在 title-row 的 count 旁，还是 search-box 行末端，实现时择优；要求触发文件对话框无遮挡）。由 `<DocumentImportButton>` 渲染。

## 10. 风险与缓解

| 风险 | 缓解 |
|---|---|
| `pdfjs-dist` 体积大（~1MB） | 用动态 `import('pdfjs-dist')` 懒加载；只在打开 PDF 时拉取 |
| PDF.js worker 配置在 Tauri 中可能跑偏 | 用 `pdfjs-dist/build/pdf.worker.min.mjs` 通过 Vite `?url` 引入 |
| 大文件一次性读字节占内存 | MVP 接受；二期改为按页 stream |
| 选区 anchor 跨多 page / 跨 TextLayer 节点边界 | MVP 限制：选区起止必须在同一 page；跨页时菜单按钮置灰 + 提示 |
| documents.json 并发写冲突 | service 层用串行写队列 + atomic rename（tmp 文件 + rename） |
| 多文件导入中途失败 | 单文件原子化；导入是顺序的，单文件失败提示但不阻塞下一个 |

## 11. MVP 验收点

完成时可演示以下路径：

1. 点击文档导入按钮 → 系统文件对话框 → 选一个 PDF → 列表出现新条目 → 自动选中并打开。
2. PDF 可翻页、缩放、文本可选。
3. 选中一段文字 → 浮动菜单弹出 → 点击"加入知识库" → SnippetPanel 出现新卡片。
4. 点击卡片 → PDF 滚回到对应 page 并高亮 2 秒。
5. 浮动菜单中其余 3 个 action 点击后 toast 提示"功能待接入"。
6. 重启 app → 文档列表与片段持久化。
7. 同一路径走通 `.txt` 与 `.md`（含中文文本）。
8. 同一文件二次导入 → 提示"已存在"并定位到已有条目（不重复落盘）。

## 12. 不在范围 / 二期

- `.docx` / `.xlsx` 的真实渲染（仅留 viewer 占位）。
- 文档/片段的 **编辑** UI（重命名、删除、tag、note）。命令已就绪，UI 占位。
- 全文检索 / 跨文档搜索。
- 真实 AI、翻译、外部搜索后端接入。
- 片段与图谱节点的关联。
- 缩略图 / 阅读位置记忆 / 阅读进度。
- 移动端适配。
