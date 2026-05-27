<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import TitleBar from "./components/layout/TitleBar.vue";
import ActivityBar from "./components/layout/ActivityBar.vue";
import SideList from "./components/layout/SideList.vue";
import ContentArea from "./components/layout/ContentArea.vue";
import StatusBar from "./components/layout/StatusBar.vue";
import LoadingScreen from "./components/layout/LoadingScreen.vue";
import ToastStack from "./components/layout/ToastStack.vue";
import DocumentImportButton from "./components/documents/DocumentImportButton.vue";
import { DEFAULT_NAV_ID } from "./constants/navigation";
import { documentsToSideListGroups } from "./data/nav-side-lists";
import { SIDE_LIST_MAX_WIDTH, SIDE_LIST_MIN_WIDTH } from "./services/settings.service";
import { useDocumentsStore } from "./stores/documents.store";
import { useSettingsStore } from "./stores/settings.store";
import { useSnippetsStore } from "./stores/snippets.store";
import { useWorkspaceStore } from "./stores/workspace.store";
import type { NavId } from "./types/navigation";

const route = useRoute();
const workspace = useWorkspaceStore();
const settingsStore = useSettingsStore();
const documents = useDocumentsStore();
const snippets = useSnippetsStore();

watchEffect(() => {
  workspace.setActiveNavId((route.meta.navId as NavId | undefined) ?? DEFAULT_NAV_ID);
});

const MIN_LOADING_MS = 400;
const LOADING_TIMEOUT_MS = 5000;
const HIDE_ANIMATION_MS = 200;

const isLoading = ref(true);
const isHiding = ref(false);

onMounted(() => {
  const start = performance.now();
  void documents.load();
  void snippets.load();

  const settle = () => {
    if (isHiding.value) return;
    isHiding.value = true;
    window.setTimeout(() => {
      isLoading.value = false;
    }, HIDE_ANIMATION_MS);
  };

  const finish = () => {
    const elapsed = performance.now() - start;
    const wait = Math.max(0, MIN_LOADING_MS - elapsed);
    window.setTimeout(settle, wait);
  };

  const timeout = window.setTimeout(settle, LOADING_TIMEOUT_MS);

  void settingsStore
    .loadSettings()
    .catch((err) => {
      console.error("failed to load settings", err);
    })
    .finally(() => {
      window.clearTimeout(timeout);
      finish();
    });
});

const isResizing = ref(false);
const selectedSideListId = computed(() => workspace.activeSideListId);

const documentSideListGroups = computed(() =>
  workspace.activeNavId === "documents" ? documentsToSideListGroups(documents.documents) : undefined,
);

const showResizer = computed(
  () =>
    workspace.shouldShowSideList &&
    !workspace.isSideListCollapsed,
);

function onResizerPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();

  const startX = event.clientX;
  const startWidth = settingsStore.settings.workspace.sideListWidth;
  isResizing.value = true;
  document.body.classList.add("is-resizing-side-list");

  function onMove(ev: PointerEvent) {
    const next = startWidth + (ev.clientX - startX);
    const clamped = Math.min(SIDE_LIST_MAX_WIDTH, Math.max(SIDE_LIST_MIN_WIDTH, next));
    settingsStore.settings.workspace.sideListWidth = clamped;
  }

  function onUp() {
    isResizing.value = false;
    document.body.classList.remove("is-resizing-side-list");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function onResizerDoubleClick() {
  settingsStore.settings.workspace.sideListWidth = 240;
}

function handleSideListSelect(id: string) {
  workspace.setSelectedSideListItem(id);
}

function handleDocumentImported(id: string) {
  workspace.selectedSideListIds.documents = id;
}
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
      :minimal="isLoading"
      @toggle-side-list="workspace.toggleSideList"
    />

    <main
      v-if="!isLoading"
      class="workspace"
      :class="{
        'is-side-list-collapsed': workspace.isSideListCollapsed || !workspace.shouldShowSideList,
        'is-resizing': isResizing,
      }"
    >
      <ActivityBar />
      <div class="side-list-slot">
        <SideList
          v-if="workspace.shouldShowSideList"
          :nav-id="workspace.activeNavId"
          :selected-id="selectedSideListId"
          :dynamic-groups="documentSideListGroups"
          @select="handleSideListSelect"
        >
          <template v-if="workspace.activeNavId === 'documents'" #header-trailing>
            <DocumentImportButton @imported="handleDocumentImported" />
          </template>
        </SideList>
      </div>
      <ContentArea />
      <div
        v-if="showResizer"
        class="side-list-resizer"
        :class="{ 'is-active': isResizing }"
        role="separator"
        aria-orientation="vertical"
        :aria-valuenow="settingsStore.settings.workspace.sideListWidth"
        :aria-valuemin="SIDE_LIST_MIN_WIDTH"
        :aria-valuemax="SIDE_LIST_MAX_WIDTH"
        title="拖拽调整宽度,双击重置"
        @pointerdown="onResizerPointerDown"
        @dblclick="onResizerDoubleClick"
      ></div>
    </main>
    <div v-else class="workspace-placeholder"></div>

    <StatusBar v-if="!isLoading" :code="workspace.activeStatusCode" />
    <div v-else class="statusbar-placeholder"></div>

    <LoadingScreen v-if="isLoading" :hiding="isHiding" />
    <ToastStack />
  </div>
</template>

<style scoped>
.workspace {
  position: relative;
  display: grid;
  grid-template-columns: 42px var(--side-list-width, 240px) 1fr;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  transition: grid-template-columns 220ms ease;
}

.workspace.is-resizing {
  transition: none;
}

.workspace.is-resizing :deep(*) {
  user-select: none !important;
}

.workspace.is-side-list-collapsed {
  grid-template-columns: 42px 0px 1fr;
  --content-radius: 0px;
  --border-width: 0px;
}

.side-list-slot {
  overflow: hidden;
  min-width: 0;
}

.workspace-placeholder,
.statusbar-placeholder {
  min-height: 0;
}

.side-list-resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(42px + var(--side-list-width, 240px));
  width: 8px;
  transform: translateX(-4px);
  cursor: col-resize;
  z-index: 20;
  touch-action: none;
  background: transparent;
}

.side-list-resizer::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: transparent;
  border-radius: 2px;
  transition:
    background-color 150ms ease,
    width 150ms ease;
}

.side-list-resizer:hover::after,
.side-list-resizer.is-active::after {
  background: color-mix(in srgb, var(--accent-color) 65%, transparent);
  width: 3px;
}
</style>
