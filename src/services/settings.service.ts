import { invoke } from "@tauri-apps/api/core";
import { DEFAULT_SETTINGS } from "../constants/settings";
import type { AppSettings } from "../types/settings";

const STORAGE_KEY = "catgraph.settings";

export const SIDE_LIST_MIN_WIDTH = 180;
export const SIDE_LIST_MAX_WIDTH = 480;

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function clampSideListWidth(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.workspace.sideListWidth;
  return Math.min(SIDE_LIST_MAX_WIDTH, Math.max(SIDE_LIST_MIN_WIDTH, Math.round(value)));
}

export function normalizeSettings(value: unknown): AppSettings {
  const input = value as Partial<AppSettings> | null | undefined;

  return {
    version: 1,
    appearance: {
      ...DEFAULT_SETTINGS.appearance,
      ...(input?.appearance ?? {}),
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
