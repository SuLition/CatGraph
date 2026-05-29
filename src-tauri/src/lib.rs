mod ai;
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
            "autoSaveIntervalMinutes": 5,
            "sideListWidth": 240
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
        },
        "ai": {
            "defaultProvider": "",
            "providers": {
                "openai": {
                    "enabled": false,
                    "apiKey": "",
                    "baseUrl": "",
                    "defaultModel": "gpt-4o-mini"
                },
                "claude": {
                    "enabled": false,
                    "apiKey": "",
                    "baseUrl": "",
                    "defaultModel": "claude-sonnet-4-6"
                },
                "deepseek": {
                    "enabled": false,
                    "apiKey": "",
                    "baseUrl": "",
                    "defaultModel": "deepseek-chat"
                }
            }
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
            documents::rename_document,
            documents::set_document_folder,
            documents::list_snippets,
            documents::save_snippet,
            documents::delete_snippet,
            documents::list_folders,
            documents::create_folder,
            documents::rename_folder,
            documents::set_folder_pinned,
            documents::delete_folder,
            ai::test_ai_provider,
            ai::chat_completion
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
