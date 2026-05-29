import { invoke } from "@tauri-apps/api/core";
import { PROVIDER_ORDER } from "../constants/ai-providers";
import { DEFAULT_SETTINGS } from "../constants/settings";
import type { AiProviderConfig, AiProviderId, AiSettings } from "../types/ai-provider";
import type { AppSettings, DensityMode, ThemeMode } from "../types/settings";

const STORAGE_KEY = "catgraph.settings";

export const SIDE_LIST_MIN_WIDTH = 180;
export const SIDE_LIST_MAX_WIDTH = 480;
const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];
const DENSITY_MODES: DensityMode[] = ["comfortable", "compact"];
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function clampSideListWidth(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.workspace.sideListWidth;
  return Math.min(SIDE_LIST_MAX_WIDTH, Math.max(SIDE_LIST_MIN_WIDTH, Math.round(value)));
}

function normalizeTheme(value: unknown): ThemeMode {
  return THEME_MODES.includes(value as ThemeMode)
    ? (value as ThemeMode)
    : DEFAULT_SETTINGS.appearance.theme;
}

function normalizeDensity(value: unknown): DensityMode {
  return DENSITY_MODES.includes(value as DensityMode)
    ? (value as DensityMode)
    : DEFAULT_SETTINGS.appearance.density;
}

function normalizeAccentColor(value: unknown): string {
  return typeof value === "string" && HEX_COLOR_RE.test(value)
    ? value.toLowerCase()
    : DEFAULT_SETTINGS.appearance.accentColor;
}

function normalizeProvider(
  id: AiProviderId,
  input: Partial<AiProviderConfig> | undefined,
): AiProviderConfig {
  const fallback = DEFAULT_SETTINGS.ai.providers[id];
  return {
    enabled: Boolean(input?.enabled ?? fallback.enabled),
    apiKey: typeof input?.apiKey === "string" ? input.apiKey : fallback.apiKey,
    baseUrl: typeof input?.baseUrl === "string" ? input.baseUrl : fallback.baseUrl,
    defaultModel:
      typeof input?.defaultModel === "string" && input.defaultModel.length > 0
        ? input.defaultModel
        : fallback.defaultModel,
  };
}

function normalizeAi(input: Partial<AiSettings> | undefined): AiSettings {
  const providers = {} as Record<AiProviderId, AiProviderConfig>;
  for (const id of PROVIDER_ORDER) {
    providers[id] = normalizeProvider(id, input?.providers?.[id]);
  }

  const validIds: AiSettings["defaultProvider"][] = [...PROVIDER_ORDER, ""];
  const incomingDefault = input?.defaultProvider ?? "";
  const defaultProvider = (validIds as string[]).includes(incomingDefault)
    ? (incomingDefault as AiSettings["defaultProvider"])
    : "";

  return { defaultProvider, providers };
}

export function normalizeSettings(value: unknown): AppSettings {
  const input = value as Partial<AppSettings> | null | undefined;

  return {
    version: 1,
    appearance: {
      theme: normalizeTheme(input?.appearance?.theme),
      density: normalizeDensity(input?.appearance?.density),
      accentColor: normalizeAccentColor(input?.appearance?.accentColor),
    },
    workspace: {
      ...DEFAULT_SETTINGS.workspace,
      ...(input?.workspace ?? {}),
      autoSaveIntervalMinutes: Number(
        input?.workspace?.autoSaveIntervalMinutes ??
          DEFAULT_SETTINGS.workspace.autoSaveIntervalMinutes,
      ),
      sideListWidth: clampSideListWidth(
        Number(input?.workspace?.sideListWidth ?? DEFAULT_SETTINGS.workspace.sideListWidth),
      ),
    },
    graph: {
      ...DEFAULT_SETTINGS.graph,
      ...(input?.graph ?? {}),
    },
    data: {
      ...DEFAULT_SETTINGS.data,
      ...(input?.data ?? {}),
      storageFormat: "json",
    },
    ai: normalizeAi(input?.ai),
  };
}

export async function readSettings(): Promise<AppSettings> {
  if (isTauriRuntime()) {
    const settings = await invoke<unknown>("read_settings");
    return normalizeSettings(settings);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  return normalizeSettings(JSON.parse(raw));
}

export async function writeSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings(settings);

  if (isTauriRuntime()) {
    const saved = await invoke<unknown>("write_settings", { settings: normalized });
    return normalizeSettings(saved);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized, null, 2));
  return normalized;
}
