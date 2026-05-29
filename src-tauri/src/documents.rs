use std::{fs, path::PathBuf, process::Command};

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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub folder_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderRecord {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    #[serde(default)]
    pub pinned: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFolderResult {
    pub deleted_folder_ids: Vec<String>,
    pub deleted_document_ids: Vec<String>,
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

fn reveal_path(path: PathBuf, select_file: bool) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("path not found: {}", path.display()));
    }

    #[cfg(target_os = "windows")]
    {
        let mut command = Command::new("explorer.exe");
        if select_file {
            command.arg(format!("/select,{}", path.display()));
        } else {
            command.arg(path);
        }
        command
            .spawn()
            .map_err(|err| format!("failed to open File Explorer: {err}"))?;
    }

    #[cfg(target_os = "macos")]
    {
        let mut command = Command::new("open");
        if select_file {
            command.arg("-R").arg(path);
        } else {
            command.arg(path);
        }
        command
            .spawn()
            .map_err(|err| format!("failed to open Finder: {err}"))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let target = if select_file {
            path.parent()
                .ok_or_else(|| format!("path has no parent: {}", path.display()))?
                .to_path_buf()
        } else {
            path
        };
        Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|err| format!("failed to open file manager: {err}"))?;
    }

    Ok(())
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

fn folders_index(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_root(app)?.join("folders.json"))
}

fn load_folders(app: &AppHandle) -> Result<Vec<FolderRecord>, String> {
    let path = folders_index(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }

    let raw =
        fs::read_to_string(&path).map_err(|err| format!("failed to read folders.json: {err}"))?;
    if raw.trim().is_empty() {
        return Ok(vec![]);
    }
    serde_json::from_str(&raw).map_err(|err| format!("failed to parse folders.json: {err}"))
}

fn save_folders_list(app: &AppHandle, list: &[FolderRecord]) -> Result<(), String> {
    let path = folders_index(app)?;
    let text = serde_json::to_string_pretty(list)
        .map_err(|err| format!("failed to serialize folders.json: {err}"))?;
    atomic_write(&path, &format!("{text}\n"))
}

fn new_folder_id(name: &str) -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let mut hasher = Sha256::new();
    hasher.update(name.as_bytes());
    hasher.update(nanos.to_le_bytes());
    let hash = format!("{:x}", hasher.finalize());
    format!("fld-{}", hash.chars().take(12).collect::<String>())
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
pub fn import_document(
    app: AppHandle,
    src_path: String,
    folder_id: Option<String>,
) -> Result<DocumentRecord, String> {
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

    let mut docs = load_documents(&app)?;
    if let Some(existing) = docs.iter_mut().find(|doc| doc.content_hash == content_hash) {
        // Re-importing the same file into a folder (e.g. external drag-drop) moves it there.
        if folder_id.is_some() {
            existing.folder_id = folder_id;
            let updated = existing.clone();
            save_documents(&app, &docs)?;
            return Ok(updated);
        }
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
        folder_id,
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
        .find(|candidate| candidate.id == id)
        .ok_or_else(|| format!("document not found: {id}"))?;
    let path = data_root(&app)?.join(&doc.stored_path);
    fs::read(&path).map_err(|err| format!("failed to read document bytes: {err}"))
}

#[tauri::command]
pub fn reveal_document(app: AppHandle, id: String) -> Result<(), String> {
    let docs = load_documents(&app)?;
    let doc = docs
        .iter()
        .find(|candidate| candidate.id == id)
        .ok_or_else(|| format!("document not found: {id}"))?;
    let path = data_root(&app)?.join(&doc.stored_path);
    reveal_path(path, true)
}

#[tauri::command]
pub fn reveal_documents_folder(app: AppHandle) -> Result<(), String> {
    reveal_path(documents_dir(&app)?, false)
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

#[tauri::command]
pub fn list_folders(app: AppHandle) -> Result<Vec<FolderRecord>, String> {
    load_folders(&app)
}

#[tauri::command]
pub fn create_folder(
    app: AppHandle,
    name: String,
    parent_id: Option<String>,
) -> Result<FolderRecord, String> {
    let mut folders = load_folders(&app)?;
    if let Some(parent) = &parent_id {
        if !folders.iter().any(|folder| &folder.id == parent) {
            return Err(format!("parent folder not found: {parent}"));
        }
    }

    let record = FolderRecord {
        id: new_folder_id(&name),
        name,
        parent_id,
        pinned: false,
        created_at: Utc::now().to_rfc3339(),
    };
    folders.push(record.clone());
    save_folders_list(&app, &folders)?;
    Ok(record)
}

#[tauri::command]
pub fn rename_folder(app: AppHandle, id: String, name: String) -> Result<FolderRecord, String> {
    let mut folders = load_folders(&app)?;
    let folder = folders
        .iter_mut()
        .find(|folder| folder.id == id)
        .ok_or_else(|| format!("folder not found: {id}"))?;
    folder.name = name;
    let updated = folder.clone();
    save_folders_list(&app, &folders)?;
    Ok(updated)
}

#[tauri::command]
pub fn set_folder_pinned(
    app: AppHandle,
    id: String,
    pinned: bool,
) -> Result<FolderRecord, String> {
    let mut folders = load_folders(&app)?;
    let folder = folders
        .iter_mut()
        .find(|folder| folder.id == id)
        .ok_or_else(|| format!("folder not found: {id}"))?;
    folder.pinned = pinned;
    let updated = folder.clone();
    save_folders_list(&app, &folders)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_folder(app: AppHandle, id: String) -> Result<DeleteFolderResult, String> {
    let mut folders = load_folders(&app)?;

    // Collect the target folder and all of its descendants.
    let mut target_ids: Vec<String> = vec![id];
    let mut cursor = 0;
    while cursor < target_ids.len() {
        let current = target_ids[cursor].clone();
        for folder in &folders {
            if folder.parent_id.as_deref() == Some(current.as_str())
                && !target_ids.contains(&folder.id)
            {
                target_ids.push(folder.id.clone());
            }
        }
        cursor += 1;
    }
    let target_set: std::collections::HashSet<&str> =
        target_ids.iter().map(String::as_str).collect();

    // Documents living anywhere inside the deleted subtree are removed (files included).
    let mut docs = load_documents(&app)?;
    let deleted_document_ids: Vec<String> = docs
        .iter()
        .filter(|doc| {
            doc.folder_id
                .as_deref()
                .map_or(false, |fid| target_set.contains(fid))
        })
        .map(|doc| doc.id.clone())
        .collect();

    let root = data_root(&app)?;
    for doc in docs
        .iter()
        .filter(|doc| deleted_document_ids.iter().any(|id| id == &doc.id))
    {
        let path = root.join(&doc.stored_path);
        if path.exists() {
            fs::remove_file(&path).map_err(|err| format!("failed to delete file: {err}"))?;
        }
    }

    let deleted_doc_set: std::collections::HashSet<&str> =
        deleted_document_ids.iter().map(String::as_str).collect();
    docs.retain(|doc| !deleted_doc_set.contains(doc.id.as_str()));
    save_documents(&app, &docs)?;

    folders.retain(|folder| !target_set.contains(folder.id.as_str()));
    save_folders_list(&app, &folders)?;

    let mut snippets = load_snippets(&app)?;
    snippets.retain(|snippet| {
        snippet
            .anchor
            .get("documentId")
            .and_then(|value| value.as_str())
            .map_or(true, |doc_id| !deleted_doc_set.contains(doc_id))
    });
    save_snippets_list(&app, &snippets)?;

    Ok(DeleteFolderResult {
        deleted_folder_ids: target_ids,
        deleted_document_ids,
    })
}

#[tauri::command]
pub fn set_document_folder(
    app: AppHandle,
    id: String,
    folder_id: Option<String>,
) -> Result<DocumentRecord, String> {
    let mut docs = load_documents(&app)?;
    if let Some(folder) = &folder_id {
        let folders = load_folders(&app)?;
        if !folders.iter().any(|candidate| &candidate.id == folder) {
            return Err(format!("folder not found: {folder}"));
        }
    }

    let doc = docs
        .iter_mut()
        .find(|doc| doc.id == id)
        .ok_or_else(|| format!("document not found: {id}"))?;
    doc.folder_id = folder_id;
    let updated = doc.clone();
    save_documents(&app, &docs)?;
    Ok(updated)
}

#[tauri::command]
pub fn rename_document(app: AppHandle, id: String, title: String) -> Result<DocumentRecord, String> {
    let mut docs = load_documents(&app)?;
    let doc = docs
        .iter_mut()
        .find(|doc| doc.id == id)
        .ok_or_else(|| format!("document not found: {id}"))?;
    doc.title = title;
    let updated = doc.clone();
    save_documents(&app, &docs)?;
    Ok(updated)
}
