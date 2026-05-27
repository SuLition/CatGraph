import { invoke } from "@tauri-apps/api/core";
import { PROVIDER_PRESETS, resolveBaseUrl } from "../constants/ai-providers";
import type { AiProviderConfig, AiProviderId, ProviderTestResult } from "../types/ai-provider";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export async function testProviderConnection(
  id: AiProviderId,
  config: AiProviderConfig,
): Promise<ProviderTestResult> {
  if (!isTauriRuntime()) {
    return {
      success: false,
      latencyMs: 0,
      message: "连接测试需在桌面端运行",
    };
  }

  const apiKey = config.apiKey.trim();
  if (apiKey === "") {
    return { success: false, latencyMs: 0, message: "未填写 API Key" };
  }

  const baseUrl = resolveBaseUrl(id, config.baseUrl);
  const model = config.defaultModel || PROVIDER_PRESETS[id].defaultModel;

  return invoke<ProviderTestResult>("test_ai_provider", {
    args: { provider: id, apiKey, baseUrl, model },
  });
}
