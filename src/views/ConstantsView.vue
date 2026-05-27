<script setup lang="ts">
import { NAV_ROUTES } from "../constants/navigation";
import PlaceholderView from "./PlaceholderView.vue";
</script>

<template>
  <PlaceholderView :meta="NAV_ROUTES.constants" />
</template>
