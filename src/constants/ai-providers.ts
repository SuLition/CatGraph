import type { AiAuthStyle, AiProviderId } from "../types/ai-provider";

export interface ProviderPreset {
  id: AiProviderId;
  label: string;
  shortLabel: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: string[];
  docsUrl: string;
  authStyle: AiAuthStyle;
  accent: string;
}

export const PROVIDER_PRESETS: Record<AiProviderId, ProviderPreset> = {
  openai: {
    id: "openai",
    label: "OpenAI (GPT)",
    shortLabel: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5.4-mini",
    models: [
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.1",
      "gpt-5.1-codex",
      "gpt-5",
      "gpt-5-mini",
      "o4-mini",
      "o3",
      "gpt-4.1",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    docsUrl: "https://platform.openai.com/api-keys",
    authStyle: "bearer",
    accent: "#10a37f",
  },
  claude: {
    id: "claude",
    label: "Anthropic Claude",
    shortLabel: "Claude",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-6",
    models: [
      "claude opus 4.7",
      "claude-sonnet-4-6",
      "claude-haiku-4-5",
      "claude-opus-4-6",
      "claude-sonnet-4-5",
    ],
    docsUrl: "https://console.anthropic.com/settings/keys",
    authStyle: "x-api-key",
    accent: "#c96442",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    shortLabel: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    models: [
      "deepseek-v4-pro",
      "deepseek-v4-flash",
    ],
    docsUrl: "https://platform.deepseek.com/api_keys",
    authStyle: "bearer",
    accent: "#4d6bfe",
  },
};

export const PROVIDER_ORDER: AiProviderId[] = ["openai", "claude", "deepseek"];

export function resolveBaseUrl(id: AiProviderId, baseUrl: string): string {
  const trimmed = baseUrl.trim();
  return trimmed === "" ? PROVIDER_PRESETS[id].defaultBaseUrl : trimmed;
}
