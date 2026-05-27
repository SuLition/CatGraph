# CatGraph 软件设计风格指南

本文档用于约束 CatGraph 后续开发的产品体验、前端结构、Tauri 集成和代码风格。当前项目仍处在早期脚手架阶段，以下规则以现有实现为准：Tauri 2、Vue 3、TypeScript、Vite、自定义无边框窗口、Mica 透明背景和图标化标题栏。

## 1. 产品定位

CatGraph 是桌面应用，不按网页落地页设计。首屏应直接进入可操作工作区，避免营销式 Hero、说明卡片或过度装饰。

优先级：

1. 原生桌面质感：窗口、标题栏、菜单、快捷操作应接近 Windows 桌面应用习惯。
2. 高信息密度：工作区为核心，工具栏和菜单提供清晰入口，不抢占画布空间。
3. 可维护性：先使用简单、明确的 Vue 组件和 Tauri 命令边界，避免过早抽象。
4. 可验证性：每次影响 UI、构建或 Tauri 权限的改动，都要能通过本地命令验证。

## 2. 技术边界

- 前端：Vue 3 SFC，`<script setup lang="ts">`，TypeScript strict。
- 构建：Vite，开发端口固定为 `127.0.0.1:1420`，保持 `strictPort: true`。
- 桌面壳：Tauri 2，窗口由 `src-tauri/tauri.conf.json` 管理。
- Rust：Tauri 命令放在 `src-tauri/src/lib.rs` 或按模块拆分后从 `lib.rs` 汇总。
- 图标：继续使用 `@vicons/*`，优先选择语义明确的现成图标，不手写 SVG 图标。

不要引入新框架、状态库、UI 库或 CSS 方案，除非现有结构已经无法承载明确需求。

## 3. 窗口与应用框架

当前窗口配置是产品风格的一部分：

- `decorations: false`：使用自定义标题栏，不依赖系统默认边框。
- `transparent: true` 和 Mica：保持轻量、半透明、Windows 原生感。
- 默认窗口尺寸：`1200 x 800`。
- 最小窗口尺寸：`900 x 600`。

标题栏约定：

- 标题栏保留 40px 网格行，实际视觉高度约 36px。
- 左侧放应用图标、导航按钮和菜单。
- 中间保留可拖拽区域，使用 `data-tauri-drag-region`。
- 右侧放窗口控制按钮：最小化、最大化、关闭。
- 所有窗口操作必须先判断是否处于 Tauri 环境，避免 Web 预览时报错。

新增标题栏行为时，应继续通过 Tauri window API 调用，并同步更新 `src-tauri/capabilities/default.json` 的最小权限。

## 4. 视觉语言

整体方向：克制、清晰、工具型，不做花哨装饰。

基础视觉：

- 字体：保持 `"Segoe UI", Inter, ui-sans-serif, system-ui` 这一类系统优先栈。
- 字重：常规文本 400，强调标题 600。
- 字距：保持 `letter-spacing: 0`。
- 背景：外层保持透明，由 Tauri Mica 承接。
- 边框：使用低透明度边线，例如当前标题栏 `rgb(137 160 174 / 18%)`。
- 悬停：普通按钮使用浅蓝灰色，例如 `#dcebf0`。
- 关闭按钮悬停：使用明确危险色，例如当前 `#d83b36`，文字或图标为白色。

避免：

- 大面积单一渐变背景。
- 装饰性光斑、圆球、无意义插画。
- 多层卡片嵌套。
- Web 落地页式大标题占据主工作区。

## 5. 交互控件

按钮：

- 图标按钮使用固定宽高，避免 hover 时布局跳动。
- 图标按钮必须有 `aria-label`。
- 禁用态使用明确的低对比颜色，不只依赖透明度。
- 命令型按钮用动词或明确名词，不用含糊文案。

菜单：

- 顶部菜单保持短标签。
- 当前 `App.vue` 中中文菜单和 `aria-label` 出现乱码，应在后续改动中统一修正为 UTF-8 中文文本。
- 菜单只放全局命令，不放页面内容说明。

工作区：

- 主工作区应占据剩余空间，保持 `min-height: 0`，避免内部滚动布局失控。
- 空状态可以简短显示产品名或关键动作，但不要写长说明。
- 后续如果加入画布、列表、属性面板，优先采用稳定网格布局，确保窗口缩放时不重排错位。

## 6. Vue 代码风格

组件：

- 单文件组件使用 `<script setup lang="ts">`。
- 组件名用 `PascalCase.vue`。
- 事件函数用动词开头：`minimizeWindow`、`toggleMaximizeWindow`、`startDrag`。
- 纯 UI 状态优先放在组件内；跨组件共享后再抽出 composable。

模板：

- 保持语义标签：`header`、`nav`、`main`、`section`。
- 可点击元素使用 `button`，不要用 `div` 模拟按钮。
- 对图标设置 `aria-hidden="true"`，把可访问文本放在按钮 `aria-label`。

样式：

- 类名使用 kebab-case，例如 `titlebar-left`、`window-control`。
- 全局基础样式保留在 `src/style.css`。
- 组件增多后，优先把组件私有样式迁回对应 `.vue` 文件的 scoped style，避免全局 CSS 膨胀。
- 固定格式控件要设置稳定尺寸，例如标题栏按钮宽度、图标尺寸、工具按钮高度。

TypeScript：

- 不关闭 `strict`。
- 不使用 `any` 逃避类型；需要临时兼容外部对象时，写窄类型或类型守卫。
- 浏览器预览和 Tauri 运行都要可用，访问 Tauri 专有 API 前先判断环境。

## 7. Tauri 与 Rust 风格

命令边界：

- 前端只调用明确的 Tauri command，不直接假设文件系统或系统能力。
- Rust command 命名使用 snake_case，返回值可序列化。
- 前端调用层再转换为 camelCase 函数。

权限：

- `capabilities/default.json` 只添加实际需要的权限。
- 新增窗口、文件、剪贴板、对话框、shell 等能力时，必须同时说明用途。
- 不为了临时调试扩大默认权限。

错误处理：

- Rust 侧不要长期保留脚手架 `greet` 这类无业务命令。
- 可恢复错误返回 `Result<T, E>`，由前端显示用户可理解的信息。
- 不把系统路径、内部栈信息直接暴露到 UI。

## 8. 文件组织建议

当前结构适合早期开发。功能增加后建议按以下方向演进：

```text
src/
  App.vue
  main.ts
  style.css
  components/
    titlebar/
    workspace/
  composables/
  types/
src-tauri/
  src/
    lib.rs
    commands/
```

拆分规则：

- 标题栏相关组件放入 `components/titlebar/`。
- 工作区、画布、属性面板等放入 `components/workspace/`。
- Tauri window API 封装可放入 composable，例如 `useTauriWindow.ts`。
- 共享类型放 `src/types/`，不要散落在多个组件里重复定义。

## 9. 文案与本地化

- 中文 UI 文案统一使用 UTF-8。
- 文案短、直接、面向动作。
- 菜单项、按钮、空状态保持同一种语言，不混用乱码、英文占位和中文正式文案。
- 只有开发者可见的注释和错误上下文可以使用英文；用户可见界面优先中文。

## 10. 验证清单

常规改动后至少运行：

```powershell
npm run build
```

涉及 Tauri/Rust 后运行：

```powershell
cargo check --manifest-path src-tauri/Cargo.toml
```

涉及桌面窗口、权限或 Tauri API 后运行：

```powershell
npm run tauri:dev
```

人工检查：

- Web 预览不因 Tauri API 报错。
- 桌面窗口可拖拽、最小化、最大化、关闭。
- 标题栏按钮 hover 不改变布局。
- 最小窗口尺寸下文本不重叠、不溢出。
- 中文文案没有乱码。

