<script setup lang="ts">
import { onMounted, watchEffect } from "vue";
import { useRoute } from "vue-router";
import TitleBar from "./components/layout/TitleBar.vue";
import ActivityBar from "./components/layout/ActivityBar.vue";
import SideList from "./components/layout/SideList.vue";
import ContentArea from "./components/layout/ContentArea.vue";
import StatusBar from "./components/layout/StatusBar.vue";
import { DEFAULT_NAV_ID } from "./constants/navigation";
import { useSettingsStore } from "./stores/settings.store";
import { useWorkspaceStore } from "./stores/workspace.store";
import type { NavId } from "./types/navigation";

const route = useRoute();
const workspace = useWorkspaceStore();
const settingsStore = useSettingsStore();

watchEffect(() => {
  workspace.setActiveNavId((route.meta.navId as NavId | undefined) ?? DEFAULT_NAV_ID);
});

onMounted(() => {
  void settingsStore.loadSettings();
});
</script>

<template>
  <div
    class="window-frame"
    :class="[
      `theme-${settingsStore.settings.appearance.theme}`,
      `density-${settingsStore.settings.appearance.density}`,
    ]"
  >
    <TitleBar
      :side-list-collapsed="workspace.isSideListCollapsed"
      @toggle-side-list="workspace.toggleSideList"
    />

    <main
      class="workspace"
      :class="{
        'is-side-list-collapsed': workspace.isSideListCollapsed || !workspace.shouldShowSideList,
      }"
    >
      <ActivityBar />
      <div class="side-list-slot">
        <SideList
          v-if="workspace.shouldShowSideList"
          :nav-id="workspace.activeNavId"
          :selected-id="workspace.activeSideListId"
          @select="workspace.setSelectedSideListItem"
        />
      </div>
      <ContentArea />
    </main>

    <StatusBar :code="workspace.activeStatusCode" />
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
