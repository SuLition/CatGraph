<script setup lang="ts">
defineProps<{ hasDocuments: boolean }>();
</script>

<template>
  <div class="empty">
    <p v-if="hasDocuments" class="empty-title">未选择文档</p>
    <p v-else class="empty-title">还没有文档</p>
    <p class="empty-desc">
      <template v-if="hasDocuments">从左侧列表选择一个文档开始阅读。</template>
      <template v-else>点击侧栏右上角的 + 按钮导入 PDF、Markdown 或 TXT 文档。</template>
    </p>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--muted-text-color);
  padding: 48px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.empty-desc {
  font-size: 12px;
  margin: 0;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
}
</style>
