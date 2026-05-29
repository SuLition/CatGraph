<script setup lang="ts">
import { useToastStore } from "../../stores/toast.store";

const toasts = useToastStore();
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <div v-for="item in toasts.items" :key="item.id" class="toast" :data-tone="item.tone">
      {{ item.text }}
    </div>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 28px;
  right: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10000;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  padding: 8px 14px;
  background: var(--surface-overlay-color);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 4px 18px var(--shadow-popover-color);
  max-width: 320px;
}

.toast[data-tone="success"] {
  background: var(--success-color);
}

.toast[data-tone="warning"] {
  background: var(--warning-color);
}

.toast[data-tone="error"] {
  background: var(--danger-color);
}
</style>
