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
        .map_err(|err| format!("failed to resolve app_data_dir: {err}"))?;
    fs::create_dir_all(&dir).map_err(|err| format!("failed to create app data dir: {err}"))?;
    Ok(dir)
}

fn documents_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = data_root(app)?.join("documents");
    fs::create_dir_all(&dir).map_err(|err| format!("failed to create documents dir: {err}"))?;
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
    fs::write(&tmp, content).map_err(|err| format!("failed to write tmp file: {err}"))?;
    fs::rename(&tmp, path).map_err(|err| format!("failed to rename tmp file: {err}"))?;
    Ok(())
}

fn load_documents(app: &AppHandle) -> Result<Vec<DocumentRecord>, String> {
    let path = documents_index(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }

    let raw =
        fs::read_to_string(&path).map_err(|err| format!("failed to read documents.json: {err}"))?;
    if raw.trim().is_empty() {
        return Ok(vec![]);
    }
    serde_json::from_str(&raw).map_err(|err| format!("failed to parse documents.json: {err}"))
}

fn save_documents(app: &AppHandle, list: &[DocumentRecord]) -> Result<(), String> {
    let path = documents_index(app)?;
    let text = serde_json::to_string_pretty(list)
        .map_err(|err| format!("failed to serialize documents.json: {err}"))?;
    atomic_write(&path, &format!("{text}\n"))
}

fn load_snippets(app: &AppHandle) -> Result<Vec<SnippetRecord>, String> {
    let path = snippets_index(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }

    let raw =
        fs::read_to_string(&path).map_err(|err| format!("failed to read snippets.json: {err}"))?;
    if raw.trim().is_empty() {
        return Ok(vec![]);
    }
    serde_json::from_str(&raw).map_err(|err| format!("failed to parse snippets.json: {err}"))
}

fn save_snippets_list(app: &AppHandle, list: &[SnippetRecord]) -> Result<(), String> {
    let path = snippets_index(app)?;
    let text = serde_json::to_string_pretty(list)
        .map_err(|err| format!("failed to serialize snippets.json: {err}"))?;
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
    let bytes = fs::read(&src).map_err(|err| format!("failed to read source file: {err}"))?;

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let content_hash = format!("{:x}", hasher.finalize());
    let id = content_hash.chars().take(12).collect::<String>();

    let original_name = src
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "source path has no filename".to_string())?
        .to_string();

    let ext = src
        .extension()
        .and_then(|ext| ext.to_str())
        .ok_or_else(|| "source file has no extension".to_string())?
        .to_string();
    let kind = kind_from_ext(&ext).ok_or_else(|| format!("unsupported extension: {ext}"))?;

    let docs = load_documents(&app)?;
    if let Some(existing) = docs.iter().find(|doc| doc.content_hash == content_hash) {
        return Ok(existing.clone());
    }

    let stored_filename = format!("{id}.{}", ext.to_lowercase());
    let dest = documents_dir(&app)?.join(&stored_filename);
    fs::write(&dest, &bytes).map_err(|err| format!("failed to copy file: {err}"))?;

    let title = src
        .file_stem()
        .and_then(|name| name.to_str())
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

    let mut updated = docs;
    updated.push(record.clone());
    save_documents(&app, &updated)?;
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
        .find(|candidate| candidate.id == id)
        .ok_or_else(|| format!("document not found: {id}"))?;
    let path = data_root(&app)?.join(&doc.stored_path);
    fs::read(&path).map_err(|err| format!("failed to read document bytes: {err}"))
}

#[tauri::command]
pub fn delete_document(app: AppHandle, id: String) -> Result<(), String> {
    let mut docs = load_documents(&app)?;
    let Some(idx) = docs.iter().position(|doc| doc.id == id) else {
        return Ok(());
    };

    let doc = docs.remove(idx);
    let path = data_root(&app)?.join(&doc.stored_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|err| format!("failed to delete file: {err}"))?;
    }
    save_documents(&app, &docs)?;

    let mut snippets = load_snippets(&app)?;
    snippets.retain(|snippet| {
        snippet.anchor.get("documentId").and_then(|value| value.as_str()) != Some(&id)
    });
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
    if let Some(existing) = snippets.iter_mut().find(|candidate| candidate.id == snippet.id) {
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
    snippets.retain(|snippet| snippet.id != id);
    save_snippets_list(&app, &snippets)?;
    Ok(())
}
