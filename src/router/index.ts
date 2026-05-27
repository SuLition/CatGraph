import {
  createRouter,
  createWebHashHistory,
  type RouteComponent,
  type RouteRecordRaw,
} from "vue-router";
import { DEFAULT_NAV_ID, NAV_ROUTES } from "../constants/navigation";
import CodeView from "../views/CodeView.vue";
import ConstantsView from "../views/ConstantsView.vue";
import DocumentsView from "../views/DocumentsView.vue";
import ExperimentsView from "../views/ExperimentsView.vue";
import GraphView from "../views/GraphView.vue";
import ReferencesView from "../views/ReferencesView.vue";
import SettingsView from "../views/SettingsView.vue";
import AppearanceSection from "../views/settings/AppearanceSection.vue";
import WorkspaceSection from "../views/settings/WorkspaceSection.vue";
import GraphSection from "../views/settings/GraphSection.vue";
import DataSection from "../views/settings/DataSection.vue";
import AiProvidersSection from "../views/settings/AiProvidersSection.vue";
import type { NavId } from "../types/navigation";

export type SettingsSectionId = "appearance" | "workspace" | "graph" | "data" | "ai";

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "appearance";

function route(path: string, navId: NavId, component: RouteComponent): RouteRecordRaw {
  return {
    path,
    name: navId,
    component,
    meta: { ...NAV_ROUTES[navId] },
  };
}

function settingsChild(section: SettingsSectionId, component: RouteComponent): RouteRecordRaw {
  return {
    path: section,
    name: `settings-${section}`,
    component,
    meta: { settingsSection: section },
  };
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: { name: DEFAULT_NAV_ID },
    },
    route("/documents", "documents", DocumentsView),
    route("/experiments", "experiments", ExperimentsView),
    route("/constants", "constants", ConstantsView),
    route("/graph", "graph", GraphView),
    route("/references", "references", ReferencesView),
    route("/code", "code", CodeView),
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
      meta: { ...NAV_ROUTES.settings },
      redirect: { name: `settings-${DEFAULT_SETTINGS_SECTION}` },
      children: [
        settingsChild("appearance", AppearanceSection),
        settingsChild("workspace", WorkspaceSection),
        settingsChild("graph", GraphSection),
        settingsChild("data", DataSection),
        settingsChild("ai", AiProvidersSection),
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: DEFAULT_NAV_ID },
    },
  ],
});
