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
    <svg
      class="loading-mark"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    >
      <path
        d="M32 6
           C 38 6, 42 10, 42 16
           C 48 14, 54 18, 54 24
           C 60 26, 60 34, 54 38
           C 56 44, 50 50, 44 48
           C 42 54, 34 56, 32 52
           C 30 56, 22 54, 20 48
           C 14 50, 8 44, 10 38
           C 4 34, 4 26, 10 24
           C 10 18, 16 14, 22 16
           C 22 10, 26 6, 32 6 Z"
      />
      <path d="M26 28 L31 33 L26 38" stroke-linecap="round" />
      <path d="M33 38 L40 38" stroke-linecap="round" />
    </svg>
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
  color: #bcbec2;
  animation: loading-breath 1800ms ease-in-out infinite;
}

@keyframes loading-breath {
  0%, 100% { transform: scale(0.96); opacity: 0.78; }
  50%      { transform: scale(1.04); opacity: 1; }
}
</style>
