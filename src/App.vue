<script setup lang="ts">
import { ref } from "vue";
import TitleBar from "./components/TitleBar.vue";
import ActivityBar from "./components/ActivityBar.vue";
import SideList from "./components/SideList.vue";
import ContentArea from "./components/ContentArea.vue";
import StatusBar from "./components/StatusBar.vue";

const activeId = ref<string>("experiments");
const selectedExperimentId = ref<string>("exp-base-inertia");
const isSideListCollapsed = ref<boolean>(false);

function handleNavSelect(id: string) {
  activeId.value = id;
}

function handleExperimentSelect(id: string) {
  selectedExperimentId.value = id;
}

function toggleSideList() {
  isSideListCollapsed.value = !isSideListCollapsed.value;
}
</script>

<template>
  <div class="window-frame">
    <TitleBar :side-list-collapsed="isSideListCollapsed" @toggle-side-list="toggleSideList" />

    <main class="workspace" :class="{ 'is-side-list-collapsed': isSideListCollapsed }">
      <ActivityBar :active-id="activeId" @select="handleNavSelect" />
      <div class="side-list-slot">
        <SideList :selected-id="selectedExperimentId" @select="handleExperimentSelect" />
      </div>
      <ContentArea />
    </main>

    <StatusBar code="EXP-BI-001" />
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: 42px var(--side-list-width, 240px) 1fr;
  min-height: 0;
  transition: grid-template-columns 220ms ease;
}

.workspace.is-side-list-collapsed {
  --side-list-width: 0px;
  --content-radius: 0px;
  --border-width: 0px;
}

.side-list-slot {
  overflow: hidden;
  min-width: 0;
}
</style>
