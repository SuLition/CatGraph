<script setup lang="ts">
defineProps<{ documentId: string }>();
</script>

<template>
  <div class="viewer-placeholder">
    <p class="placeholder-title">Excel 表格</p>
    <p class="placeholder-desc">.xlsx 渲染将在二期支持。</p>
  </div>
</template>

<style scoped>
.viewer-placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px;
  color: var(--muted-text-color);
}

.placeholder-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.placeholder-desc {
  font-size: 12px;
  margin: 0;
}
</style>
