<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <section class="content-area">
    <RouterView />
  </section>
</template>

<style scoped>
.content-area {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f7;
  border-radius: var(--content-radius, 14px) 0 0 var(--content-radius, 14px);
  border-left: var(--border-width, 1px) solid rgb(137 160 174 / 18%);
  overflow: hidden;
  transition: border-radius 220ms ease;
}
</style>
