<script setup lang="ts">
import { Play20Regular } from "@vicons/fluent";
import type { Experiment } from "../../types/experiment";

defineProps<{
  experiment: Experiment;
}>();

const tabs = ["图谱与流程", "原始数据", "修订历史", "导出"];
</script>

<template>
  <header class="bp-header">
    <div class="meta">
      <div class="meta-row">
        <span class="type-chip">试验</span>
        <span class="code">{{ experiment.code }}</span>
        <span class="rev">· 修订 v3 · 2026-05-21</span>
      </div>
      <h1 class="exp-name">{{ experiment.name }}</h1>
    </div>

    <nav class="tabs" aria-label="视图切换">
      <button
        v-for="(tab, i) in tabs"
        :key="tab"
        type="button"
        class="tab"
        :class="{ 'is-active': i === 0 }"
      >
        {{ tab }}
      </button>
    </nav>

    <div class="actions">
      <div class="result-chip">
        <span class="result-label">最终结果</span>
        <code class="result-value">
          {{ experiment.finalResult.name }} = {{ experiment.finalResult.value }}
          {{ experiment.finalResult.unit }}
        </code>
      </div>
      <button type="button" class="run-btn">
        <Play20Regular class="run-icon" aria-hidden="true" />
        重新计算
      </button>
    </div>
  </header>
</template>

<style scoped>
.bp-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  border-bottom: 1px solid rgb(137 160 174 / 18%);
  background: rgb(255 255 255 / 60%);
  flex-shrink: 0;
}

.meta {
  flex: 0 0 auto;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-chip {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  background: oklch(94% 0.05 28);
  color: oklch(45% 0.15 28);
}

.code {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  color: #5a6670;
  font-size: 11px;
}

.rev {
  color: #8a939c;
  font-size: 11px;
}

.exp-name {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2933;
}

.tabs {
  margin-left: 16px;
  display: flex;
  gap: 0;
  padding: 3px;
  background: rgb(249 249 247 / 80%);
  border: 1px solid rgb(137 160 174 / 18%);
  border-radius: 8px;
}

.tab {
  padding: 5px 14px;
  font-size: 12px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #5a6670;
  cursor: pointer;
  font-weight: 400;
}

.tab.is-active {
  background: #ffffff;
  color: #1f2933;
  font-weight: 600;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
}

.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-chip {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: oklch(96% 0.05 145);
  border: 1px solid oklch(85% 0.08 145);
}

.result-label {
  font-size: 10px;
  color: oklch(40% 0.12 145);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.result-value {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-weight: 600;
  color: oklch(35% 0.15 145);
  font-size: 13px;
}

.run-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border-radius: 6px;
  border: 0;
  background: #1a6b8a;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.run-btn:hover {
  background: #155a73;
}

.run-icon {
  width: 13px;
  height: 13px;
  color: currentColor;
}
</style>
