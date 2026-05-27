export type AiProviderId = "openai" | "claude" | "deepseek";

export type AiAuthStyle = "bearer" | "x-api-key";

export interface AiProviderConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

export interface AiSettings {
  defaultProvider: AiProviderId | "";
  providers: Record<AiProviderId, AiProviderConfig>;
}

export interface ProviderTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
}
