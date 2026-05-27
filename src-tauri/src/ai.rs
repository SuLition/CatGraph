use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestProviderArgs {
    pub provider: String,
    pub api_key: String,
    pub base_url: String,
    #[serde(default)]
    #[allow(dead_code)]
    pub model: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderTestResult {
    pub success: bool,
    pub latency_ms: u64,
    pub message: String,
}

fn trim_trailing_slash(value: &str) -> &str {
    value.trim_end_matches('/')
}

#[tauri::command]
pub async fn test_ai_provider(args: TestProviderArgs) -> Result<ProviderTestResult, String> {
    let key = args.api_key.trim();
    if key.is_empty() {
        return Ok(ProviderTestResult {
            success: false,
            latency_ms: 0,
            message: "未填写 API Key".to_string(),
        });
    }

    let base = trim_trailing_slash(args.base_url.trim());
    if base.is_empty() {
        return Ok(ProviderTestResult {
            success: false,
            latency_ms: 0,
            message: "未解析到 Base URL".to_string(),
        });
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|err| format!("failed to build http client: {err}"))?;

    let request = match args.provider.as_str() {
        "openai" | "deepseek" => client
            .get(format!("{base}/models"))
            .header("Authorization", format!("Bearer {key}"))
            .header("Accept", "application/json"),
        "claude" => client
            .get(format!("{base}/v1/models"))
            .header("x-api-key", key)
            .header("anthropic-version", "2023-06-01")
            .header("Accept", "application/json"),
        other => {
            return Ok(ProviderTestResult {
                success: false,
                latency_ms: 0,
                message: format!("未知服务商: {other}"),
            });
        }
    };

    let started = Instant::now();
    let response = match request.send().await {
        Ok(resp) => resp,
        Err(err) => {
            return Ok(ProviderTestResult {
                success: false,
                latency_ms: started.elapsed().as_millis() as u64,
                message: format!("请求失败: {}", short_error(&err)),
            });
        }
    };
    let latency_ms = started.elapsed().as_millis() as u64;

    let status = response.status();
    if !status.is_success() {
        let snippet = response
            .text()
            .await
            .unwrap_or_default()
            .chars()
            .take(200)
            .collect::<String>();
        return Ok(ProviderTestResult {
            success: false,
            latency_ms,
            message: format!("HTTP {} · {}", status.as_u16(), snippet.trim()),
        });
    }

    let body = response.text().await.unwrap_or_default();
    let model_count = parse_model_count(&body);

    Ok(ProviderTestResult {
        success: true,
        latency_ms,
        message: match model_count {
            Some(n) => format!("已连通 · {n} 个模型 · {latency_ms} ms"),
            None => format!("已连通 · {latency_ms} ms"),
        },
    })
}

fn parse_model_count(body: &str) -> Option<usize> {
    let value: serde_json::Value = serde_json::from_str(body).ok()?;
    if let Some(array) = value.get("data").and_then(|v| v.as_array()) {
        return Some(array.len());
    }
    if let Some(array) = value.as_array() {
        return Some(array.len());
    }
    None
}

fn short_error(err: &reqwest::Error) -> String {
    let raw = err.to_string();
    raw.chars().take(160).collect()
}
