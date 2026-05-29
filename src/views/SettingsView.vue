<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowReset20Regular,
  Bot20Regular,
  Color20Regular,
  Database20Regular,
  Folder20Regular,
  Settings24Regular,
} from "@vicons/fluent";
import { useSettingsStore } from "../stores/settings.store";
import type { SettingsSectionId } from "../router";

interface SectionLink {
  id: SettingsSectionId;
  label: string;
  icon: unknown;
}

const sections: SectionLink[] = [
  { id: "appearance", label: "外观", icon: Color20Regular },
  { id: "workspace", label: "工作区", icon: Folder20Regular },
  { id: "graph", label: "图谱", icon: Settings24Regular },
  { id: "data", label: "数据", icon: Database20Regular },
  { id: "ai", label: "AI 服务商", icon: Bot20Regular },
];

const settingsStore = useSettingsStore();
const route = useRoute();
const router = useRouter();

const activeSection = computed<SettingsSectionId>(() => {
  const section = route.meta.settingsSection as SettingsSectionId | undefined;
  return section ?? "appearance";
});

function goToSection(id: SettingsSectionId) {
  void router.push({ name: `settings-${id}` });
}

function resetSettings() {
  settingsStore.resetSettings();
}
</script>

<template>
  <section class="settings-page">
    <div class="settings-body">
      <aside class="settings-nav" aria-label="设置分类">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="nav-item"
          :class="{ 'is-active': activeSection === section.id }"
          @click="goToSection(section.id)"
        >
          <component :is="section.icon" class="nav-icon" aria-hidden="true" />
          {{ section.label }}
        </button>

        <div class="nav-footer">
          <span
            class="settings-status"
            :class="{ 'is-error': settingsStore.saveState === 'error' }"
          >
            {{ settingsStore.statusText }}
          </span>
          <button type="button" class="ghost-btn" @click="resetSettings">
            <ArrowReset20Regular class="button-icon" aria-hidden="true" />
            恢复默认
          </button>
        </div>
      </aside>

      <div class="settings-scroll">
        <div class="settings-content">
          <RouterView />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-color);
}

.settings-body {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  min-height: 0;
  flex: 1 1 auto;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px 10px;
  border-right: 1px solid var(--border-color);
  background: var(--surface-soft-color);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  color: var(--muted-text-color);
  background: transparent;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.nav-item:hover {
  background: var(--hover-color);
}

.nav-item.is-active {
  color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}

.nav-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  flex: 0 0 auto;
}

.nav-footer {
  display: grid;
  gap: 10px;
  margin-top: auto;
  padding: 14px 2px 2px;
}

.settings-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--muted-text-color);
  font-size: 12px;
}

.settings-status.is-error {
  color: var(--danger-color);
}

.button-icon {
  width: 14px;
  height: 14px;
  color: currentColor;
  flex: 0 0 auto;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-control-color);
  color: var(--muted-text-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn:hover {
  background: var(--hover-color);
}

.settings-scroll {
  min-height: 0;
  overflow: auto;
  padding: 32px 24px 48px;
}

.settings-content {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>

<style>
/* Shared settings styles — applied to child sections via cascade (non-scoped). */

.settings-section {
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  border-radius: 10px;
  overflow: hidden;
}

.settings-section .section-heading {
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--border-color);
}

.settings-section .section-heading h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
}

.settings-section .section-heading p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--subtle-text-color);
}

.settings-section .setting-row,
.settings-section .field-row {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: var(--settings-row-min-height, 62px);
  padding: var(--settings-row-padding, 14px 20px);
  border-top: 1px solid var(--border-subtle-color);
}

.settings-section .section-heading + .setting-row,
.settings-section .section-heading + .field-row {
  border-top: 0;
}

.settings-section .setting-row.is-clickable {
  cursor: pointer;
}

.settings-section .setting-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.settings-section .setting-title,
.settings-section .field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.settings-section .setting-desc {
  font-size: 12px;
  color: var(--subtle-text-color);
  line-height: 1.45;
}

.settings-section .segmented {
  display: inline-flex;
  gap: 0;
  padding: 3px;
  border: 1px solid var(--border-color);
  background: var(--surface-muted-color);
  border-radius: 8px;
  flex: 0 0 auto;
}

.settings-section .segment {
  height: 26px;
  padding: 0 12px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--muted-text-color);
  font-size: 12px;
  cursor: pointer;
}

.settings-section .segment.is-active {
  background: var(--surface-control-strong-color);
  color: var(--text-color);
  font-weight: 600;
  box-shadow: 0 1px 2px var(--shadow-soft-color);
}

.settings-section .color-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.settings-section .accent-presets {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.settings-section .accent-swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid var(--surface-control-strong-color);
  border-radius: 11px;
  box-shadow: 0 0 0 1px var(--border-strong-color);
  cursor: pointer;
}

.settings-section .accent-swatch.is-active {
  box-shadow:
    0 0 0 1px var(--surface-control-strong-color),
    0 0 0 3px var(--accent-color);
}

.settings-section .color-field input {
  width: 34px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--border-strong-color);
  border-radius: 6px;
  background: var(--surface-control-strong-color);
}

.settings-section .color-field code,
.settings-section .format-chip {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  color: var(--accent-color);
}

.settings-section .field-row {
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
}

.settings-section .text-input,
.settings-section .number-input {
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--border-control-color);
  background: var(--surface-control-color);
  color: var(--text-color);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.settings-section .text-input {
  width: min(520px, 100%);
  padding: 0 10px;
}

.settings-section .number-input {
  width: 96px;
  padding: 0 8px;
}

.settings-section .text-input:focus,
.settings-section .number-input:focus {
  border-color: color-mix(in srgb, var(--accent-color) 42%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent);
}

.settings-section .switch-input {
  appearance: none;
  width: 38px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid var(--border-strong-color);
  background: var(--switch-track-color);
  position: relative;
  flex: 0 0 auto;
  cursor: pointer;
}

.settings-section .switch-input::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--surface-control-strong-color);
  box-shadow: 0 1px 2px var(--shadow-soft-color);
  transition: transform 160ms ease;
}

.settings-section .switch-input:checked {
  border-color: var(--accent-color);
  background: var(--accent-color);
}

.settings-section .switch-input:checked::before {
  transform: translateX(16px);
}

.settings-section .format-chip {
  padding: 5px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--success-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--success-color) 28%, transparent);
  font-weight: 600;
}

.settings-section select.text-input {
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--muted-text-color) 50%),
    linear-gradient(135deg, var(--muted-text-color) 50%, transparent 50%);
  background-position:
    calc(100% - 16px) 50%,
    calc(100% - 11px) 50%;
  background-size:
    5px 5px,
    5px 5px;
  background-repeat: no-repeat;
  padding-right: 28px;
  cursor: pointer;
}
</style>
