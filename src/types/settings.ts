export type ThemeMode = "system" | "light" | "dark";
export type DensityMode = "comfortable" | "compact";
export type NodeLabelMode = "full" | "compact" | "code";

export interface AppSettings {
  version: 1;
  appearance: {
    theme: ThemeMode;
    density: DensityMode;
    accentColor: string;
  };
  workspace: {
    defaultProjectPath: string;
    restoreLastSession: boolean;
    autoSaveIntervalMinutes: number;
  };
  graph: {
    showGrid: boolean;
    showMinimap: boolean;
    edgeAnimation: boolean;
    nodeLabelMode: NodeLabelMode;
  };
  data: {
    storageFormat: "json";
    backupOnSave: boolean;
  };
}
