<script setup lang="ts">
import { nextTick, ref } from "vue";
import {
  ArrowReset20Regular,
  Color20Regular,
  Database20Regular,
  Folder20Regular,
  Settings24Regular,
} from "@vicons/fluent";
import { useSettingsStore } from "../stores/settings.store";
import type { DensityMode, NodeLabelMode, ThemeMode } from "../types/settings";

type SectionId = "appearance" | "workspace" | "graph" | "data";

const settingsStore = useSettingsStore();
const settings = settingsStore.settings;
const activeSection = ref<SectionId>("appearance");
const settingsScroll = ref<HTMLElement | null>(null);

const sections: { id: SectionId; label: string; icon: unknown }[] = [
  { id: "appearance", label: "外观", icon: Color20Regular },
  { id: "workspace", label: "工作区", icon: Folder20Regular },
  { id: "graph", label: "图谱", icon: Settings24Regular },
  { id: "data", label: "数据", icon: Database20Regular },
];

function resetSettings() {
  settingsStore.resetSettings();
}

async function scrollToSection(id: SectionId) {
  activeSection.value = id;
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleScroll() {
  const container = settingsScroll.value;
  if (!container) return;

  const containerTop = container.getBoundingClientRect().top;
  let nextActive = activeSection.value;
  let nextDistance = Number.POSITIVE_INFINITY;

  for (const section of sections) {
    const element = document.getElementById(section.id);
    if (!element) continue;

    const distance = Math.abs(element.getBoundingClientRect().top - containerTop - 18);
    if (distance < nextDistance) {
      nextDistance = distance;
      nextActive = section.id;
    }
  }

  activeSection.value = nextActive;
}

function setTheme(theme: ThemeMode) {
  settings.appearance.theme = theme;
}

function setDensity(density: DensityMode) {
  settings.appearance.density = density;
}

function setNodeLabelMode(mode: NodeLabelMode) {
  settings.graph.nodeLabelMode = mode;
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
          @click="scrollToSection(section.id)"
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

      <div ref="settingsScroll" class="settings-scroll" @scroll="handleScroll">
        <section id="appearance" class="settings-section">
          <div class="section-heading">
            <h2>外观</h2>
            <p>窗口显示偏好，修改后立即生效并自动保存。</p>
          </div>

          <div class="setting-row">
            <div class="setting-copy">
              <span class="setting-title">主题模式</span>
              <span class="setting-desc">跟随系统或固定浅色、深色。</span>
            </div>
            <div class="segmented">
              <button
                v-for="item in [
                  { label: '跟随系统', value: 'system' },
                  { label: '浅色', value: 'light' },
                  { label: '深色', value: 'dark' },
                ]"
                :key="item.value"
                type="button"
                class="segment"
                :class="{ 'is-active': settings.appearance.theme === item.value }"
                @click="setTheme(item.value as ThemeMode)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-copy">
              <span class="setting-title">界面密度</span>
              <span class="setting-desc">控制列表、面板的显示间距。</span>
            </div>
            <div class="segmented">
              <button
                type="button"
                class="segment"
                :class="{ 'is-active': settings.appearance.density === 'comfortable' }"
                @click="setDensity('comfortable')"
              >
                舒适
              </button>
              <button
                type="button"
                class="segment"
                :class="{ 'is-active': settings.appearance.density === 'compact' }"
                @click="setDensity('compact')"
              >
                紧凑
              </button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-copy">
              <span class="setting-title">强调色</span>
              <span class="setting-desc">用于图谱节点、按钮和选中态。</span>
            </div>
            <div class="color-field">
              <input v-model="settings.appearance.accentColor" type="color" aria-label="强调色" />
              <code>{{ settings.appearance.accentColor }}</code>
            </div>
          </div>
        </section>

        <section id="workspace" class="settings-section">
          <div class="section-heading">
            <h2>工作区</h2>
            <p>控制启动恢复和自动保存策略。</p>
          </div>

          <label class="field-row">
            <span class="field-label">默认项目路径</span>
            <input
              v-model="settings.workspace.defaultProjectPath"
              class="text-input"
              type="text"
              placeholder="例如 D:\\CatGraph\\Projects"
            />
          </label>

          <label class="setting-row is-clickable">
            <div class="setting-copy">
              <span class="setting-title">启动时恢复上次会话</span>
              <span class="setting-desc">打开应用后回到上次的实验和图谱视图。</span>
            </div>
            <input
              v-model="settings.workspace.restoreLastSession"
              class="switch-input"
              type="checkbox"
            />
          </label>

          <label class="field-row">
            <span class="field-label">自动保存间隔（分钟）</span>
            <input
              v-model.number="settings.workspace.autoSaveIntervalMinutes"
              class="number-input"
              type="number"
              min="1"
              max="60"
            />
          </label>
        </section>

        <section id="graph" class="settings-section">
          <div class="section-heading">
            <h2>图谱</h2>
            <p>默认图谱视图和节点信息显示。</p>
          </div>

          <label class="setting-row is-clickable">
            <div class="setting-copy">
              <span class="setting-title">显示网格背景</span>
              <span class="setting-desc">保持图谱布局时的空间参照。</span>
            </div>
            <input v-model="settings.graph.showGrid" class="switch-input" type="checkbox" />
          </label>

          <label class="setting-row is-clickable">
            <div class="setting-copy">
              <span class="setting-title">显示缩略导航</span>
              <span class="setting-desc">用于大型知识图谱快速定位。</span>
            </div>
            <input v-model="settings.graph.showMinimap" class="switch-input" type="checkbox" />
          </label>

          <label class="setting-row is-clickable">
            <div class="setting-copy">
              <span class="setting-title">启用关系动画</span>
              <span class="setting-desc">突出计算链路和数据流方向。</span>
            </div>
            <input v-model="settings.graph.edgeAnimation" class="switch-input" type="checkbox" />
          </label>

          <div class="setting-row">
            <div class="setting-copy">
              <span class="setting-title">节点标签</span>
              <span class="setting-desc">选择图谱节点默认展示的信息量。</span>
            </div>
            <div class="segmented">
              <button
                v-for="item in [
                  { label: '完整', value: 'full' },
                  { label: '紧凑', value: 'compact' },
                  { label: '代码', value: 'code' },
                ]"
                :key="item.value"
                type="button"
                class="segment"
                :class="{ 'is-active': settings.graph.nodeLabelMode === item.value }"
                @click="setNodeLabelMode(item.value as NodeLabelMode)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </section>

        <section id="data" class="settings-section">
          <div class="section-heading">
            <h2>数据</h2>
            <p>本地配置和后续内容数据优先使用 JSON。</p>
          </div>

          <div class="setting-row">
            <div class="setting-copy">
              <span class="setting-title">本地存储格式</span>
              <span class="setting-desc">当前设置文件固定为结构化 JSON。</span>
            </div>
            <code class="format-chip">{{ settings.data.storageFormat }}</code>
          </div>

          <label class="setting-row is-clickable">
            <div class="setting-copy">
              <span class="setting-title">保存时生成备份</span>
              <span class="setting-desc">后续写入项目数据时保留变更前版本。</span>
            </div>
            <input v-model="settings.data.backupOnSave" class="switch-input" type="checkbox" />
          </label>
        </section>
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

.settings-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--muted-text-color);
  font-size: 12px;
}

.settings-status.is-error {
  color: #b42318;
}

.status-icon,
.button-icon,
.nav-icon {
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
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.ghost-btn {
  border: 1px solid var(--border-color);
  background: rgb(255 255 255 / 50%);
  color: var(--muted-text-color);
}

.ghost-btn:hover {
  background: var(--hover-color);
}

.settings-body {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr);
  min-height: 0;
  flex: 1 1 auto;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px 10px;
  border-right: 1px solid var(--border-color);
  background: var(--surface-soft-color);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
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

.nav-footer {
  display: grid;
  gap: 10px;
  margin-top: auto;
  padding: 12px 2px 2px;
}

.settings-scroll {
  min-height: 0;
  overflow: auto;
  padding: 18px 22px 32px;
}

.settings-section {
  max-width: 860px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
}

.section-heading {
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border-color);
}

.section-heading h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.section-heading p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--subtle-text-color);
}

.setting-row,
.field-row {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: var(--settings-row-min-height, 58px);
  padding: var(--settings-row-padding, 12px 16px);
  border-top: 1px solid rgb(137 160 174 / 10%);
}

.section-heading + .setting-row,
.section-heading + .field-row {
  border-top: 0;
}

.setting-row.is-clickable {
  cursor: pointer;
}

.setting-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.setting-title,
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.setting-desc {
  font-size: 12px;
  color: var(--subtle-text-color);
}

.segmented {
  display: inline-flex;
  gap: 0;
  padding: 3px;
  border: 1px solid rgb(137 160 174 / 18%);
  background: rgb(249 249 247 / 80%);
  border-radius: 8px;
  flex: 0 0 auto;
}

.segment {
  height: 26px;
  padding: 0 12px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--muted-text-color);
  font-size: 12px;
  cursor: pointer;
}

.segment.is-active {
  background: #ffffff;
  color: var(--text-color);
  font-weight: 600;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
}

.color-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-field input {
  width: 34px;
  height: 28px;
  padding: 0;
  border: 1px solid rgb(137 160 174 / 28%);
  border-radius: 6px;
  background: #ffffff;
}

.color-field code,
.format-chip {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  color: var(--accent-color);
}

.field-row {
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
}

.text-input,
.number-input {
  height: 30px;
  border-radius: 6px;
  border: 1px solid rgb(137 160 174 / 22%);
  background: rgb(255 255 255 / 72%);
  color: var(--text-color);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.text-input {
  width: min(520px, 100%);
  padding: 0 10px;
}

.number-input {
  width: 96px;
  padding: 0 8px;
}

.text-input:focus,
.number-input:focus {
  border-color: color-mix(in srgb, var(--accent-color) 42%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent);
}

.switch-input {
  appearance: none;
  width: 38px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid rgb(137 160 174 / 28%);
  background: #d8e1e6;
  position: relative;
  flex: 0 0 auto;
  cursor: pointer;
}

.switch-input::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 18%);
  transition: transform 160ms ease;
}

.switch-input:checked {
  border-color: var(--accent-color);
  background: var(--accent-color);
}

.switch-input:checked::before {
  transform: translateX(16px);
}

.format-chip {
  padding: 5px 10px;
  border-radius: 6px;
  background: oklch(96% 0.05 145);
  border: 1px solid oklch(85% 0.08 145);
  font-weight: 600;
}
</style>
