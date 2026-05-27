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
  background: rgb(30 30 30 / 95%);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 4px 18px rgb(0 0 0 / 22%);
  max-width: 320px;
}

.toast[data-tone="success"] {
  background: #10b981;
}

.toast[data-tone="warning"] {
  background: #f59e0b;
}

.toast[data-tone="error"] {
  background: #d44747;
}
</style>
