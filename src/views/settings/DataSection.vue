<script setup lang="ts">
import { useSettingsStore } from "../../stores/settings.store";

const settingsStore = useSettingsStore();
const settings = settingsStore.settings;
</script>

<template>
  <section class="settings-section">
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
</template>
