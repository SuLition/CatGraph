import { invoke } from "@tauri-apps/api/core";
import { PROVIDER_PRESETS, resolveBaseUrl } from "../constants/ai-providers";
import { useSettingsStore } from "../stores/settings.store";
import type { AiProviderConfig, AiProviderId, ProviderTestResult } from "../types/ai-provider";

interface ChatCompletionResult {
  success: boolean;
  text: string;
  error: string;
}

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

const TRANSLATE_SYSTEM_PROMPT =
  "你是一个专业的翻译助手。请将用户输入的内容翻译为目标语言，只返回翻译结果，不要添加任何解释、注释或额外内容。保持原文的语气、风格和格式。";

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

export async function translateText(text: string): Promise<string> {
  const settings = useSettingsStore().settings;
  const providerId = settings.ai.defaultProvider;

  if (!providerId) {
    throw new Error("未配置默认 AI 服务商，请在设置中选择一个默认服务商");
  }

  const config = settings.ai.providers[providerId];
  if (!config?.enabled || !config?.apiKey.trim()) {
    throw new Error(`"${PROVIDER_PRESETS[providerId].label}" 未配置 API Key`);
  }

  if (!isTauriRuntime()) {
    throw new Error("翻译功能需在桌面端运行");
  }

  const baseUrl = resolveBaseUrl(providerId, config.baseUrl);
  const model = config.defaultModel || PROVIDER_PRESETS[providerId].defaultModel;
  const direction = hasChinese(text) ? "英文" : "中文";
  const userPrompt = `请将以下文本翻译成${direction}：\n\n${text}`;

  const result = await invoke<ChatCompletionResult>("chat_completion", {
    args: {
      provider: providerId,
      apiKey: config.apiKey.trim(),
      baseUrl,
      model,
      system: TRANSLATE_SYSTEM_PROMPT,
      user: userPrompt,
    },
  });

  if (!result.success) {
    throw new Error(result.error || "翻译请求失败");
  }

  return result.text;
}
