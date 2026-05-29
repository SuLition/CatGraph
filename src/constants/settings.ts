import { PROVIDER_PRESETS } from "./ai-providers";
import type { AppSettings } from "../types/settings";

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  appearance: {
    theme: "system",
    density: "comfortable",
    accentColor: "#d97757",
  },
  workspace: {
    defaultProjectPath: "",
    restoreLastSession: true,
    autoSaveIntervalMinutes: 5,
    sideListWidth: 240,
  },
  graph: {
    showGrid: true,
    showMinimap: true,
    edgeAnimation: false,
    nodeLabelMode: "full",
  },
  data: {
    storageFormat: "json",
    backupOnSave: true,
  },
  ai: {
    defaultProvider: "",
    providers: {
      openai: {
        enabled: false,
        apiKey: "",
        baseUrl: "",
        defaultModel: PROVIDER_PRESETS.openai.defaultModel,
      },
      claude: {
        enabled: false,
        apiKey: "",
        baseUrl: "",
        defaultModel: PROVIDER_PRESETS.claude.defaultModel,
      },
      deepseek: {
        enabled: false,
        apiKey: "",
        baseUrl: "",
        defaultModel: PROVIDER_PRESETS.deepseek.defaultModel,
      },
    },
  },
};
