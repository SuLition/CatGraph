import { ref } from "vue";

const isCollapsed = ref(false);

export function useSnippetPanel() {
  function toggle() {
    isCollapsed.value = !isCollapsed.value;
  }
  return { isCollapsed, toggle };
}
