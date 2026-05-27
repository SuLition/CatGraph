<script setup lang="ts">
import { useSettingsStore } from "../../stores/settings.store";
import type { NodeLabelMode } from "../../types/settings";

const settingsStore = useSettingsStore();
const settings = settingsStore.settings;

function setNodeLabelMode(mode: NodeLabelMode) {
  settings.graph.nodeLabelMode = mode;
}
</script>

<template>
  <section class="settings-section">
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
</template>
