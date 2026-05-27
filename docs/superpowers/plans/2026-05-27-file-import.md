# 文件导入与在线阅读 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 CatGraph 中实现"从本地导入 PDF/TXT/Markdown，在应用内阅读并能在选中文本上弹出菜单加入独立片段集合"的 MVP，Word/Excel 留出占位 viewer。

**Architecture:** 方案 A——前端插件式 viewer 渲染 + Tauri 端只做文件 IO 与权限。所有元数据存 JSON（与 settings 同套路），原始字节按 id 存 `app_data_dir/documents/`。选区子系统集中在 `SelectionHost + SelectionMenu + selection-actions`，让 viewer 不感知具体动作。

**Tech Stack:** Vue 3 / Pinia / Vue Router / TypeScript / vitest + happy-dom / Tauri 2 / Rust（sha2、chrono、tauri-plugin-dialog）/ pdfjs-dist / markdown-it。

参考 spec：[docs/superpowers/specs/2026-05-27-file-import-design.md](../specs/2026-05-27-file-import-design.md)

---

## Task 1：Document 类型与模型工厂

**Files:**
- Create: `src/types/document.ts`
- Create: `src/models/document.model.ts`
- Test: `src/models/document.model.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/models/document.model.test.ts
import { describe, it, expect } from "vitest";
import { kindFromExtension, kindFromFileName, titleFromFileName } from "./document.model";

describe("kindFromExtension", () => {
  it("maps known extensions to kinds", () => {
    expect(kindFromExtension("pdf")).toBe("pdf");
    expect(kindFromExtension("PDF")).toBe("pdf");
    expect(kindFromExtension("txt")).toBe("text");
    expect(kindFromExtension("md")).toBe("markdown");
    expect(kindFromExtension("markdown")).toBe("markdown");
    expect(kindFromExtension("docx")).toBe("docx");
    expect(kindFromExtension("xlsx")).toBe("xlsx");
  });

  it("returns null for unknown extensions", () => {
    expect(kindFromExtension("png")).toBeNull();
    expect(kindFromExtension("")).toBeNull();
  });
});

describe("kindFromFileName", () => {
  it("extracts and maps extension from filename", () => {
    expect(kindFromFileName("report.PDF")).toBe("pdf");
    expect(kindFromFileName("/path/to/notes.md")).toBe("markdown");
    expect(kindFromFileName("data.xlsx")).toBe("xlsx");
  });

  it("returns null when there is no extension", () => {
    expect(kindFromFileName("README")).toBeNull();
  });
});

describe("titleFromFileName", () => {
  it("strips extension and directory parts", () => {
    expect(titleFromFileName("/Users/me/Docs/report.pdf")).toBe("report");
    expect(titleFromFileName("C:\\Docs\\notes.md")).toBe("notes");
    expect(titleFromFileName("plain.txt")).toBe("plain");
    expect(titleFromFileName("no-ext")).toBe("no-ext");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/models/document.model.test.ts
```
预期：fail，模块/导出不存在。

- [ ] **Step 3: 写类型定义**

```ts
// src/types/document.ts
export type DocumentKind = "pdf" | "markdown" | "text" | "docx" | "xlsx";

export interface DocumentRecord {
  id: string;
  title: string;
  kind: DocumentKind;
  originalName: string;
  storedPath: string;
  byteSize: number;
  contentHash: string;
  importedAt: string;
  lastOpenedAt?: string;
  tags?: string[];
}
```

- [ ] **Step 4: 写模型实现**

```ts
// src/models/document.model.ts
import type { DocumentKind } from "../types/document";

const EXTENSION_MAP: Record<string, DocumentKind> = {
  pdf: "pdf",
  md: "markdown",
  markdown: "markdown",
  txt: "text",
  text: "text",
  docx: "docx",
  xlsx: "xlsx",
};

export function kindFromExtension(ext: string): DocumentKind | null {
  const normalized = ext.replace(/^\./, "").toLowerCase();
  if (!normalized) return null;
  return EXTENSION_MAP[normalized] ?? null;
}

export function kindFromFileName(fileName: string): DocumentKind | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === fileName.length - 1) return null;
  return kindFromExtension(fileName.slice(lastDot + 1));
}

export function titleFromFileName(fileName: string): string {
  const lastSlash = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
  const base = lastSlash >= 0 ? fileName.slice(lastSlash + 1) : fileName;
  const lastDot = base.lastIndexOf(".");
  return lastDot > 0 ? base.slice(0, lastDot) : base;
}
```

- [ ] **Step 5: 跑测试确认通过**

```bash
npm run test:run -- src/models/document.model.test.ts
```
预期：3 个 describe 全 pass。

- [ ] **Step 6: 提交**

```bash
git add src/types/document.ts src/models/document.model.ts src/models/document.model.test.ts
git commit -m "feat(documents): add DocumentRecord types and filename helpers"
```

---

## Task 2：Snippet 类型与模型工厂

**Files:**
- Create: `src/types/snippet.ts`
- Create: `src/models/snippet.model.ts`
- Test: `src/models/snippet.model.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/models/snippet.model.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { createSnippet, normalizeSnippetText } from "./snippet.model";
import type { SnippetAnchor } from "../types/snippet";

afterEach(() => vi.restoreAllMocks());

const textAnchor: SnippetAnchor = {
  documentId: "doc-1",
  locator: { kind: "text", charStart: 12, charEnd: 30 },
};

describe("normalizeSnippetText", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeSnippetText("  hello\n  world  ")).toBe("hello world");
    expect(normalizeSnippetText("a\t\tb")).toBe("a b");
  });
});

describe("createSnippet", () => {
  it("fills id, createdAt, and normalizes text", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-2222-3333-4444-555555555555");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T10:00:00Z"));

    const snippet = createSnippet({ text: "  foo  bar  ", anchor: textAnchor });

    expect(snippet.id).toBe("11111111-2222-3333-4444-555555555555");
    expect(snippet.text).toBe("foo bar");
    expect(snippet.createdAt).toBe("2026-05-27T10:00:00.000Z");
    expect(snippet.anchor).toEqual(textAnchor);

    vi.useRealTimers();
  });

  it("preserves optional note when provided", () => {
    const snippet = createSnippet({ text: "x", anchor: textAnchor, note: "see p.3" });
    expect(snippet.note).toBe("see p.3");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/models/snippet.model.test.ts
```
预期：fail。

- [ ] **Step 3: 写类型**

```ts
// src/types/snippet.ts
export type SnippetLocator =
  | { kind: "pdf"; page: number; charStart: number; charEnd: number }
  | { kind: "text"; charStart: number; charEnd: number };

export interface SnippetAnchor {
  documentId: string;
  locator: SnippetLocator;
}

export interface SnippetRecord {
  id: string;
  text: string;
  anchor: SnippetAnchor;
  note?: string;
  createdAt: string;
  tags?: string[];
}
```

- [ ] **Step 4: 写模型实现**

```ts
// src/models/snippet.model.ts
import type { SnippetAnchor, SnippetRecord } from "../types/snippet";

export function normalizeSnippetText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export interface CreateSnippetInput {
  text: string;
  anchor: SnippetAnchor;
  note?: string;
  tags?: string[];
}

export function createSnippet(input: CreateSnippetInput): SnippetRecord {
  return {
    id: crypto.randomUUID(),
    text: normalizeSnippetText(input.text),
    anchor: input.anchor,
    note: input.note,
    createdAt: new Date().toISOString(),
    tags: input.tags,
  };
}
```

- [ ] **Step 5: 跑测试确认通过**

```bash
npm run test:run -- src/models/snippet.model.test.ts
```

- [ ] **Step 6: 提交**

```bash
git add src/types/snippet.ts src/models/snippet.model.ts src/models/snippet.model.test.ts
git commit -m "feat(documents): add SnippetRecord types and factory"
```

---

## Task 3：Rust 依赖与 dialog 插件接入

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/src/lib.rs`（仅注册插件，不加命令）
- Modify: `package.json`（追加前端 plugin 包）

- [ ] **Step 1: 改 Cargo.toml**

把现有 `[dependencies]` 段改为：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sha2 = "0.10"
chrono = { version = "0.4", default-features = false, features = ["clock", "serde"] }
```

- [ ] **Step 2: 改 capabilities/default.json**

`permissions` 数组追加：

```json
"dialog:default",
"dialog:allow-open"
```

最终文件示例：

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default desktop permissions for CatGraph",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-start-dragging",
    "core:window:allow-toggle-maximize",
    "core:window:allow-show",
    "dialog:default",
    "dialog:allow-open"
  ]
}
```

- [ ] **Step 3: 在 lib.rs 注册插件**

把 `run()` 改为：

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_settings,
            write_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 装前端 dialog 包**

```bash
npm install @tauri-apps/plugin-dialog
```

- [ ] **Step 5: 桌面端冒烟构建**

```bash
npm run tauri:dev
```
预期：app 正常起来（窗口出现），控制台无 "permission not allowed" 等错误。手动关闭窗口即可。

- [ ] **Step 6: 提交**

```bash
git add src-tauri/Cargo.toml src-tauri/capabilities/default.json src-tauri/src/lib.rs package.json package-lock.json
git commit -m "feat(tauri): add dialog plugin and crypto/time deps"
```

---

## Task 4：Tauri 端 documents.rs 模块（命令实现）

**Files:**
- Create: `src-tauri/src/documents.rs`
- Modify: `src-tauri/src/lib.rs`（声明模块 + 注册命令）

- [ ] **Step 1: 新建 documents.rs**

```rust
// src-tauri/src/documents.rs
use std::{fs, path::PathBuf};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentRecord {
    pub id: String,
    pub title: String,
    pub kind: String,
    pub original_name: String,
    pub stored_path: String,
    pub byte_size: u64,
    pub content_hash: String,
    pub imported_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_opened_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnippetRecord {
    pub id: String,
    pub text: String,
    pub anchor: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

fn data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app_data_dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("failed to create app data dir: {e}"))?;
    Ok(dir)
}

fn documents_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = data_root(app)?.join("documents");
    fs::create_dir_all(&dir).map_err(|e| format!("failed to create documents dir: {e}"))?;
    Ok(dir)
}

fn documents_index(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("documents.json"))
}

fn snippets_index(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("snippets.json"))
}

fn atomic_write(path: &PathBuf, content: &str) -> Result<(), String> {
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, content).map_err(|e| format!("failed to write tmp file: {e}"))?;
    fs::rename(&tmp, path).map_err(|e| format!("failed to rename tmp file: {e}"))?;
    Ok(())
}

fn load_documents(app: &AppHandle) -> Result<Vec<DocumentRecord>, String> {
    let path = documents_index(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("failed to read documents.json: {e}"))?;
    if raw.trim().is_empty() {
        return Ok(vec![]);
    }
    serde_json::from_str(&raw).map_err(|e| format!("failed to parse documents.json: {e}"))
}

fn save_documents(app: &AppHandle, list: &[DocumentRecord]) -> Result<(), String> {
    let path = documents_index(app)?;
    let text = serde_json::to_string_pretty(list)
        .map_err(|e| format!("failed to serialize documents.json: {e}"))?;
    atomic_write(&path, &format!("{text}\n"))
}

fn load_snippets(app: &AppHandle) -> Result<Vec<SnippetRecord>, String> {
    let path = snippets_index(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("failed to read snippets.json: {e}"))?;
    if raw.trim().is_empty() {
        return Ok(vec![]);
    }
    serde_json::from_str(&raw).map_err(|e| format!("failed to parse snippets.json: {e}"))
}

fn save_snippets_list(app: &AppHandle, list: &[SnippetRecord]) -> Result<(), String> {
    let path = snippets_index(app)?;
    let text = serde_json::to_string_pretty(list)
        .map_err(|e| format!("failed to serialize snippets.json: {e}"))?;
    atomic_write(&path, &format!("{text}\n"))
}

fn kind_from_ext(ext: &str) -> Option<&'static str> {
    match ext.to_lowercase().as_str() {
        "pdf" => Some("pdf"),
        "md" | "markdown" => Some("markdown"),
        "txt" | "text" => Some("text"),
        "docx" => Some("docx"),
        "xlsx" => Some("xlsx"),
        _ => None,
    }
}

#[tauri::command]
pub fn import_document(app: AppHandle, src_path: String) -> Result<DocumentRecord, String> {
    let src = PathBuf::from(&src_path);
    let bytes = fs::read(&src).map_err(|e| format!("failed to read source file: {e}"))?;

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let content_hash = format!("{:x}", hasher.finalize());
    let id = content_hash.chars().take(12).collect::<String>();

    let original_name = src
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "source path has no filename".to_string())?
        .to_string();

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .ok_or_else(|| "source file has no extension".to_string())?
        .to_string();
    let kind = kind_from_ext(&ext).ok_or_else(|| format!("unsupported extension: {ext}"))?;

    let mut docs = load_documents(&app)?;
    if let Some(existing) = docs.iter().find(|d| d.content_hash == content_hash) {
        return Ok(existing.clone());
    }

    let stored_filename = format!("{id}.{}", ext.to_lowercase());
    let dest = documents_dir(&app)?.join(&stored_filename);
    fs::write(&dest, &bytes).map_err(|e| format!("failed to copy file: {e}"))?;

    let title = src
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled")
        .to_string();

    let record = DocumentRecord {
        id,
        title,
        kind: kind.to_string(),
        original_name,
        stored_path: format!("documents/{stored_filename}"),
        byte_size: bytes.len() as u64,
        content_hash,
        imported_at: Utc::now().to_rfc3339(),
        last_opened_at: None,
        tags: None,
    };

    docs.push(record.clone());
    save_documents(&app, &docs)?;
    Ok(record)
}

#[tauri::command]
pub fn list_documents(app: AppHandle) -> Result<Vec<DocumentRecord>, String> {
    load_documents(&app)
}

#[tauri::command]
pub fn read_document_bytes(app: AppHandle, id: String) -> Result<Vec<u8>, String> {
    let docs = load_documents(&app)?;
    let doc = docs
        .iter()
        .find(|d| d.id == id)
        .ok_or_else(|| format!("document not found: {id}"))?;
    let path = data_root(&app)?.join(&doc.stored_path);
    fs::read(&path).map_err(|e| format!("failed to read document bytes: {e}"))
}

#[tauri::command]
pub fn delete_document(app: AppHandle, id: String) -> Result<(), String> {
    let mut docs = load_documents(&app)?;
    let Some(idx) = docs.iter().position(|d| d.id == id) else {
        return Ok(());
    };
    let doc = docs.remove(idx);
    let path = data_root(&app)?.join(&doc.stored_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("failed to delete file: {e}"))?;
    }
    save_documents(&app, &docs)?;

    let mut snippets = load_snippets(&app)?;
    snippets.retain(|s| s.anchor.get("documentId").and_then(|v| v.as_str()) != Some(&id));
    save_snippets_list(&app, &snippets)?;
    Ok(())
}

#[tauri::command]
pub fn list_snippets(app: AppHandle) -> Result<Vec<SnippetRecord>, String> {
    load_snippets(&app)
}

#[tauri::command]
pub fn save_snippet(app: AppHandle, snippet: SnippetRecord) -> Result<SnippetRecord, String> {
    let mut snippets = load_snippets(&app)?;
    if let Some(existing) = snippets.iter_mut().find(|s| s.id == snippet.id) {
        *existing = snippet.clone();
    } else {
        snippets.push(snippet.clone());
    }
    save_snippets_list(&app, &snippets)?;
    Ok(snippet)
}

#[tauri::command]
pub fn delete_snippet(app: AppHandle, id: String) -> Result<(), String> {
    let mut snippets = load_snippets(&app)?;
    snippets.retain(|s| s.id != id);
    save_snippets_list(&app, &snippets)?;
    Ok(())
}
```

- [ ] **Step 2: 在 lib.rs 注册模块 + 命令**

把 `lib.rs` 顶部加上模块声明，并把 `invoke_handler` 列表展开。完整新 `lib.rs`：

```rust
mod documents;

use serde_json::{json, Value};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust.")
}

fn default_settings() -> Value {
    json!({
        "version": 1,
        "appearance": {
            "theme": "system",
            "density": "comfortable",
            "accentColor": "#1a6b8a"
        },
        "workspace": {
            "defaultProjectPath": "",
            "restoreLastSession": true,
            "autoSaveIntervalMinutes": 5
        },
        "graph": {
            "showGrid": true,
            "showMinimap": true,
            "edgeAnimation": false,
            "nodeLabelMode": "full"
        },
        "data": {
            "storageFormat": "json",
            "backupOnSave": true
        }
    })
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|err| format!("failed to resolve app config directory: {err}"))?;

    fs::create_dir_all(&dir)
        .map_err(|err| format!("failed to create app config directory: {err}"))?;

    Ok(dir.join("settings.json"))
}

#[tauri::command]
fn read_settings(app: AppHandle) -> Result<Value, String> {
    let path = settings_path(&app)?;

    if !path.exists() {
        let settings = default_settings();
        let text = serde_json::to_string_pretty(&settings)
            .map_err(|err| format!("failed to serialize default settings: {err}"))?;
        fs::write(&path, format!("{text}\n"))
            .map_err(|err| format!("failed to write default settings: {err}"))?;
        return Ok(settings);
    }

    let content =
        fs::read_to_string(&path).map_err(|err| format!("failed to read settings: {err}"))?;

    serde_json::from_str(&content).map_err(|err| format!("failed to parse settings JSON: {err}"))
}

#[tauri::command]
fn write_settings(app: AppHandle, settings: Value) -> Result<Value, String> {
    let path = settings_path(&app)?;
    let text = serde_json::to_string_pretty(&settings)
        .map_err(|err| format!("failed to serialize settings: {err}"))?;

    fs::write(&path, format!("{text}\n"))
        .map_err(|err| format!("failed to write settings: {err}"))?;

    Ok(settings)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_settings,
            write_settings,
            documents::import_document,
            documents::list_documents,
            documents::read_document_bytes,
            documents::delete_document,
            documents::list_snippets,
            documents::save_snippet,
            documents::delete_snippet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: 编译冒烟**

```bash
npm run tauri:dev
```
预期：cargo 重新编译，app 起来，控制台无错误。关闭窗口。

- [ ] **Step 4: 提交**

```bash
git add src-tauri/src/documents.rs src-tauri/src/lib.rs
git commit -m "feat(tauri): add document & snippet IPC commands"
```

---

## Task 5：documents.service.ts（前端 IPC 封装）

**Files:**
- Create: `src/services/documents.service.ts`
- Test: `src/services/documents.service.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/services/documents.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

beforeEach(() => {
  invokeMock.mockReset();
  (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ = {};
});

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
});

import {
  importDocument,
  listDocuments,
  readDocumentBytes,
  deleteDocument,
} from "./documents.service";

describe("documents.service", () => {
  it("importDocument forwards srcPath", async () => {
    const record = { id: "abc", title: "x", kind: "pdf" };
    invokeMock.mockResolvedValueOnce(record);

    const result = await importDocument("/path/to/file.pdf");

    expect(invokeMock).toHaveBeenCalledWith("import_document", { srcPath: "/path/to/file.pdf" });
    expect(result).toEqual(record);
  });

  it("listDocuments returns empty array on first run", async () => {
    invokeMock.mockResolvedValueOnce([]);
    expect(await listDocuments()).toEqual([]);
  });

  it("readDocumentBytes converts number array to Uint8Array", async () => {
    invokeMock.mockResolvedValueOnce([72, 101, 108, 108, 111]);
    const bytes = await readDocumentBytes("doc-1");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });

  it("deleteDocument forwards id", async () => {
    invokeMock.mockResolvedValueOnce(null);
    await deleteDocument("doc-1");
    expect(invokeMock).toHaveBeenCalledWith("delete_document", { id: "doc-1" });
  });

  it("throws in non-Tauri runtime", async () => {
    delete (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
    await expect(importDocument("x")).rejects.toThrow(/desktop/i);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/services/documents.service.test.ts
```

- [ ] **Step 3: 写 service**

```ts
// src/services/documents.service.ts
import { invoke } from "@tauri-apps/api/core";
import type { DocumentRecord } from "../types/document";

function ensureTauri() {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("文档功能需在桌面端运行 (Tauri runtime required)");
  }
}

export async function importDocument(srcPath: string): Promise<DocumentRecord> {
  ensureTauri();
  return invoke<DocumentRecord>("import_document", { srcPath });
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  ensureTauri();
  return invoke<DocumentRecord[]>("list_documents");
}

export async function readDocumentBytes(id: string): Promise<Uint8Array> {
  ensureTauri();
  const raw = await invoke<number[]>("read_document_bytes", { id });
  return new Uint8Array(raw);
}

export async function deleteDocument(id: string): Promise<void> {
  ensureTauri();
  await invoke<void>("delete_document", { id });
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm run test:run -- src/services/documents.service.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/services/documents.service.ts src/services/documents.service.test.ts
git commit -m "feat(documents): add documents.service frontend wrapper"
```

---

## Task 6：snippets.service.ts

**Files:**
- Create: `src/services/snippets.service.ts`
- Test: `src/services/snippets.service.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/services/snippets.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

beforeEach(() => {
  invokeMock.mockReset();
  (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ = {};
});

afterEach(() => {
  delete (window as unknown as { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__;
});

import { listSnippets, saveSnippet, deleteSnippet } from "./snippets.service";
import type { SnippetRecord } from "../types/snippet";

const exampleSnippet: SnippetRecord = {
  id: "s-1",
  text: "hello",
  anchor: { documentId: "d-1", locator: { kind: "text", charStart: 0, charEnd: 5 } },
  createdAt: "2026-05-27T10:00:00.000Z",
};

describe("snippets.service", () => {
  it("listSnippets returns array", async () => {
    invokeMock.mockResolvedValueOnce([exampleSnippet]);
    expect(await listSnippets()).toEqual([exampleSnippet]);
  });

  it("saveSnippet forwards snippet payload", async () => {
    invokeMock.mockResolvedValueOnce(exampleSnippet);
    await saveSnippet(exampleSnippet);
    expect(invokeMock).toHaveBeenCalledWith("save_snippet", { snippet: exampleSnippet });
  });

  it("deleteSnippet forwards id", async () => {
    invokeMock.mockResolvedValueOnce(null);
    await deleteSnippet("s-1");
    expect(invokeMock).toHaveBeenCalledWith("delete_snippet", { id: "s-1" });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/services/snippets.service.test.ts
```

- [ ] **Step 3: 写 service**

```ts
// src/services/snippets.service.ts
import { invoke } from "@tauri-apps/api/core";
import type { SnippetRecord } from "../types/snippet";

function ensureTauri() {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("文档功能需在桌面端运行 (Tauri runtime required)");
  }
}

export async function listSnippets(): Promise<SnippetRecord[]> {
  ensureTauri();
  return invoke<SnippetRecord[]>("list_snippets");
}

export async function saveSnippet(snippet: SnippetRecord): Promise<SnippetRecord> {
  ensureTauri();
  return invoke<SnippetRecord>("save_snippet", { snippet });
}

export async function deleteSnippet(id: string): Promise<void> {
  ensureTauri();
  await invoke<void>("delete_snippet", { id });
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm run test:run -- src/services/snippets.service.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/services/snippets.service.ts src/services/snippets.service.test.ts
git commit -m "feat(documents): add snippets.service frontend wrapper"
```

---

## Task 7：documents.store.ts（Pinia store）

**Files:**
- Create: `src/stores/documents.store.ts`
- Test: `src/stores/documents.store.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/stores/documents.store.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("../services/documents.service", () => ({
  listDocuments: vi.fn(),
  importDocument: vi.fn(),
  deleteDocument: vi.fn(),
  readDocumentBytes: vi.fn(),
}));

import * as svc from "../services/documents.service";
import { useDocumentsStore } from "./documents.store";

const sample = (id: string) => ({
  id,
  title: `t-${id}`,
  kind: "pdf" as const,
  originalName: `${id}.pdf`,
  storedPath: `documents/${id}.pdf`,
  byteSize: 10,
  contentHash: `hash-${id}`,
  importedAt: "2026-05-27T10:00:00Z",
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(svc.listDocuments).mockReset();
  vi.mocked(svc.importDocument).mockReset();
  vi.mocked(svc.deleteDocument).mockReset();
});

describe("documents.store", () => {
  it("loads documents into reactive list", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a"), sample("b")]);
    const store = useDocumentsStore();
    await store.load();
    expect(store.documents).toHaveLength(2);
    expect(store.byId("a")?.title).toBe("t-a");
  });

  it("import appends to list and returns record", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([]);
    vi.mocked(svc.importDocument).mockResolvedValueOnce(sample("c"));
    const store = useDocumentsStore();
    await store.load();
    const rec = await store.importFromPath("/path/c.pdf");
    expect(rec.id).toBe("c");
    expect(store.documents).toHaveLength(1);
  });

  it("import skips duplicate when id already present", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a")]);
    vi.mocked(svc.importDocument).mockResolvedValueOnce(sample("a"));
    const store = useDocumentsStore();
    await store.load();
    await store.importFromPath("/path/a.pdf");
    expect(store.documents).toHaveLength(1);
  });

  it("remove deletes record by id", async () => {
    vi.mocked(svc.listDocuments).mockResolvedValueOnce([sample("a"), sample("b")]);
    vi.mocked(svc.deleteDocument).mockResolvedValueOnce(undefined);
    const store = useDocumentsStore();
    await store.load();
    await store.remove("a");
    expect(store.documents.map((d) => d.id)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/stores/documents.store.test.ts
```

- [ ] **Step 3: 写 store**

```ts
// src/stores/documents.store.ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  deleteDocument,
  importDocument,
  listDocuments,
  readDocumentBytes,
} from "../services/documents.service";
import type { DocumentRecord } from "../types/document";

export const useDocumentsStore = defineStore("documents", () => {
  const documents = ref<DocumentRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    isLoading.value = true;
    error.value = null;
    try {
      documents.value = await listDocuments();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function importFromPath(srcPath: string): Promise<DocumentRecord> {
    const record = await importDocument(srcPath);
    const existing = documents.value.findIndex((d) => d.id === record.id);
    if (existing >= 0) {
      documents.value[existing] = record;
    } else {
      documents.value.push(record);
    }
    return record;
  }

  async function remove(id: string) {
    await deleteDocument(id);
    documents.value = documents.value.filter((d) => d.id !== id);
  }

  async function readBytes(id: string): Promise<Uint8Array> {
    return readDocumentBytes(id);
  }

  function byId(id: string): DocumentRecord | undefined {
    return documents.value.find((d) => d.id === id);
  }

  const recent = computed(() =>
    [...documents.value].sort((a, b) => (a.importedAt < b.importedAt ? 1 : -1)),
  );

  return {
    documents,
    isLoading,
    error,
    recent,
    load,
    importFromPath,
    remove,
    readBytes,
    byId,
  };
});
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm run test:run -- src/stores/documents.store.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/stores/documents.store.ts src/stores/documents.store.test.ts
git commit -m "feat(documents): add documents Pinia store"
```

---

## Task 8：snippets.store.ts

**Files:**
- Create: `src/stores/snippets.store.ts`
- Test: `src/stores/snippets.store.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/stores/snippets.store.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

vi.mock("../services/snippets.service", () => ({
  listSnippets: vi.fn(),
  saveSnippet: vi.fn(),
  deleteSnippet: vi.fn(),
}));

import * as svc from "../services/snippets.service";
import { useSnippetsStore } from "./snippets.store";
import type { SnippetRecord } from "../types/snippet";

const makeSnippet = (id: string, docId = "d-1"): SnippetRecord => ({
  id,
  text: `text-${id}`,
  anchor: { documentId: docId, locator: { kind: "text", charStart: 0, charEnd: 1 } },
  createdAt: "2026-05-27T10:00:00Z",
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(svc.listSnippets).mockReset();
  vi.mocked(svc.saveSnippet).mockReset();
  vi.mocked(svc.deleteSnippet).mockReset();
});

describe("snippets.store", () => {
  it("loads list", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([makeSnippet("a")]);
    const store = useSnippetsStore();
    await store.load();
    expect(store.snippets).toHaveLength(1);
  });

  it("add appends and persists", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([]);
    const next = makeSnippet("b");
    vi.mocked(svc.saveSnippet).mockResolvedValueOnce(next);
    const store = useSnippetsStore();
    await store.load();
    await store.add(next);
    expect(svc.saveSnippet).toHaveBeenCalledWith(next);
    expect(store.snippets).toHaveLength(1);
  });

  it("byDocument filters by anchor.documentId", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([
      makeSnippet("a", "d-1"),
      makeSnippet("b", "d-2"),
      makeSnippet("c", "d-1"),
    ]);
    const store = useSnippetsStore();
    await store.load();
    expect(store.byDocument("d-1").map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("remove drops by id", async () => {
    vi.mocked(svc.listSnippets).mockResolvedValueOnce([makeSnippet("a"), makeSnippet("b")]);
    vi.mocked(svc.deleteSnippet).mockResolvedValueOnce(undefined);
    const store = useSnippetsStore();
    await store.load();
    await store.remove("a");
    expect(store.snippets.map((s) => s.id)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/stores/snippets.store.test.ts
```

- [ ] **Step 3: 写 store**

```ts
// src/stores/snippets.store.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { deleteSnippet, listSnippets, saveSnippet } from "../services/snippets.service";
import type { SnippetRecord } from "../types/snippet";

export const useSnippetsStore = defineStore("snippets", () => {
  const snippets = ref<SnippetRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    isLoading.value = true;
    error.value = null;
    try {
      snippets.value = await listSnippets();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function add(snippet: SnippetRecord) {
    const saved = await saveSnippet(snippet);
    const idx = snippets.value.findIndex((s) => s.id === saved.id);
    if (idx >= 0) snippets.value[idx] = saved;
    else snippets.value.push(saved);
  }

  async function remove(id: string) {
    await deleteSnippet(id);
    snippets.value = snippets.value.filter((s) => s.id !== id);
  }

  function byDocument(documentId: string): SnippetRecord[] {
    return snippets.value.filter((s) => s.anchor.documentId === documentId);
  }

  return { snippets, isLoading, error, load, add, remove, byDocument };
});
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm run test:run -- src/stores/snippets.store.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/stores/snippets.store.ts src/stores/snippets.store.test.ts
git commit -m "feat(documents): add snippets Pinia store"
```

---

## Task 9：SideList 动态 groups 支持 + nav-side-lists 改为派生

**Files:**
- Modify: `src/data/nav-side-lists.ts`
- Modify: `src/components/layout/SideList.vue`

- [ ] **Step 1: 改 nav-side-lists.ts —— documents 的 groups 改空**

把 `SIDE_LISTS.documents.groups` 替换为空数组（占位），保留 title/searchPlaceholder/variant：

```ts
documents: {
  title: "文档",
  searchPlaceholder: "搜索文档、导入记录、附件…",
  variant: "document",
  groups: [],
},
```

并在文件末尾追加：

```ts
import type { DocumentRecord } from "../types/document";

export function documentsToSideListGroups(documents: DocumentRecord[]): SideListGroup[] {
  if (documents.length === 0) return [];
  const sorted = [...documents].sort((a, b) => (a.importedAt < b.importedAt ? 1 : -1));
  const recent = sorted.slice(0, 5);
  const rest = sorted.slice(5);

  const toItem = (d: DocumentRecord): SideListItem => ({
    id: d.id,
    label: d.title,
    code: d.originalName,
    meta: new Date(d.importedAt).toLocaleString(),
    badge: d.kind.toUpperCase(),
    tone: d.kind === "pdf" ? "info" : d.kind === "markdown" ? "muted" : "success",
  });

  const groups: SideListGroup[] = [
    { title: "最近导入", items: recent.map(toItem) },
  ];
  if (rest.length > 0) {
    groups.push({ title: "全部", items: rest.map(toItem) });
  }
  return groups;
}
```

- [ ] **Step 2: 改 SideList.vue — 新增 dynamicGroups prop + header 右侧 slot**

把 `defineProps` 替换为：

```ts
const props = defineProps<{
  navId: NavId;
  selectedId: string;
  dynamicGroups?: import("../../data/nav-side-lists").SideListGroup[];
}>();
```

并把 `config.groups` 的使用点替换为派生计算，保证 dynamicGroups 优先：

```ts
const groups = computed(() => props.dynamicGroups ?? config.value.groups);
const totalCount = computed(() =>
  groups.value.reduce((sum, group) => sum + group.items.length, 0),
);
```

模板里把 `v-for="group in config.groups"` 替换为 `v-for="group in groups"`，并在 `<header class="side-list-header">` 内 `header-row` 之内的 `side-list-count` 旁追加一个具名 slot：

```vue
<div class="header-row">
  <h2 class="side-list-title">{{ config.title }}</h2>
  <div class="header-trailing">
    <slot name="header-trailing" />
    <span class="side-list-count">{{ totalCount }} 项</span>
  </div>
</div>
```

style 块追加：

```css
.header-trailing {
  display: flex;
  align-items: center;
  gap: 6px;
}
```

- [ ] **Step 3: 编译确认 + 启动 dev 确认 SideList 在其他视图未回归**

```bash
npm run typecheck
npm run dev
```
预期：typecheck 通过；浏览器（127.0.0.1:1420）打开后 documents 之外的导航项侧栏显示正常（实验、变量等仍能看到 demo 数据）。documents 项会显示空列表（"0 项"），这是预期的。Ctrl+C 关闭 dev server。

- [ ] **Step 4: 提交**

```bash
git add src/data/nav-side-lists.ts src/components/layout/SideList.vue
git commit -m "feat(documents): support dynamic groups in SideList"
```

---

## Task 10：viewers/registry.ts + 占位 viewer 组件

**Files:**
- Create: `src/components/documents/viewers/registry.ts`
- Create: `src/components/documents/viewers/DocxViewer.vue`
- Create: `src/components/documents/viewers/XlsxViewer.vue`
- Test: `src/components/documents/viewers/registry.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/components/documents/viewers/registry.test.ts
import { describe, it, expect } from "vitest";
import { getViewer } from "./registry";

describe("viewers registry", () => {
  it("returns a component for each supported kind", () => {
    expect(getViewer("pdf")).toBeDefined();
    expect(getViewer("text")).toBeDefined();
    expect(getViewer("markdown")).toBeDefined();
    expect(getViewer("docx")).toBeDefined();
    expect(getViewer("xlsx")).toBeDefined();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/components/documents/viewers/registry.test.ts
```

- [ ] **Step 3: 写占位 viewer 组件**

```vue
<!-- src/components/documents/viewers/DocxViewer.vue -->
<script setup lang="ts">
defineProps<{ documentId: string }>();
</script>

<template>
  <div class="viewer-placeholder">
    <p class="placeholder-title">Word 文档</p>
    <p class="placeholder-desc">.docx 渲染将在二期支持。</p>
  </div>
</template>

<style scoped>
.viewer-placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px;
  color: var(--muted-text-color);
}
.placeholder-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
.placeholder-desc {
  font-size: 12px;
  margin: 0;
}
</style>
```

```vue
<!-- src/components/documents/viewers/XlsxViewer.vue -->
<script setup lang="ts">
defineProps<{ documentId: string }>();
</script>

<template>
  <div class="viewer-placeholder">
    <p class="placeholder-title">Excel 表格</p>
    <p class="placeholder-desc">.xlsx 渲染将在二期支持。</p>
  </div>
</template>

<style scoped>
.viewer-placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px;
  color: var(--muted-text-color);
}
.placeholder-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
.placeholder-desc {
  font-size: 12px;
  margin: 0;
}
</style>
```

- [ ] **Step 4: 写 registry**

PDF 和 Text 的真实组件还没写，先用 `defineAsyncComponent` 引入，组件文件在 Task 11/12 创建后即可使用；为了让 registry 测试通过，先写一个最小 PdfViewer/TextViewer stub。

新建两个 stub 文件：

```vue
<!-- src/components/documents/viewers/PdfViewer.vue -->
<script setup lang="ts">
defineProps<{ documentId: string }>();
</script>

<template>
  <div class="viewer-stub">PDF viewer (待实现)</div>
</template>
```

```vue
<!-- src/components/documents/viewers/TextViewer.vue -->
<script setup lang="ts">
defineProps<{ documentId: string }>();
</script>

<template>
  <div class="viewer-stub">Text viewer (待实现)</div>
</template>
```

`registry.ts`：

```ts
// src/components/documents/viewers/registry.ts
import { defineAsyncComponent, type Component } from "vue";
import type { DocumentKind } from "../../../types/document";

const VIEWERS: Record<DocumentKind, Component> = {
  pdf: defineAsyncComponent(() => import("./PdfViewer.vue")),
  text: defineAsyncComponent(() => import("./TextViewer.vue")),
  markdown: defineAsyncComponent(() => import("./TextViewer.vue")),
  docx: defineAsyncComponent(() => import("./DocxViewer.vue")),
  xlsx: defineAsyncComponent(() => import("./XlsxViewer.vue")),
};

export function getViewer(kind: DocumentKind): Component | undefined {
  return VIEWERS[kind];
}
```

- [ ] **Step 5: 跑测试确认通过**

```bash
npm run test:run -- src/components/documents/viewers/registry.test.ts
```

- [ ] **Step 6: 提交**

```bash
git add src/components/documents/viewers
git commit -m "feat(documents): scaffold viewer registry with placeholders"
```

---

## Task 11：TextViewer.vue（TXT / Markdown）

**Files:**
- Modify: `src/components/documents/viewers/TextViewer.vue`
- Modify: `package.json`（增加 `markdown-it`）

- [ ] **Step 1: 装包**

```bash
npm install markdown-it
npm install -D @types/markdown-it
```

- [ ] **Step 2: 写组件**

替换 stub 内容：

```vue
<!-- src/components/documents/viewers/TextViewer.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import MarkdownIt from "markdown-it";
import { useDocumentsStore } from "../../../stores/documents.store";

const props = defineProps<{ documentId: string }>();

const documents = useDocumentsStore();
const html = ref("");
const plain = ref("");
const error = ref<string | null>(null);
const isLoading = ref(true);

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

async function load() {
  isLoading.value = true;
  error.value = null;
  html.value = "";
  plain.value = "";
  try {
    const record = documents.byId(props.documentId);
    if (!record) throw new Error(`document not found: ${props.documentId}`);
    const bytes = await documents.readBytes(props.documentId);
    const text = new TextDecoder("utf-8").decode(bytes);
    if (record.kind === "markdown") {
      html.value = md.render(text);
    } else {
      plain.value = text;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
watch(() => props.documentId, load);
</script>

<template>
  <div class="text-viewer">
    <p v-if="isLoading" class="text-state">读取中…</p>
    <p v-else-if="error" class="text-state error">{{ error }}</p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <article v-else-if="html" class="markdown-body" v-html="html" />
    <pre v-else class="plain-text">{{ plain }}</pre>
  </div>
</template>

<style scoped>
.text-viewer {
  height: 100%;
  overflow-y: auto;
  padding: 24px 32px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-color);
}
.text-state {
  color: var(--muted-text-color);
  font-size: 13px;
}
.text-state.error {
  color: var(--accent-warning, #d44747);
}
.markdown-body :deep(h1) {
  font-size: 22px;
  margin: 0.6em 0;
}
.markdown-body :deep(h2) {
  font-size: 18px;
  margin: 0.6em 0;
}
.markdown-body :deep(p) {
  margin: 0.6em 0;
}
.markdown-body :deep(pre) {
  background: rgb(0 0 0 / 5%);
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
}
.markdown-body :deep(code) {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.plain-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
</style>
```

- [ ] **Step 3: typecheck**

```bash
npm run typecheck
```
预期：通过。

- [ ] **Step 4: 提交**

```bash
git add src/components/documents/viewers/TextViewer.vue package.json package-lock.json
git commit -m "feat(documents): implement TextViewer for txt/markdown"
```

---

## Task 12：DocumentEmpty.vue + DocumentImportButton.vue

**Files:**
- Create: `src/components/documents/DocumentEmpty.vue`
- Create: `src/components/documents/DocumentImportButton.vue`

- [ ] **Step 1: 写空态组件**

```vue
<!-- src/components/documents/DocumentEmpty.vue -->
<script setup lang="ts">
defineProps<{ hasDocuments: boolean }>();
</script>

<template>
  <div class="empty">
    <p v-if="hasDocuments" class="empty-title">未选择文档</p>
    <p v-else class="empty-title">还没有文档</p>
    <p class="empty-desc">
      <template v-if="hasDocuments">从左侧列表选择一个文档开始阅读。</template>
      <template v-else>点击侧栏右上角的 + 按钮导入 PDF、Markdown 或 TXT 文档。</template>
    </p>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--muted-text-color);
  padding: 48px;
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.empty-desc {
  font-size: 12px;
  margin: 0;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
}
</style>
```

- [ ] **Step 2: 写导入按钮**

```vue
<!-- src/components/documents/DocumentImportButton.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { Add20Regular } from "@vicons/fluent";
import { useDocumentsStore } from "../../stores/documents.store";

const emit = defineEmits<{
  (e: "imported", id: string): void;
}>();

const documents = useDocumentsStore();
const isWorking = ref(false);
const error = ref<string | null>(null);

async function handleClick() {
  if (isWorking.value) return;
  error.value = null;
  try {
    const picked = await open({
      multiple: true,
      filters: [
        { name: "支持的文档", extensions: ["pdf", "md", "markdown", "txt"] },
        { name: "所有文件", extensions: ["*"] },
      ],
    });
    if (!picked) return;
    const paths = Array.isArray(picked) ? picked : [picked];
    isWorking.value = true;
    let lastId: string | null = null;
    for (const p of paths) {
      const rec = await documents.importFromPath(p);
      lastId = rec.id;
    }
    if (lastId) emit("imported", lastId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isWorking.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="import-button"
    :disabled="isWorking"
    :title="error ?? '导入文档'"
    @click="handleClick"
  >
    <Add20Regular class="icon" aria-hidden="true" />
  </button>
</template>

<style scoped>
.import-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 4px;
  background: rgb(255 255 255 / 50%);
  color: var(--muted-text-color);
  cursor: pointer;
}
.import-button:hover:not(:disabled) {
  background: var(--hover-color);
  color: var(--text-color);
}
.import-button:disabled {
  opacity: 0.5;
  cursor: progress;
}
.icon {
  width: 14px;
  height: 14px;
}
</style>
```

- [ ] **Step 3: typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: 提交**

```bash
git add src/components/documents/DocumentEmpty.vue src/components/documents/DocumentImportButton.vue
git commit -m "feat(documents): add empty state and import button"
```

---

## Task 13：DocumentReader.vue（容器：按 kind 选 viewer）

**Files:**
- Create: `src/components/documents/DocumentReader.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/components/documents/DocumentReader.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useDocumentsStore } from "../../stores/documents.store";
import { getViewer } from "./viewers/registry";
import DocumentEmpty from "./DocumentEmpty.vue";

const props = defineProps<{ documentId: string | null }>();

const documents = useDocumentsStore();
const record = computed(() => (props.documentId ? documents.byId(props.documentId) : null));
const viewer = computed(() => (record.value ? getViewer(record.value.kind) : null));
</script>

<template>
  <div class="reader">
    <header v-if="record" class="reader-header">
      <h1 class="reader-title">{{ record.title }}</h1>
      <div class="reader-meta">
        <span class="kind-chip">{{ record.kind.toUpperCase() }}</span>
        <span class="meta-text">{{ record.originalName }}</span>
      </div>
    </header>
    <main class="reader-body">
      <component
        :is="viewer"
        v-if="record && viewer"
        :key="record.id"
        :document-id="record.id"
      />
      <DocumentEmpty v-else :has-documents="documents.documents.length > 0" />
    </main>
  </div>
</template>

<style scoped>
.reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.reader-header {
  flex: 0 0 auto;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border-color);
  background: rgb(255 255 255 / 35%);
}
.reader-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}
.reader-meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--subtle-text-color);
}
.kind-chip {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--accent-color) 14%, transparent);
  color: var(--accent-color);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.meta-text {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.reader-body {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
```

- [ ] **Step 2: typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/components/documents/DocumentReader.vue
git commit -m "feat(documents): add DocumentReader container"
```

---

## Task 14：把 DocumentsView 接通（首个 end-to-end 演示点）

**Files:**
- Modify: `src/views/DocumentsView.vue`
- Modify: `src/main.ts`（如果还没在启动时 load documents/snippets）
- Modify: `src/App.vue`（SideList 注入 dynamicGroups + header-trailing slot；此处 surgically 修改）

- [ ] **Step 1: 改 DocumentsView**

```vue
<!-- src/views/DocumentsView.vue -->
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDocumentsStore } from "../stores/documents.store";
import { useWorkspaceStore } from "../stores/workspace.store";
import DocumentReader from "../components/documents/DocumentReader.vue";

const documents = useDocumentsStore();
const workspace = useWorkspaceStore();

onMounted(() => {
  if (documents.documents.length === 0) {
    void documents.load();
  }
});

const selectedId = computed(() => {
  const id = workspace.selectedSideListIds.documents;
  if (!id) return null;
  return documents.byId(id) ? id : null;
});
</script>

<template>
  <DocumentReader :document-id="selectedId" />
</template>
```

- [ ] **Step 2: 在 App.vue 注入 dynamicGroups + 顶部导入按钮**

定位现有 SideList 使用点（`<SideList :nav-id="..." :selected-id="..." @select="..." />`），替换为：

```vue
<SideList
  :nav-id="workspace.activeNavId"
  :selected-id="selectedSideListId"
  :dynamic-groups="documentSideListGroups"
  @select="handleSideListSelect"
>
  <template v-if="workspace.activeNavId === 'documents'" #header-trailing>
    <DocumentImportButton @imported="handleDocumentImported" />
  </template>
</SideList>
```

在 `<script setup lang="ts">` 段顶部追加：

```ts
import { computed, onMounted } from "vue";
import DocumentImportButton from "./components/documents/DocumentImportButton.vue";
import { useDocumentsStore } from "./stores/documents.store";
import { useSnippetsStore } from "./stores/snippets.store";
import { documentsToSideListGroups } from "./data/nav-side-lists";

const documents = useDocumentsStore();
const snippets = useSnippetsStore();

onMounted(() => {
  void documents.load();
  void snippets.load();
});

const documentSideListGroups = computed(() =>
  workspace.activeNavId === "documents" ? documentsToSideListGroups(documents.documents) : undefined,
);

function handleDocumentImported(id: string) {
  workspace.selectedSideListIds.documents = id;
}
```

> 若 App.vue 已有 `workspace`、`selectedSideListId`、`handleSideListSelect` 等本地变量，仅追加上述内容并 surgically 改 SideList 那一处即可，不要重写整个文件。

- [ ] **Step 3: 桌面端冒烟**

```bash
npm run tauri:dev
```

手动验证清单：
1. 启动后切到"文档"导航，侧栏标题旁出现 + 按钮，列表为空。
2. 点 + 选一个本地 .txt 或 .md → 列表新增一条，自动选中并显示内容。
3. 关闭 app 重新打开，文档仍然在列表里。
4. 切到"实验"/"变量"等导航，原有 demo 数据展示正常（无回归）。

预期：以上 4 点全部满足。

- [ ] **Step 4: 提交**

```bash
git add src/views/DocumentsView.vue src/App.vue
git commit -m "feat(documents): wire DocumentsView end-to-end for txt/md"
```

---

## Task 15：PdfViewer.vue（PDF.js 渲染 + 文本层）

**Files:**
- Modify: `src/components/documents/viewers/PdfViewer.vue`
- Modify: `package.json`（增加 `pdfjs-dist`）
- Modify: `vite.config.ts`（如有需要为 worker 添加 optimizeDeps，按需）

- [ ] **Step 1: 装包**

```bash
npm install pdfjs-dist
```

- [ ] **Step 2: 实现 PdfViewer**

```vue
<!-- src/components/documents/viewers/PdfViewer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from "vue";
import { useDocumentsStore } from "../../../stores/documents.store";

const props = defineProps<{ documentId: string }>();

const container = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const scale = ref(1.25);
const totalPages = ref(0);

const documents = useDocumentsStore();
const pdfDocRef = shallowRef<unknown>(null); // PDFDocumentProxy

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function ensurePdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  lib.GlobalWorkerOptions.workerSrc = workerUrl;
  pdfjsLib = lib;
  return lib;
}

async function loadAndRender() {
  isLoading.value = true;
  error.value = null;
  try {
    const lib = await ensurePdfjs();
    const bytes = await documents.readBytes(props.documentId);
    const doc = await lib.getDocument({ data: bytes }).promise;
    pdfDocRef.value = doc;
    totalPages.value = doc.numPages;
    await renderAllPages(lib, doc);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isLoading.value = false;
  }
}

async function renderAllPages(lib: typeof import("pdfjs-dist"), doc: any) {
  if (!container.value) return;
  container.value.innerHTML = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale.value });

    const pageDiv = document.createElement("div");
    pageDiv.className = "pdf-page";
    pageDiv.dataset.pageNumber = String(pageNum);
    pageDiv.style.position = "relative";
    pageDiv.style.width = `${viewport.width}px`;
    pageDiv.style.height = `${viewport.height}px`;
    container.value.appendChild(pageDiv);

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pageDiv.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法获取 canvas 上下文");
    await page.render({ canvasContext: ctx, viewport }).promise;

    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "pdf-text-layer";
    textLayerDiv.style.position = "absolute";
    textLayerDiv.style.inset = "0";
    textLayerDiv.style.overflow = "hidden";
    textLayerDiv.style.lineHeight = "1";
    pageDiv.appendChild(textLayerDiv);

    const textContent = await page.getTextContent();
    await lib
      .renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      })
      .promise;
  }
}

function zoomIn() {
  scale.value = Math.min(3, scale.value + 0.25);
}
function zoomOut() {
  scale.value = Math.max(0.5, scale.value - 0.25);
}

onMounted(loadAndRender);
watch(() => props.documentId, loadAndRender);
watch(scale, async () => {
  const lib = await ensurePdfjs();
  if (pdfDocRef.value) await renderAllPages(lib, pdfDocRef.value);
});

onBeforeUnmount(() => {
  const doc = pdfDocRef.value as { destroy?: () => void } | null;
  doc?.destroy?.();
  pdfDocRef.value = null;
});
</script>

<template>
  <div class="pdf-viewer">
    <div class="pdf-toolbar">
      <button type="button" @click="zoomOut" :disabled="isLoading">−</button>
      <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
      <button type="button" @click="zoomIn" :disabled="isLoading">+</button>
      <span class="page-info" v-if="totalPages > 0">{{ totalPages }} 页</span>
    </div>
    <p v-if="isLoading" class="state">加载 PDF…</p>
    <p v-else-if="error" class="state error">{{ error }}</p>
    <div ref="container" class="pdf-pages" :class="{ hidden: isLoading || error }" />
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.pdf-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  background: rgb(255 255 255 / 35%);
  font-size: 12px;
  color: var(--muted-text-color);
}
.pdf-toolbar button {
  width: 22px;
  height: 22px;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 4px;
  background: rgb(255 255 255 / 50%);
  cursor: pointer;
}
.pdf-toolbar button:disabled {
  opacity: 0.4;
  cursor: progress;
}
.zoom-label {
  min-width: 40px;
  text-align: center;
}
.page-info {
  margin-left: auto;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.state {
  padding: 24px;
  color: var(--muted-text-color);
}
.state.error {
  color: #d44747;
}
.pdf-pages {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgb(0 0 0 / 4%);
}
.pdf-pages.hidden {
  display: none;
}
:deep(.pdf-page) {
  box-shadow: 0 2px 12px rgb(0 0 0 / 10%);
  background: #fff;
}
:deep(.pdf-text-layer) {
  color: transparent;
}
:deep(.pdf-text-layer ::selection) {
  background: color-mix(in srgb, var(--accent-color) 35%, transparent);
}
:deep(.pdf-text-layer span) {
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
</style>
```

- [ ] **Step 3: 桌面端冒烟**

```bash
npm run tauri:dev
```

手动验证：
1. 导入一个 PDF。
2. 内容渲染、可缩放、文本可框选。
3. 翻页通过滚动实现（所有页一次性渲染，MVP 接受）。

- [ ] **Step 4: 提交**

```bash
git add src/components/documents/viewers/PdfViewer.vue package.json package-lock.json
git commit -m "feat(documents): implement PdfViewer with text layer"
```

---

## Task 16：SelectionMenu.vue（浮动菜单 UI）

**Files:**
- Create: `src/components/documents/selection/SelectionMenu.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/components/documents/selection/SelectionMenu.vue -->
<script setup lang="ts">
export interface SelectionMenuAction {
  id: "add-to-snippets" | "ask-ai" | "translate" | "search";
  label: string;
}

const props = defineProps<{
  position: { x: number; y: number };
  disabledActions?: SelectionMenuAction["id"][];
}>();

const emit = defineEmits<{
  (e: "action", id: SelectionMenuAction["id"]): void;
}>();

const ACTIONS: SelectionMenuAction[] = [
  { id: "add-to-snippets", label: "加入知识库" },
  { id: "ask-ai", label: "询问 AI" },
  { id: "translate", label: "翻译" },
  { id: "search", label: "搜索" },
];

function isDisabled(id: SelectionMenuAction["id"]): boolean {
  return props.disabledActions?.includes(id) ?? false;
}
</script>

<template>
  <div
    class="selection-menu"
    role="menu"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @mousedown.stop
  >
    <button
      v-for="action in ACTIONS"
      :key="action.id"
      type="button"
      role="menuitem"
      class="menu-item"
      :disabled="isDisabled(action.id)"
      :title="isDisabled(action.id) ? '选区跨越多页，请缩小到一页内' : undefined"
      @click="emit('action', action.id)"
    >
      {{ action.label }}
    </button>
  </div>
</template>

<style scoped>
.selection-menu {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: stretch;
  background: rgb(30 30 30 / 95%);
  color: #fff;
  border-radius: 6px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 25%);
  overflow: hidden;
  transform: translateX(-50%);
  font-size: 12px;
}
.menu-item {
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.menu-item:hover:not(:disabled) {
  background: rgb(255 255 255 / 12%);
}
.menu-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.menu-item + .menu-item {
  border-left: 1px solid rgb(255 255 255 / 15%);
}
</style>
```

- [ ] **Step 2: typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: 提交**

```bash
git add src/components/documents/selection/SelectionMenu.vue
git commit -m "feat(documents): add SelectionMenu UI"
```

---

## Task 17：anchor 计算工具 + 测试

**Files:**
- Create: `src/components/documents/selection/anchor.ts`
- Test: `src/components/documents/selection/anchor.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/components/documents/selection/anchor.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { computeTextAnchor, computePdfAnchor } from "./anchor";

describe("computeTextAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns char offsets within a single-text-node container", () => {
    const root = document.createElement("div");
    root.textContent = "Hello world, this is text.";
    document.body.appendChild(root);

    const range = document.createRange();
    range.setStart(root.firstChild!, 6);
    range.setEnd(root.firstChild!, 11);

    const anchor = computeTextAnchor(root, range);
    expect(anchor).toEqual({ kind: "text", charStart: 6, charEnd: 11 });
  });

  it("walks nested elements to compute offsets", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>abc</p><p>defghi</p>";
    document.body.appendChild(root);

    const second = root.querySelectorAll("p")[1].firstChild!;
    const range = document.createRange();
    range.setStart(second, 1); // 'e'
    range.setEnd(second, 4);   // 'fgh'

    const anchor = computeTextAnchor(root, range);
    expect(anchor).toEqual({ kind: "text", charStart: 4, charEnd: 7 });
  });

  it("returns null when range is outside root", () => {
    const root = document.createElement("div");
    root.textContent = "abc";
    const other = document.createElement("div");
    other.textContent = "xyz";
    document.body.append(root, other);

    const range = document.createRange();
    range.setStart(other.firstChild!, 0);
    range.setEnd(other.firstChild!, 1);
    expect(computeTextAnchor(root, range)).toBeNull();
  });
});

describe("computePdfAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function buildPage(pageNum: number, html: string) {
    const div = document.createElement("div");
    div.className = "pdf-page";
    div.dataset.pageNumber = String(pageNum);
    div.innerHTML = `<div class="pdf-text-layer">${html}</div>`;
    document.body.appendChild(div);
    return div;
  }

  it("returns page + char offsets for a single-page selection", () => {
    const page = buildPage(3, "<span>abcdef</span><span>ghij</span>");
    const text = page.querySelector(".pdf-text-layer")!;
    const span2 = text.querySelectorAll("span")[1].firstChild!;
    const range = document.createRange();
    range.setStart(span2, 1); // 'h'
    range.setEnd(span2, 3);   // 'hi'

    const anchor = computePdfAnchor(range);
    expect(anchor).toEqual({ kind: "pdf", page: 3, charStart: 7, charEnd: 9 });
  });

  it("returns null when selection spans two pages", () => {
    const p1 = buildPage(1, "<span>aaa</span>");
    const p2 = buildPage(2, "<span>bbb</span>");

    const range = document.createRange();
    range.setStart(p1.querySelector("span")!.firstChild!, 1);
    range.setEnd(p2.querySelector("span")!.firstChild!, 2);

    expect(computePdfAnchor(range)).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm run test:run -- src/components/documents/selection/anchor.test.ts
```

- [ ] **Step 3: 写实现**

```ts
// src/components/documents/selection/anchor.ts
import type { SnippetLocator } from "../../../types/snippet";

function isWithin(root: Node, node: Node | null): boolean {
  if (!node) return false;
  return root.contains(node);
}

function offsetInRoot(root: Node, target: Node, targetOffset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(target, targetOffset);
  return range.toString().length;
}

export function computeTextAnchor(
  root: HTMLElement,
  range: Range,
): SnippetLocator | null {
  if (!isWithin(root, range.startContainer) || !isWithin(root, range.endContainer)) {
    return null;
  }
  const charStart = offsetInRoot(root, range.startContainer, range.startOffset);
  const charEnd = offsetInRoot(root, range.endContainer, range.endOffset);
  if (charEnd <= charStart) return null;
  return { kind: "text", charStart, charEnd };
}

function findPageContainer(node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.classList.contains("pdf-page")) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

export function computePdfAnchor(range: Range): SnippetLocator | null {
  const startPage = findPageContainer(range.startContainer);
  const endPage = findPageContainer(range.endContainer);
  if (!startPage || startPage !== endPage) return null;

  const layer = startPage.querySelector<HTMLElement>(".pdf-text-layer");
  if (!layer) return null;

  const pageNum = Number(startPage.dataset.pageNumber);
  if (!Number.isFinite(pageNum) || pageNum < 1) return null;

  const charStart = offsetInRoot(layer, range.startContainer, range.startOffset);
  const charEnd = offsetInRoot(layer, range.endContainer, range.endOffset);
  if (charEnd <= charStart) return null;

  return { kind: "pdf", page: pageNum, charStart, charEnd };
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
npm run test:run -- src/components/documents/selection/anchor.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/components/documents/selection/anchor.ts src/components/documents/selection/anchor.test.ts
git commit -m "feat(documents): add selection-to-anchor helpers"
```

---

## Task 18：selection-actions.ts + SelectionHost.vue + Toast

**Files:**
- Create: `src/components/documents/selection/selection-actions.ts`
- Create: `src/components/documents/selection/SelectionHost.vue`
- Create: `src/stores/toast.store.ts`（轻量 toast 通知 store）
- Create: `src/components/layout/ToastStack.vue`
- Modify: `src/App.vue`（挂载 `<ToastStack />`）

- [ ] **Step 1: 写 toast store**

```ts
// src/stores/toast.store.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export interface ToastMessage {
  id: string;
  text: string;
  tone: "info" | "success" | "warning" | "error";
}

export const useToastStore = defineStore("toast", () => {
  const items = ref<ToastMessage[]>([]);

  function push(text: string, tone: ToastMessage["tone"] = "info", durationMs = 2400) {
    const id = crypto.randomUUID();
    items.value.push({ id, text, tone });
    window.setTimeout(() => {
      items.value = items.value.filter((m) => m.id !== id);
    }, durationMs);
  }

  return { items, push };
});
```

- [ ] **Step 2: 写 ToastStack**

```vue
<!-- src/components/layout/ToastStack.vue -->
<script setup lang="ts">
import { useToastStore } from "../../stores/toast.store";
const toasts = useToastStore();
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <div v-for="item in toasts.items" :key="item.id" class="toast" :data-tone="item.tone">
      {{ item.text }}
    </div>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 28px;
  right: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10000;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  padding: 8px 14px;
  background: rgb(30 30 30 / 95%);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 4px 18px rgb(0 0 0 / 22%);
  max-width: 320px;
}
.toast[data-tone="success"] {
  background: #10b981;
}
.toast[data-tone="warning"] {
  background: #f59e0b;
}
.toast[data-tone="error"] {
  background: #d44747;
}
</style>
```

- [ ] **Step 3: 在 App.vue 挂载 ToastStack**

在 App.vue 的根模板里追加（与其他 layout 同级）：

```vue
<ToastStack />
```

并在 script setup 中 `import ToastStack from "./components/layout/ToastStack.vue";`。

- [ ] **Step 4: 写 selection-actions.ts**

```ts
// src/components/documents/selection/selection-actions.ts
import { useSnippetsStore } from "../../../stores/snippets.store";
import { useToastStore } from "../../../stores/toast.store";
import { createSnippet } from "../../../models/snippet.model";
import type { SnippetAnchor } from "../../../types/snippet";

export type SelectionActionId = "add-to-snippets" | "ask-ai" | "translate" | "search";

export interface SelectionActionContext {
  text: string;
  anchor: SnippetAnchor | null;
}

export async function dispatchSelectionAction(
  id: SelectionActionId,
  ctx: SelectionActionContext,
): Promise<void> {
  const toast = useToastStore();

  if (id === "add-to-snippets") {
    if (!ctx.anchor) {
      toast.push("无法定位选区，请缩小到一页内重试", "warning");
      return;
    }
    const snippets = useSnippetsStore();
    const snippet = createSnippet({ text: ctx.text, anchor: ctx.anchor });
    try {
      await snippets.add(snippet);
      toast.push("已加入知识库", "success");
    } catch (e) {
      toast.push(e instanceof Error ? e.message : String(e), "error");
    }
    return;
  }

  const labels: Record<Exclude<SelectionActionId, "add-to-snippets">, string> = {
    "ask-ai": "询问 AI",
    translate: "翻译",
    search: "搜索",
  };
  toast.push(`${labels[id]} 功能待接入`, "info");
}
```

- [ ] **Step 5: 写 SelectionHost**

```vue
<!-- src/components/documents/selection/SelectionHost.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, useTemplateRef } from "vue";
import SelectionMenu from "./SelectionMenu.vue";
import { computePdfAnchor, computeTextAnchor } from "./anchor";
import { dispatchSelectionAction, type SelectionActionId } from "./selection-actions";
import type { SnippetAnchor, SnippetLocator } from "../../../types/snippet";

const props = defineProps<{ documentId: string; mode: "pdf" | "text" }>();

const root = useTemplateRef<HTMLDivElement>("root");
const showMenu = ref(false);
const menuPos = ref({ x: 0, y: 0 });
const selectedText = ref("");
const currentAnchor = ref<SnippetAnchor | null>(null);
const disabledActions = ref<SelectionActionId[]>([]);

let debounceTimer: number | undefined;

function clearMenu() {
  showMenu.value = false;
  selectedText.value = "";
  currentAnchor.value = null;
  disabledActions.value = [];
}

function computeAnchor(range: Range): SnippetLocator | null {
  if (props.mode === "pdf") return computePdfAnchor(range);
  if (root.value) return computeTextAnchor(root.value, range);
  return null;
}

function evaluateSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
    clearMenu();
    return;
  }
  const range = selection.getRangeAt(0);
  if (!root.value || !root.value.contains(range.commonAncestorContainer)) {
    clearMenu();
    return;
  }
  const text = selection.toString();
  const locator = computeAnchor(range);
  const anchor: SnippetAnchor | null = locator
    ? { documentId: props.documentId, locator }
    : null;

  const rect = range.getBoundingClientRect();
  let x = rect.left + rect.width / 2;
  let y = rect.top - 8;
  if (y < 40) y = rect.bottom + 8;
  x = Math.min(window.innerWidth - 8, Math.max(8, x));

  selectedText.value = text;
  currentAnchor.value = anchor;
  disabledActions.value = anchor ? [] : ["add-to-snippets"];
  menuPos.value = { x, y };
  showMenu.value = true;
}

function onSelectionChange() {
  if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(evaluateSelection, 80);
}

function onMouseDown(event: MouseEvent) {
  if (!showMenu.value) return;
  const target = event.target as Node | null;
  if (target && root.value && root.value.contains(target)) return;
  clearMenu();
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") clearMenu();
}

function handleAction(id: SelectionActionId) {
  const ctx = { text: selectedText.value, anchor: currentAnchor.value };
  clearMenu();
  void dispatchSelectionAction(id, ctx);
}

onMounted(() => {
  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("selectionchange", onSelectionChange);
  document.removeEventListener("mousedown", onMouseDown);
  document.removeEventListener("keydown", onKeyDown);
  if (debounceTimer !== undefined) window.clearTimeout(debounceTimer);
});
</script>

<template>
  <div ref="root" class="selection-host">
    <slot />
    <SelectionMenu
      v-if="showMenu"
      :position="menuPos"
      :disabled-actions="disabledActions"
      @action="handleAction"
    />
  </div>
</template>

<style scoped>
.selection-host {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
```

- [ ] **Step 6: 在 DocumentReader 内包裹 viewer**

修改 `DocumentReader.vue` 的 `<main>` 段：

```vue
<main class="reader-body">
  <SelectionHost
    v-if="record && viewer"
    :document-id="record.id"
    :mode="record.kind === 'pdf' ? 'pdf' : 'text'"
  >
    <component :is="viewer" :key="record.id" :document-id="record.id" />
  </SelectionHost>
  <DocumentEmpty v-else :has-documents="documents.documents.length > 0" />
</main>
```

并在 script setup 内 `import SelectionHost from "./selection/SelectionHost.vue";`。

注：SelectionHost 的 `mode` 取 `"pdf"`/`"text"`；markdown 走 text 模式。

- [ ] **Step 7: 桌面端冒烟**

```bash
npm run tauri:dev
```

手动验证：
1. 打开一个 .md 文档，选一段文字 → 浮动菜单弹出。
2. 点"加入知识库" → 右下角 toast 提示"已加入知识库"。
3. 点"询问 AI"/"翻译"/"搜索" → 对应 toast 提示"功能待接入"。
4. 打开 PDF 同样操作 → 加入知识库成功；跨页选区时"加入知识库"按钮置灰。

- [ ] **Step 8: 提交**

```bash
git add src/components/documents/selection src/stores/toast.store.ts src/components/layout/ToastStack.vue src/components/documents/DocumentReader.vue src/App.vue
git commit -m "feat(documents): wire selection menu actions and toast feedback"
```

---

## Task 19：SnippetPanel.vue（侧抽屉 + 跳回原文）

**Files:**
- Create: `src/components/documents/snippets/SnippetPanel.vue`
- Modify: `src/views/DocumentsView.vue`（挂上 SnippetPanel）
- Modify: `src/components/documents/DocumentReader.vue`（emit `request-jump`）
- Modify: `src/components/documents/viewers/PdfViewer.vue`（暴露 `jumpToAnchor` 方法）
- Modify: `src/components/documents/viewers/TextViewer.vue`（暴露 `jumpToAnchor` 方法）

- [ ] **Step 1: 写 SnippetPanel**

```vue
<!-- src/components/documents/snippets/SnippetPanel.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useSnippetsStore } from "../../../stores/snippets.store";
import type { SnippetRecord } from "../../../types/snippet";

const props = defineProps<{ documentId: string | null }>();
const emit = defineEmits<{
  (e: "jump", snippet: SnippetRecord): void;
}>();

const snippets = useSnippetsStore();
const isCollapsed = ref(false);

const list = computed<SnippetRecord[]>(() =>
  props.documentId ? snippets.byDocument(props.documentId) : [],
);

async function handleDelete(id: string) {
  await snippets.remove(id);
}
</script>

<template>
  <aside class="snippet-panel" :class="{ collapsed: isCollapsed }">
    <header class="panel-header">
      <button type="button" class="toggle" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? "›" : "‹" }}
      </button>
      <h2 v-if="!isCollapsed" class="title">片段</h2>
      <span v-if="!isCollapsed" class="count">{{ list.length }}</span>
    </header>
    <div v-if="!isCollapsed" class="cards">
      <p v-if="list.length === 0" class="empty">在文档中选中文字，点击"加入知识库"。</p>
      <article
        v-for="snippet in list"
        :key="snippet.id"
        class="card"
        @click="emit('jump', snippet)"
      >
        <p class="card-text">{{ snippet.text }}</p>
        <footer class="card-meta">
          <span v-if="snippet.anchor.locator.kind === 'pdf'">P. {{ snippet.anchor.locator.page }}</span>
          <span v-else>文本</span>
          <button type="button" class="delete" @click.stop="handleDelete(snippet.id)">删除</button>
        </footer>
      </article>
    </div>
  </aside>
</template>

<style scoped>
.snippet-panel {
  flex: 0 0 auto;
  width: 280px;
  border-left: 1px solid var(--border-color);
  background: rgb(255 255 255 / 35%);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.snippet-panel.collapsed {
  width: 28px;
}
.panel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
}
.toggle {
  width: 18px;
  height: 18px;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 3px;
  background: rgb(255 255 255 / 50%);
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
}
.title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}
.count {
  font-size: 11px;
  color: var(--subtle-text-color);
}
.cards {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.empty {
  font-size: 11px;
  color: var(--subtle-text-color);
  padding: 16px 8px;
  text-align: center;
}
.card {
  padding: 8px 10px;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 6px;
  background: rgb(255 255 255 / 55%);
  cursor: pointer;
}
.card:hover {
  background: var(--hover-color);
}
.card-text {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-color);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--subtle-text-color);
}
.delete {
  border: none;
  background: transparent;
  color: var(--subtle-text-color);
  cursor: pointer;
  font-size: 11px;
}
.delete:hover {
  color: #d44747;
}
</style>
```

- [ ] **Step 2: 在 PdfViewer 暴露 jumpToAnchor**

在 `<script setup>` 末尾追加：

```ts
import type { SnippetLocator } from "../../../types/snippet";

async function jumpToAnchor(locator: SnippetLocator) {
  if (locator.kind !== "pdf") return;
  if (!container.value) return;
  const pageEl = container.value.querySelector<HTMLElement>(
    `.pdf-page[data-page-number="${locator.page}"]`,
  );
  if (!pageEl) return;
  pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
  highlightTextLayer(pageEl, locator.charStart, locator.charEnd);
}

function highlightTextLayer(pageEl: HTMLElement, charStart: number, charEnd: number) {
  const layer = pageEl.querySelector<HTMLElement>(".pdf-text-layer");
  if (!layer) return;
  const range = document.createRange();
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.data.length;
    if (!startNode && consumed + len >= charStart) {
      startNode = node;
      startOffset = charStart - consumed;
    }
    if (consumed + len >= charEnd) {
      endNode = node;
      endOffset = charEnd - consumed;
      break;
    }
    consumed += len;
  }
  if (!startNode || !endNode) return;
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  setTimeout(() => sel?.removeAllRanges(), 1800);
}

defineExpose({ jumpToAnchor });
```

- [ ] **Step 3: 在 TextViewer 暴露 jumpToAnchor**

在 `<script setup>` 末尾追加：

```ts
import type { SnippetLocator } from "../../../types/snippet";

const viewerRoot = ref<HTMLElement | null>(null);

async function jumpToAnchor(locator: SnippetLocator) {
  if (locator.kind !== "text") return;
  if (!viewerRoot.value) return;
  const walker = document.createTreeWalker(viewerRoot.value, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.data.length;
    if (!startNode && consumed + len >= locator.charStart) {
      startNode = node;
      startOffset = locator.charStart - consumed;
    }
    if (consumed + len >= locator.charEnd) {
      endNode = node;
      endOffset = locator.charEnd - consumed;
      break;
    }
    consumed += len;
  }
  if (!startNode || !endNode) return;
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const rect = range.getBoundingClientRect();
  viewerRoot.value.scrollBy({ top: rect.top - 120, behavior: "smooth" });
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  setTimeout(() => sel?.removeAllRanges(), 1800);
}

defineExpose({ jumpToAnchor });
```

并把 `<template>` 根元素改成 `<div ref="viewerRoot" class="text-viewer">`。

- [ ] **Step 4: 在 DocumentReader 转发 jump**

把 `<component :is="viewer">` 用 `ref` 引用，并接收 jump 请求：

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { useDocumentsStore } from "../../stores/documents.store";
import { getViewer } from "./viewers/registry";
import DocumentEmpty from "./DocumentEmpty.vue";
import SelectionHost from "./selection/SelectionHost.vue";
import type { SnippetLocator } from "../../types/snippet";

const props = defineProps<{ documentId: string | null }>();

const documents = useDocumentsStore();
const record = computed(() => (props.documentId ? documents.byId(props.documentId) : null));
const viewer = computed(() => (record.value ? getViewer(record.value.kind) : null));
const viewerRef = ref<{ jumpToAnchor?: (l: SnippetLocator) => Promise<void> } | null>(null);

function jumpTo(locator: SnippetLocator) {
  viewerRef.value?.jumpToAnchor?.(locator);
}

defineExpose({ jumpTo });
</script>

<template>
  <div class="reader">
    <header v-if="record" class="reader-header">
      <h1 class="reader-title">{{ record.title }}</h1>
      <div class="reader-meta">
        <span class="kind-chip">{{ record.kind.toUpperCase() }}</span>
        <span class="meta-text">{{ record.originalName }}</span>
      </div>
    </header>
    <main class="reader-body">
      <SelectionHost
        v-if="record && viewer"
        :document-id="record.id"
        :mode="record.kind === 'pdf' ? 'pdf' : 'text'"
      >
        <component
          :is="viewer"
          ref="viewerRef"
          :key="record.id"
          :document-id="record.id"
        />
      </SelectionHost>
      <DocumentEmpty v-else :has-documents="documents.documents.length > 0" />
    </main>
  </div>
</template>
```

（style 块保留不变）

- [ ] **Step 5: 在 DocumentsView 组合 reader + panel**

替换 DocumentsView 模板为：

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDocumentsStore } from "../stores/documents.store";
import { useWorkspaceStore } from "../stores/workspace.store";
import DocumentReader from "../components/documents/DocumentReader.vue";
import SnippetPanel from "../components/documents/snippets/SnippetPanel.vue";
import type { SnippetRecord } from "../types/snippet";
import type { SnippetLocator } from "../types/snippet";

const documents = useDocumentsStore();
const workspace = useWorkspaceStore();

onMounted(() => {
  if (documents.documents.length === 0) {
    void documents.load();
  }
});

const selectedId = computed(() => {
  const id = workspace.selectedSideListIds.documents;
  if (!id) return null;
  return documents.byId(id) ? id : null;
});

const readerRef = ref<{ jumpTo: (l: SnippetLocator) => void } | null>(null);

function handleJump(snippet: SnippetRecord) {
  readerRef.value?.jumpTo(snippet.anchor.locator);
}
</script>

<template>
  <div class="documents-view">
    <DocumentReader ref="readerRef" :document-id="selectedId" />
    <SnippetPanel :document-id="selectedId" @jump="handleJump" />
  </div>
</template>

<style scoped>
.documents-view {
  display: flex;
  height: 100%;
  min-height: 0;
}
</style>
```

- [ ] **Step 6: 桌面端冒烟**

```bash
npm run tauri:dev
```

手动验证（最终 MVP demo 路径）：
1. 导入一个 PDF。
2. 选一段文字 → 浮动菜单 → "加入知识库" → toast 成功，右侧片段面板出现新卡片。
3. 在 PDF 中翻到别处，点片段卡片 → 视图滚回该 page，原文被选中高亮 ~2 秒。
4. 删除卡片 → 列表更新。
5. 切换到 .md 文档：同样路径成功；只是 PDF 与 text 模式各自独立。
6. 关闭 app → 重新打开 → 文档与片段持久化。

- [ ] **Step 7: 提交**

```bash
git add src/components/documents/snippets src/views/DocumentsView.vue src/components/documents/DocumentReader.vue src/components/documents/viewers/PdfViewer.vue src/components/documents/viewers/TextViewer.vue
git commit -m "feat(documents): add SnippetPanel with jump-to-anchor"
```

---

## Task 20：端到端验收 + lint/typecheck/test

**Files:** 无新建；仅执行验收。

- [ ] **Step 1: 全量测试**

```bash
npm run test:run
```
预期：全部新增测试 pass，原有测试不回归。

- [ ] **Step 2: typecheck**

```bash
npm run typecheck
```
预期：通过。

- [ ] **Step 3: lint**

```bash
npm run lint
```
预期：通过（如有 warning 按提示修，不忽略）。

- [ ] **Step 4: 桌面端完整路径走查**

```bash
npm run tauri:dev
```

对照 spec §11 验收点逐条勾选：

- [ ] 1. 导入按钮 → 选 PDF → 列表出现条目 → 自动选中并打开。
- [ ] 2. PDF 可翻页、缩放、文本可选。
- [ ] 3. 选中一段文字 → 浮动菜单 → "加入知识库" → SnippetPanel 出现卡片。
- [ ] 4. 点卡片 → PDF 滚到对应 page 并高亮 ~2 秒。
- [ ] 5. 其他 3 个 action 点击 → toast "功能待接入"。
- [ ] 6. 重启 app → 列表与片段持久化。
- [ ] 7. 同样路径走通 .txt / .md（含中文）。
- [ ] 8. 同文件二次导入 → 命中已存在分支（列表不重复增长）。

任何一条不达预期 → 不要"局部修一下就报告完成"；按 superpowers:systematic-debugging 找根因再修。

- [ ] **Step 5: 提交（如有微小修复）**

如步骤 4 触发任何修复，单独 commit：

```bash
git add <relevant files>
git commit -m "fix(documents): <specific issue>"
```

否则跳过本步。

- [ ] **Step 6: 创建 PR（如约定流程是 PR 合入）**

由用户指令决定是否在本计划范围内 push/PR。默认止步于 main 上的一系列 commits，等用户确认后再创建 PR。
