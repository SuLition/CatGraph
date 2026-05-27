import { defineStore } from "pinia";
import { DEFAULT_NAV_ID } from "../constants/navigation";
import {
  DEFAULT_SIDE_LIST_SELECTIONS,
  isSideListNavId,
  SIDE_LISTS,
  type SideListNavId,
} from "../data/nav-side-lists";
import type { NavId } from "../types/navigation";

export const useWorkspaceStore = defineStore("workspace", {
  state: () => ({
    activeNavId: DEFAULT_NAV_ID as NavId,
    selectedSideListIds: { ...DEFAULT_SIDE_LIST_SELECTIONS } as Record<SideListNavId, string>,
    isSideListCollapsed: false,
  }),
  getters: {
    shouldShowSideList: (state) => state.activeNavId !== "settings",
    activeSideListId: (state) => {
      if (!isSideListNavId(state.activeNavId)) return "";

      return state.selectedSideListIds[state.activeNavId];
    },
    activeStatusCode: (state) => {
      if (!isSideListNavId(state.activeNavId)) return undefined;

      const selectedId = state.selectedSideListIds[state.activeNavId];
      const item = SIDE_LISTS[state.activeNavId].groups
        .flatMap((group) => group.items)
        .find((candidate) => candidate.id === selectedId);

      return item?.code;
    },
  },
  actions: {
    setActiveNavId(id: NavId) {
      this.activeNavId = id;
    },
    setSelectedSideListItem(id: string) {
      if (!isSideListNavId(this.activeNavId)) return;

      this.selectedSideListIds[this.activeNavId] = id;
    },
    toggleSideList() {
      this.isSideListCollapsed = !this.isSideListCollapsed;
    },
  },
});
