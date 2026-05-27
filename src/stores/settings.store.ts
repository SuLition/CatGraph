import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { DEFAULT_SETTINGS } from "../constants/settings";
import { normalizeSettings, readSettings, writeSettings } from "../services/settings.service";
import type { AiProviderId } from "../types/ai-provider";
import type { AppSettings } from "../types/settings";

type SaveState = "idle" | "saving" | "saved" | "error";

function cloneSettings(value: AppSettings): AppSettings {
  return JSON.parse(JSON.stringify(value)) as AppSettings;
}

function replaceSettings(target: AppSettings, next: AppSettings) {
  target.version = next.version;
  Object.assign(target.appearance, next.appearance);
  Object.assign(target.workspace, next.workspace);
  Object.assign(target.graph, next.graph);
  Object.assign(target.data, next.data);
  target.ai.defaultProvider = next.ai.defaultProvider;
  const nextProviders = next.ai.providers;
  const targetProviders = target.ai.providers;
  for (const id of Object.keys(nextProviders) as AiProviderId[]) {
    Object.assign(targetProviders[id], nextProviders[id]);
  }
}

function resolveTheme(settings: AppSettings) {
  if (settings.appearance.theme !== "system") {
    return settings.appearance.theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyRuntimeSettings(settings: AppSettings) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(settings);
  root.dataset.density = settings.appearance.density;
  root.style.setProperty("--accent-color", settings.appearance.accentColor);
  root.style.setProperty("--side-list-width", `${settings.workspace.sideListWidth}px`);
}

export const useSettingsStore = defineStore("settings", () => {
  const settings = reactive<AppSettings>(cloneSettings(DEFAULT_SETTINGS));
  const isLoading = ref(false);
  const saveState = ref<SaveState>("idle");
  const errorMessage = ref("");
  const hasLoaded = ref(false);
  const isHydrating = ref(false);
  let saveTimer: ReturnType<typeof window.setTimeout> | undefined;
  let saveVersion = 0;

  const statusText = computed(() => {
    if (isLoading.value) return "正在读取本地设置";
    if (saveState.value === "saving") return "设置自动保存中";
    if (saveState.value === "saved") return "设置已自动保存";
    if (saveState.value === "error") return errorMessage.value;
    return "修改后实时生效并自动保存";
  });

  async function persistNow(snapshot: AppSettings, version: number) {
    try {
      await writeSettings(snapshot);
      if (version === saveVersion) {
        saveState.value = "saved";
      }
    } catch (error) {
      if (version === saveVersion) {
        errorMessage.value = error instanceof Error ? error.message : String(error);
        saveState.value = "error";
      }
    }
  }

  function schedulePersist() {
    if (!hasLoaded.value || isHydrating.value) return;

    window.clearTimeout(saveTimer);
    const version = ++saveVersion;
    const snapshot = normalizeSettings(cloneSettings(settings));
    saveState.value = "saving";
    errorMessage.value = "";

    saveTimer = window.setTimeout(() => {
      void persistNow(snapshot, version);
    }, 150);
  }

  async function loadSettings() {
    isLoading.value = true;
    isHydrating.value = true;
    errorMessage.value = "";

    try {
      replaceSettings(settings, await readSettings());
      applyRuntimeSettings(settings);
      hasLoaded.value = true;
      saveState.value = "idle";
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : String(error);
      saveState.value = "error";
      hasLoaded.value = true;
    } finally {
      isHydrating.value = false;
      isLoading.value = false;
    }
  }

  function resetSettings() {
    replaceSettings(settings, cloneSettings(DEFAULT_SETTINGS));
  }

  watch(
    settings,
    () => {
      applyRuntimeSettings(settings);
      schedulePersist();
    },
    { deep: true },
  );

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      applyRuntimeSettings(settings);
    });
  }

  return {
    settings,
    isLoading,
    saveState,
    errorMessage,
    statusText,
    loadSettings,
    resetSettings,
  };
});
