<script setup lang="ts">
import { computed } from "vue";
import { PROVIDER_ORDER, PROVIDER_PRESETS } from "../../constants/ai-providers";
import AiProviderCard from "../../components/settings/AiProviderCard.vue";
import { useSettingsStore } from "../../stores/settings.store";
import type { AiProviderConfig, AiProviderId } from "../../types/ai-provider";

const settingsStore = useSettingsStore();
const ai = settingsStore.settings.ai;

const enabledProviders = computed(() =>
  PROVIDER_ORDER.filter((id) => ai.providers[id].enabled && ai.providers[id].apiKey.trim() !== ""),
);

const defaultProviderOptions = computed(() => [
  { id: "" as const, label: "未设置(每次手动选择)" },
  ...enabledProviders.value.map((id) => ({ id, label: PROVIDER_PRESETS[id].label })),
]);

function setDefaultProvider(id: AiProviderId | "") {
  ai.defaultProvider = id;
}

function updateProviderConfig(id: AiProviderId, config: AiProviderConfig) {
  Object.assign(ai.providers[id], config);
}
</script>

<template>
  <section class="settings-section">
    <div class="section-heading">
      <h2>AI 服务商</h2>
      <p>配置 GPT、Claude、DeepSeek 等服务商,启用后可用作默认 AI 提供者。</p>
    </div>

    <div class="setting-row">
      <div class="setting-copy">
        <span class="setting-title">默认服务商</span>
        <span class="setting-desc"
          >应用内 AI 操作的默认调用方,仅展示已启用且填了 Key 的服务商。</span
        >
      </div>
      <select
        class="text-input default-select"
        :value="ai.defaultProvider"
        @change="
          setDefaultProvider(($event.target as HTMLSelectElement).value as AiProviderId | '')
        "
      >
        <option
          v-for="option in defaultProviderOptions"
          :key="option.id || 'none'"
          :value="option.id"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </section>

  <section class="provider-list">
    <AiProviderCard
      v-for="id in PROVIDER_ORDER"
      :key="id"
      :provider-id="id"
      :config="ai.providers[id]"
      @update:config="updateProviderConfig(id, $event)"
    />
  </section>
</template>

<style scoped>
.provider-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.default-select {
  width: min(280px, 100%);
  flex: 0 0 auto;
}
</style>
