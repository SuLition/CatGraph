import { onBeforeUnmount, onMounted } from "vue";

type UnlistenFn = () => void;

export interface ExternalFileDropOptions {
  /** Resolve the folder id under the given client coordinates (null → unfiled/root). */
  resolveFolderId: (clientX: number, clientY: number) => string | null;
  onHover: (folderId: string | null) => void;
  onDrop: (paths: string[], folderId: string | null) => void | Promise<void>;
  isEnabled?: () => boolean;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Bridges OS file drags into the folder tree. Tauri delivers physical cursor
 * coordinates, so we convert by devicePixelRatio before hit-testing the DOM.
 */
export function useExternalFileDrop(options: ExternalFileDropOptions) {
  let unlisten: UnlistenFn | null = null;

  onMounted(async () => {
    if (!isTauri()) return;
    try {
      const { getCurrentWebview } = await import("@tauri-apps/api/webview");
      const webview = getCurrentWebview();
      unlisten = await webview.onDragDropEvent((event) => {
        const enabled = !options.isEnabled || options.isEnabled();
        const payload = event.payload;
        const dpr = window.devicePixelRatio || 1;

        if (payload.type === "enter" || payload.type === "over") {
          if (!enabled) return;
          options.onHover(options.resolveFolderId(payload.position.x / dpr, payload.position.y / dpr));
        } else if (payload.type === "leave") {
          options.onHover(null);
        } else if (payload.type === "drop") {
          options.onHover(null);
          if (!enabled) return;
          const folderId = options.resolveFolderId(
            payload.position.x / dpr,
            payload.position.y / dpr,
          );
          void options.onDrop(payload.paths, folderId);
        }
      });
    } catch {
      // Best-effort: ignore environments where the drag-drop API is unavailable.
    }
  });

  onBeforeUnmount(() => {
    unlisten?.();
    unlisten = null;
  });
}
