<script setup lang="ts">
import type { NavRouteMeta } from "../types/navigation";

defineProps<{
  meta: NavRouteMeta;
}>();
</script>

<template>
  <section class="placeholder-view">
    <header class="placeholder-header">
      <div class="meta-row">
        <span class="type-chip">视图</span>
        <span class="code">CATGRAPH.{{ meta.navId.toUpperCase() }}</span>
      </div>
      <h1 class="page-title">{{ meta.title }}</h1>
      <p class="page-desc">{{ meta.description }}</p>
    </header>
  </section>
</template>

<style scoped>
.placeholder-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-color);
}

.placeholder-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--panel-background-color);
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
  color: var(--muted-text-color);
  font-size: 11px;
}

.page-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
}

.page-desc {
  margin: 6px 0 0;
  color: var(--subtle-text-color);
  font-size: 12px;
}
</style>
