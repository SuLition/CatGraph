<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  position: { x: number; y: number };
  sourceText: string;
  status: "loading" | "ok" | "error";
  result: string;
  message: string;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
  (e: "close"): void;
}>();

const copied = ref(false);

const popoverStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.result);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // 如果 Clipboard API 不可用，静默失败
  }
}
</script>

<template>
  <div
    class="translation-popover"
    :style="popoverStyle"
    role="dialog"
    aria-label="翻译结果"
    @pointerdown.stop
    @mousedown.stop
  >
    <!-- 加载中 -->
    <div v-if="status === 'loading'" class="popover-body popover-row">
      <span class="spinner" aria-hidden="true"></span>
      <span>翻译中…</span>
    </div>

    <!-- 成功 -->
    <div v-else-if="status === 'ok'" class="popover-body popover-col">
      <div class="popover-row popover-header">
        <span class="popover-label">翻译结果</span>
        <button type="button" class="popover-btn" @click="handleCopy">
          {{ copied ? "已复制" : "复制" }}
        </button>
      </div>
      <div class="popover-text">{{ result }}</div>
    </div>

    <!-- 错误 -->
    <div v-else class="popover-body popover-col">
      <div class="popover-text popover-error">{{ message }}</div>
      <div class="popover-row popover-footer">
        <button type="button" class="popover-btn popover-btn-primary" @click="emit('retry')">
          重试
        </button>
        <button type="button" class="popover-btn" @click="emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translation-popover {
  position: fixed;
  z-index: 9999;
  min-width: 280px;
  max-width: 420px;
  background: rgb(255 255 255 / 96%);
  color: #222;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 10%), 0 1px 3px rgb(0 0 0 / 6%);
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
}

.popover-body {
  padding: 10px 14px;
}

.popover-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.popover-header {
  justify-content: space-between;
}

.popover-footer {
  justify-content: flex-end;
  margin-top: 4px;
}

.popover-label {
  font-size: 11px;
  color: rgb(0 0 0 / 40%);
}

.popover-text {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: #222;
}

.popover-error {
  color: #dc2626;
}

.popover-btn {
  padding: 4px 10px;
  background: rgb(0 0 0 / 5%);
  border: none;
  border-radius: 4px;
  color: #444;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.popover-btn:hover {
  background: rgb(0 0 0 / 10%);
  color: #111;
}

.popover-btn-primary {
  background: rgb(59 130 246 / 12%);
  color: #2563eb;
}

.popover-btn-primary:hover {
  background: rgb(59 130 246 / 22%);
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgb(0 0 0 / 10%);
  border-top-color: #666;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
