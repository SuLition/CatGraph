<script setup lang="ts">
import { onMounted } from "vue";

defineProps<{
  hiding?: boolean;
}>();

onMounted(() => {
  // Hand-off: remove the static HTML boot loader once the Vue version mounts.
  // The Vue version uses identical visuals so there's no visible jump.
  document.getElementById("boot-loader")?.remove();
});
</script>

<template>
  <div class="loading-screen" :class="{ 'is-hiding': hiding }" aria-hidden="true">
    <img class="loading-mark" src="/catgraph-logo.svg" alt="" />
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: grid;
  place-items: center;
  background:
    radial-gradient(120% 90% at 18% 12%, #e8f3f6 0%, rgba(232, 243, 246, 0) 55%),
    radial-gradient(130% 100% at 82% 92%, #f6efe2 0%, rgba(246, 239, 226, 0) 60%),
    linear-gradient(135deg, #ecf2f3 0%, #f3eee2 100%);
  transition: opacity 200ms ease-in;
}

.loading-screen.is-hiding {
  opacity: 0;
  pointer-events: none;
}

.loading-mark {
  width: 56px;
  height: 56px;
  animation: loading-breath 1800ms ease-in-out infinite;
}

@keyframes loading-breath {
  0%, 100% { transform: scale(0.96); opacity: 0.78; }
  50%      { transform: scale(1.04); opacity: 1; }
}
</style>
