<script setup lang="ts">
defineProps<{
  code?: string;
}>();
</script>

<template>
  <footer class="status-bar">
    <span class="status-item sync"><span class="sync-dot" aria-hidden="true"></span>已同步</span>
    <span class="status-item">图谱 · 38 节点 / 64 关系</span>
    <span class="status-spacer"></span>
    <span class="status-item">UTF-8</span>
    <span v-if="code" class="status-item mono">{{ code }}</span>
    <span class="status-item">v 0.4.2-alpha</span>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 24px;
  padding: 0 12px;
  background: var(--statusbar-background-color);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: var(--muted-text-color);
  user-select: none;
}

.status-spacer {
  flex: 1;
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-item.mono {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.sync-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--success-color);
}
</style>
