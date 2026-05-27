import type { AppSettings } from "../types/settings";

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  appearance: {
    theme: "system",
    density: "comfortable",
    accentColor: "#1a6b8a",
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
};
