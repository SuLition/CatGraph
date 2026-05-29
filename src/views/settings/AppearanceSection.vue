<script setup lang="ts">
import { useSettingsStore } from "../../stores/settings.store";
import type { DensityMode, ThemeMode } from "../../types/settings";

const settingsStore = useSettingsStore();
const settings = settingsStore.settings;

const accentPresets = ["#d97757", "#1a6b8a", "#2563eb", "#7c3aed", "#0f766e", "#be123c"];

function setTheme(theme: ThemeMode) {
  settings.appearance.theme = theme;
}

function setDensity(density: DensityMode) {
  settings.appearance.density = density;
}

function setAccentColor(color: string) {
  settings.appearance.accentColor = color;
}
</script>

<template>
  <section class="settings-section">
    <div class="section-heading">
      <h2>外观</h2>
      <p>窗口显示偏好,修改后立即生效并自动保存。</p>
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
        <div class="accent-presets" aria-label="预设强调色">
          <button
            v-for="color in accentPresets"
            :key="color"
            type="button"
            class="accent-swatch"
            :class="{ 'is-active': settings.appearance.accentColor.toLowerCase() === color }"
            :style="{ background: color }"
            :aria-label="`使用强调色 ${color}`"
            @click="setAccentColor(color)"
          ></button>
        </div>
        <input v-model="settings.appearance.accentColor" type="color" aria-label="强调色" />
        <code>{{ settings.appearance.accentColor }}</code>
      </div>
    </div>
  </section>
</template>
