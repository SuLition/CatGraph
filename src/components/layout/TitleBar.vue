<script setup lang="ts">
import { computed } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BorderOutlined,
  CloseOutlined,
  MinusOutlined,
} from "@vicons/antd";
import { PanelLeft20Regular, PanelLeftExpand20Regular } from "@vicons/fluent";

const props = defineProps<{
  sideListCollapsed?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-side-list"): void;
}>();

const menuItems = ["文件", "编辑", "查看", "窗口", "帮助"];

const appIconLabel = computed(() => (props.sideListCollapsed ? "展开侧边列表" : "折叠侧边列表"));

function currentWindow() {
  if (!("__TAURI_INTERNALS__" in window)) {
    return null;
  }

  return getCurrentWindow();
}

async function minimizeWindow() {
  await currentWindow()?.minimize();
}

async function closeWindow() {
  await currentWindow()?.close();
}

async function toggleMaximizeWindow() {
  await currentWindow()?.toggleMaximize();
}

function handleAppIconClick() {
  emit("toggle-side-list");
}
</script>

<template>
  <header class="titlebar">
    <div class="titlebar-left">
      <button
        class="icon-button app-icon"
        :class="{ 'is-active': sideListCollapsed }"
        :aria-label="appIconLabel"
        :aria-pressed="sideListCollapsed ? 'true' : 'false'"
        type="button"
        @click="handleAppIconClick"
      >
        <component
          :is="sideListCollapsed ? PanelLeftExpand20Regular : PanelLeft20Regular"
          class="titlebar-icon app-symbol"
          aria-hidden="true"
        />
      </button>

      <button class="nav-button" aria-label="后退" type="button">
        <ArrowLeftOutlined class="titlebar-icon nav-symbol" aria-hidden="true" />
      </button>
      <button class="nav-button is-disabled" aria-label="前进" type="button">
        <ArrowRightOutlined class="titlebar-icon nav-symbol" aria-hidden="true" />
      </button>

      <nav class="menu" aria-label="应用菜单">
        <button v-for="item in menuItems" :key="item" class="menu-item" type="button">
          {{ item }}
        </button>
      </nav>
    </div>

    <div class="titlebar-drag-region" data-tauri-drag-region></div>

    <div class="titlebar-controls">
      <button class="window-control" aria-label="最小化" type="button" @click="minimizeWindow">
        <MinusOutlined class="titlebar-icon control-symbol" aria-hidden="true" />
      </button>
      <button
        class="window-control"
        aria-label="最大化"
        type="button"
        @click="toggleMaximizeWindow"
      >
        <BorderOutlined class="titlebar-icon control-symbol" aria-hidden="true" />
      </button>
      <button
        class="window-control close-control"
        aria-label="关闭"
        type="button"
        @click="closeWindow"
      >
        <CloseOutlined class="titlebar-icon control-symbol" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  border-bottom: 1px solid rgb(137 160 174 / 18%);
  color: #5a6670;
  user-select: none;
}

.titlebar-left {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
  height: 100%;
  padding: 4px;
  box-sizing: border-box;
}

.icon-button,
.nav-button,
.menu-item,
.window-control {
  display: inline-grid;
  place-items: center;
  height: 100%;
  border: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  cursor: default;
}

.icon-button,
.nav-button {
  width: 34px;
  border-radius: 4px;
  cursor: pointer;
}

.titlebar-icon {
  display: block;
  width: 17px;
  height: 17px;
  color: currentColor;
  flex: none;
}

.app-symbol {
  width: 16px;
  height: 16px;
}

.control-symbol {
  width: 16px;
  height: 16px;
}

.nav-button {
  color: #5f6f78;
}

.nav-button.is-disabled {
  color: #b3c0c7;
}

.menu {
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: 14px;
}

.menu-item {
  min-width: 54px;
  padding: 0 12px;
  font-size: 14px;
  letter-spacing: 0;
  white-space: nowrap;
  border-radius: 4px;
  cursor: pointer;
}

.icon-button:hover,
.nav-button:hover,
.menu-item:hover,
.window-control:hover {
  background: var(--hover-color);
}

.app-icon.is-active {
  color: var(--accent-color);
  background: rgb(137 160 174 / 12%);
}

.titlebar-controls {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  height: 100%;
  margin-left: auto;
}

.titlebar-drag-region {
  align-self: stretch;
  flex: 1 1 auto;
  min-width: 32px;
}

.window-control {
  width: 44px;
  color: #18212a;
}

.close-control:hover {
  color: #ffffff;
  background: #d83b36;
}
</style>
