import { createSnippet } from "../../../models/snippet.model";
import { useSnippetsStore } from "../../../stores/snippets.store";
import { useToastStore } from "../../../stores/toast.store";
import type { SnippetAnchor } from "../../../types/snippet";

export type SelectionActionId = "add-to-snippets" | "ask-ai" | "translate";

export interface SelectionActionContext {
  text: string;
  anchor: SnippetAnchor | null;
}

export async function dispatchSelectionAction(
  id: SelectionActionId,
  ctx: SelectionActionContext,
): Promise<void> {
  const toast = useToastStore();

  if (id === "add-to-snippets") {
    if (!ctx.anchor) {
      toast.push("无法定位选区，请缩小到一页内重试", "warning");
      return;
    }

    const snippets = useSnippetsStore();
    const snippet = createSnippet({ text: ctx.text, anchor: ctx.anchor });
    try {
      await snippets.add(snippet);
      toast.push("已加入知识库", "success");
    } catch (e) {
      toast.push(e instanceof Error ? e.message : String(e), "error");
    }
    return;
  }

  const labels: Record<Exclude<SelectionActionId, "add-to-snippets" | "translate">, string> = {
    "ask-ai": "询问 AI",
  };
  if (id === "translate") return;
  toast.push(`${labels[id]} 功能待接入`, "info");
}
