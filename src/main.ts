import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";

// Reveal the OS window only after the boot loader has painted, otherwise a
// transparent/Mica frame flashes before any HTML is on screen.
async function revealAppWindowAfterPaint() {
  if (!("__TAURI_INTERNALS__" in window)) return;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().show();
  } catch (err) {
    console.error("failed to show app window", err);
  }
}
void revealAppWindowAfterPaint();

createApp(App).use(createPinia()).use(router).mount("#app");
