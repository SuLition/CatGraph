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
import type { NavId } from "../types/navigation";

function route(path: string, navId: NavId, component: RouteComponent): RouteRecordRaw {
  return {
    path,
    name: navId,
    component,
    meta: { ...NAV_ROUTES[navId] },
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
    route("/settings", "settings", SettingsView),
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: DEFAULT_NAV_ID },
    },
  ],
});
