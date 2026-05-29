<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Checkmark20Filled,
  ChevronDown20Regular,
  ChevronRight20Regular,
  Dismiss20Filled,
  Eye20Regular,
  EyeOff20Regular,
  Open20Regular,
  Play20Regular,
} from "@vicons/fluent";
import { PROVIDER_PRESETS } from "../../constants/ai-providers";
import { testProviderConnection } from "../../services/ai-client.service";
import type { AiProviderConfig, AiProviderId, ProviderTestResult } from "../../types/ai-provider";

const props = defineProps<{
  providerId: AiProviderId;
  config: AiProviderConfig;
  initiallyExpanded?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:config", config: AiProviderConfig): void;
}>();

const preset = computed(() => PROVIDER_PRESETS[props.providerId]);
const expanded = ref(props.initiallyExpanded ?? false);
const showKey = ref(false);
const testing = ref(false);
const testResult = ref<ProviderTestResult | null>(null);

const isConfigured = computed(() => props.config.apiKey.trim().length > 0);

const statusLabel = computed(() => {
  if (!isConfigured.value) return "未配置";
  return props.config.enabled ? "已启用" : "未启用";
});

const statusTone = computed(() => {
  if (!isConfigured.value) return "muted";
  return props.config.enabled ? "ok" : "warn";
});

function toggleExpand() {
  expanded.value = !expanded.value;
}

function toggleShowKey() {
  showKey.value = !showKey.value;
}

function patchConfig(patch: Partial<AiProviderConfig>) {
  emit("update:config", { ...props.config, ...patch });
}

async function runTest() {
  if (testing.value) return;
  testing.value = true;
  testResult.value = null;
  try {
    testResult.value = await testProviderConnection(props.providerId, props.config);
  } catch (err) {
    testResult.value = {
      success: false,
      latencyMs: 0,
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    testing.value = false;
  }
}
</script>

<template>
  <article class="provider-card" :class="{ 'is-expanded': expanded }">
    <header class="card-head">
      <button class="head-toggle" type="button" @click="toggleExpand">
        <component
          :is="expanded ? ChevronDown20Regular : ChevronRight20Regular"
          class="chevron"
          aria-hidden="true"
        />
        <span class="dot" :style="{ background: preset.accent }" aria-hidden="true"></span>
        <span class="provider-label">{{ preset.label }}</span>
        <span class="status-badge" :class="`tone-${statusTone}`">{{ statusLabel }}</span>
      </button>

      <label class="head-switch" @click.stop>
        <input
          :checked="config.enabled"
          type="checkbox"
          class="switch-input"
          :aria-label="`启用 ${preset.shortLabel}`"
          @change="patchConfig({ enabled: ($event.target as HTMLInputElement).checked })"
        />
      </label>
    </header>

    <div v-if="expanded" class="card-body">
      <label class="field">
        <span class="field-label">API Key</span>
        <div class="key-input">
          <input
            :value="config.apiKey"
            :type="showKey ? 'text' : 'password'"
            class="text-input"
            spellcheck="false"
            autocomplete="off"
            :placeholder="`输入 ${preset.shortLabel} API Key`"
            @input="patchConfig({ apiKey: ($event.target as HTMLInputElement).value })"
          />
          <button
            type="button"
            class="icon-btn"
            :aria-label="showKey ? '隐藏 Key' : '显示 Key'"
            @click="toggleShowKey"
          >
            <component :is="showKey ? EyeOff20Regular : Eye20Regular" aria-hidden="true" />
          </button>
        </div>
        <a class="hint-link" :href="preset.docsUrl" target="_blank" rel="noopener">
          <Open20Regular class="hint-icon" aria-hidden="true" />
          获取 API Key
        </a>
      </label>

      <label class="field">
        <span class="field-label">Base URL</span>
        <input
          :value="config.baseUrl"
          type="text"
          class="text-input"
          spellcheck="false"
          autocomplete="off"
          :placeholder="preset.defaultBaseUrl"
          @input="patchConfig({ baseUrl: ($event.target as HTMLInputElement).value })"
        />
        <span class="hint-text">留空表示使用默认地址 · {{ preset.defaultBaseUrl }}</span>
      </label>

      <label class="field">
        <span class="field-label">默认模型</span>
        <select
          :value="config.defaultModel"
          class="text-input"
          @change="patchConfig({ defaultModel: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="model in preset.models" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </label>

      <div class="actions">
        <button
          type="button"
          class="test-btn"
          :disabled="testing || !isConfigured"
          @click="runTest"
        >
          <Play20Regular class="btn-icon" aria-hidden="true" />
          {{ testing ? "测试中…" : "测试连接" }}
        </button>

        <div
          v-if="testResult"
          class="test-result"
          :class="testResult.success ? 'is-ok' : 'is-fail'"
        >
          <component
            :is="testResult.success ? Checkmark20Filled : Dismiss20Filled"
            class="result-icon"
            aria-hidden="true"
          />
          <span>{{ testResult.message }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.provider-card {
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  border-radius: 10px;
  overflow: hidden;
}

.provider-card.is-expanded {
  box-shadow: 0 1px 3px var(--shadow-soft-color);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.head-toggle {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--text-color);
  min-width: 0;
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--subtle-text-color);
  flex: 0 0 auto;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.provider-label {
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.status-badge.tone-muted {
  background: var(--active-item-background-color);
  color: var(--muted-text-color);
}

.status-badge.tone-warn {
  background: oklch(95% 0.07 80);
  color: oklch(45% 0.12 60);
}

.status-badge.tone-ok {
  background: oklch(94% 0.08 145);
  color: oklch(40% 0.14 145);
}

.head-switch {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}

.switch-input {
  appearance: none;
  width: 38px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid var(--border-strong-color);
  background: var(--switch-track-color);
  position: relative;
  cursor: pointer;
}

.switch-input::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--surface-control-strong-color);
  box-shadow: 0 1px 2px var(--shadow-soft-color);
  transition: transform 160ms ease;
}

.switch-input:checked {
  border-color: var(--accent-color);
  background: var(--accent-color);
}

.switch-input:checked::before {
  transform: translateX(16px);
}

.card-body {
  padding: 4px 16px 18px;
  border-top: 1px solid var(--border-subtle-color);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
}

.text-input {
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-control-color);
  background: var(--surface-control-color);
  color: var(--text-color);
  font: inherit;
  font-size: 13px;
  outline: none;
  padding: 0 10px;
  width: 100%;
}

.text-input:focus {
  border-color: color-mix(in srgb, var(--accent-color) 42%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent);
}

select.text-input {
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--muted-text-color) 50%),
    linear-gradient(135deg, var(--muted-text-color) 50%, transparent 50%);
  background-position:
    calc(100% - 16px) 50%,
    calc(100% - 11px) 50%;
  background-size:
    5px 5px,
    5px 5px;
  background-repeat: no-repeat;
  padding-right: 28px;
  cursor: pointer;
}

.key-input {
  position: relative;
  display: flex;
  align-items: center;
}

.key-input .text-input {
  padding-right: 36px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.icon-btn {
  position: absolute;
  right: 4px;
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--muted-text-color);
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--hover-color);
}

.icon-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.hint-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: max-content;
  margin-top: 2px;
  font-size: 12px;
  color: var(--accent-color);
  text-decoration: none;
}

.hint-link:hover {
  text-decoration: underline;
}

.hint-icon {
  width: 13px;
  height: 13px;
}

.hint-text {
  font-size: 11px;
  color: var(--subtle-text-color);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.test-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--accent-color);
  border-radius: 6px;
  background: color-mix(in srgb, var(--accent-color) 8%, transparent);
  color: var(--accent-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.test-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 16%, transparent);
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.test-result {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
}

.test-result.is-ok {
  color: oklch(40% 0.14 145);
}

.test-result.is-fail {
  color: var(--danger-color);
}

.result-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}
</style>
