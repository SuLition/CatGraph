import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 文档阅读区的多标签状态(纯内存,不落盘)。
 *
 * 维护"已打开的文档标签"顺序与当前激活标签;切换导航页时由路由级 KeepAlive
 * 让 DocumentsView 常驻,本 store 的状态因此在整个会话内保持不变。
 */
export const useDocumentTabsStore = defineStore("documentTabs", () => {
  /** 标签顺序,值为文档 id。 */
  const openIds = ref<string[]>([]);
  /** 当前激活的文档 id;无打开标签时为 null。 */
  const activeId = ref<string | null>(null);

  function isOpen(id: string): boolean {
    return openIds.value.includes(id);
  }

  /** 打开文档:已打开则仅切换激活,未打开则追加到末尾并激活。 */
  function open(id: string) {
    if (!openIds.value.includes(id)) openIds.value.push(id);
    activeId.value = id;
  }

  /** 切换激活标签;目标未打开时忽略。 */
  function setActive(id: string) {
    if (openIds.value.includes(id)) activeId.value = id;
  }

  /** 关闭标签;关闭的是当前激活标签时,自动激活相邻标签(优先右侧)。 */
  function close(id: string) {
    const idx = openIds.value.indexOf(id);
    if (idx < 0) return;
    openIds.value.splice(idx, 1);
    if (activeId.value === id) {
      activeId.value = openIds.value[idx] ?? openIds.value[idx - 1] ?? null;
    }
  }

  /** 关闭除指定标签外的全部标签,并激活它。 */
  function closeOthers(id: string) {
    if (!openIds.value.includes(id)) return;
    openIds.value = [id];
    activeId.value = id;
  }

  /** 关闭全部标签。 */
  function closeAll() {
    openIds.value = [];
    activeId.value = null;
  }

  /** 清理不再存在的文档 id(删除文档/级联删除文件夹后调用)。 */
  function prune(availableIds: Set<string>) {
    openIds.value = openIds.value.filter((id) => availableIds.has(id));
    if (activeId.value && !availableIds.has(activeId.value)) {
      activeId.value = openIds.value[0] ?? null;
    }
  }

  return { openIds, activeId, isOpen, open, setActive, close, closeOthers, closeAll, prune };
});
