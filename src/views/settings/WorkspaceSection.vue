<script setup lang="ts">
import { useSettingsStore } from "../../stores/settings.store";

const settingsStore = useSettingsStore();
const settings = settingsStore.settings;
</script>

<template>
  <section class="settings-section">
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
        placeholder="例如 D:\CatGraph\Projects"
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
      <span class="field-label">自动保存间隔(分钟)</span>
      <input
        v-model.number="settings.workspace.autoSaveIntervalMinutes"
        class="number-input"
        type="number"
        min="1"
        max="60"
      />
    </label>
  </section>
</template>
