<script setup lang="ts">
import { Checkmark20Regular } from "@vicons/fluent";
import type { Experiment } from "../../data/knowledge-graph";

defineProps<{
  experiment: Experiment;
}>();
</script>

<template>
  <section class="step-rail">
    <div class="rail-head">
      <span class="rail-title">试验流程 · {{ experiment.steps.length }} 步骤</span>
      <span class="rail-hint">类 Jupyter 单元 · 点击展开 · ⇧⏎ 重新执行</span>
      <span class="rail-status">
        <Checkmark20Regular class="rail-check" aria-hidden="true" />
        全部步骤已通过校验
      </span>
    </div>

    <div class="cells">
      <article
        v-for="(step, i) in experiment.steps"
        :key="step.id"
        class="cell"
      >
        <header class="cell-head">
          <span class="cell-in">In [{{ i + 1 }}]:</span>
          <span class="cell-name">{{ step.name }}</span>
          <span class="cell-ok">
            <Checkmark20Regular class="cell-check" aria-hidden="true" />
          </span>
        </header>

        <div class="cell-params">
          <div v-for="p in step.params.slice(0, 3)" :key="p.k" class="param">
            <span class="param-key">{{ p.k }}</span>
            <span class="param-eq">=</span>
            <span class="param-val">{{ p.v }}</span>
            <span v-if="p.u" class="param-unit">{{ p.u }}</span>
          </div>
        </div>

        <div v-if="step.formula" class="cell-formula">
          {{ step.formula }}
        </div>

        <div class="cell-outputs">
          <span class="cell-out">Out [{{ i + 1 }}]:</span>
          <div v-for="o in step.outputs.slice(0, 2)" :key="o.k" class="output">
            <span class="output-key">{{ o.k }}</span>
            <template v-if="o.v">
              <span class="output-arrow">→</span>
              <span class="output-val">{{ o.v }}</span>
            </template>
          </div>
        </div>

        <span
          v-if="i < experiment.steps.length - 1"
          class="cell-connector"
          aria-hidden="true"
        ></span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.step-rail {
  height: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 14px;
  border-top: 1px solid rgb(137 160 174 / 18%);
  background: rgb(255 255 255 / 60%);
  overflow: hidden;
}

.rail-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.rail-title {
  font-size: 12px;
  font-weight: 600;
  color: #1f2933;
}

.rail-hint {
  font-size: 11px;
  color: #8a939c;
}

.rail-status {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #5a6670;
}

.rail-check {
  width: 13px;
  height: 13px;
  color: oklch(50% 0.18 145);
}

.cells {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  min-height: 0;
}

.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: rgb(249 249 247 / 90%);
  border: 1px solid rgb(137 160 174 / 18%);
  border-radius: 8px;
  overflow: hidden;
}

.cell-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.cell-in {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px;
  color: #8a939c;
}

.cell-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2933;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-ok {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
}

.cell-check {
  width: 12px;
  height: 12px;
  color: oklch(50% 0.18 145);
}

.cell-params {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10.5px;
}

.param {
  display: flex;
  gap: 6px;
}

.param-key {
  color: oklch(50% 0.14 280);
}

.param-eq {
  color: #8a939c;
}

.param-val {
  color: #1f2933;
}

.param-unit {
  color: #8a939c;
}

.cell-formula {
  padding: 4px 6px;
  background: rgb(255 255 255 / 70%);
  border: 1px dashed rgb(137 160 174 / 24%);
  border-radius: 4px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10.5px;
  color: #1f2933;
}

.cell-outputs {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-out {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10px;
  color: #8a939c;
}

.output {
  display: flex;
  gap: 6px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 10.5px;
}

.output-key {
  color: oklch(45% 0.16 145);
}

.output-arrow {
  color: #8a939c;
}

.output-val {
  color: #1f2933;
}

.cell-connector {
  position: absolute;
  right: -7px;
  top: 50%;
  width: 14px;
  height: 2px;
  background: rgb(137 160 174 / 40%);
  transform: translateY(-50%);
  z-index: 1;
}
</style>
