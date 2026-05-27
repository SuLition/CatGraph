import { defineStore } from "pinia";
import { ref } from "vue";

export interface ToastMessage {
  id: string;
  text: string;
  tone: "info" | "success" | "warning" | "error";
}

export const useToastStore = defineStore("toast", () => {
  const items = ref<ToastMessage[]>([]);

  function push(text: string, tone: ToastMessage["tone"] = "info", durationMs = 2400) {
    const id = crypto.randomUUID();
    items.value.push({ id, text, tone });
    window.setTimeout(() => {
      items.value = items.value.filter((message) => message.id !== id);
    }, durationMs);
  }

  return { items, push };
});
