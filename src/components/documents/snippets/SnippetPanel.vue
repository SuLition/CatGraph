<script setup lang="ts">
import { computed, ref } from "vue";
import { useSnippetsStore } from "../../../stores/snippets.store";
import type { SnippetRecord } from "../../../types/snippet";

const props = defineProps<{ documentId: string | null }>();
const emit = defineEmits<{
  (e: "jump", snippet: SnippetRecord): void;
}>();

const snippets = useSnippetsStore();
const isCollapsed = ref(false);

const list = computed<SnippetRecord[]>(() =>
  props.documentId ? snippets.byDocument(props.documentId) : [],
);

async function handleDelete(id: string) {
  await snippets.remove(id);
}
</script>

<template>
  <aside class="snippet-panel" :class="{ collapsed: isCollapsed }">
    <header class="panel-header">
      <button type="button" class="toggle" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? "<" : ">" }}
      </button>
      <h2 v-if="!isCollapsed" class="title">片段</h2>
      <span v-if="!isCollapsed" class="count">{{ list.length }}</span>
    </header>
    <div v-if="!isCollapsed" class="cards">
      <p v-if="list.length === 0" class="empty">在文档中选中文字，点击加入知识库。</p>
      <article
        v-for="snippet in list"
        :key="snippet.id"
        class="card"
        @click="emit('jump', snippet)"
      >
        <p class="card-text">{{ snippet.text }}</p>
        <footer class="card-meta">
          <span v-if="snippet.anchor.locator.kind === 'pdf'">P. {{ snippet.anchor.locator.page }}</span>
          <span v-else>文本</span>
          <button type="button" class="delete" @click.stop="handleDelete(snippet.id)">删除</button>
        </footer>
      </article>
    </div>
  </aside>
</template>

<style scoped>
.snippet-panel {
  flex: 0 0 auto;
  width: 280px;
  border-left: 1px solid var(--border-color);
  background: rgb(255 255 255 / 35%);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.snippet-panel.collapsed {
  width: 28px;
}

.panel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
}

.toggle {
  width: 18px;
  height: 18px;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 3px;
  background: rgb(255 255 255 / 50%);
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
}

.title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.count {
  font-size: 11px;
  color: var(--subtle-text-color);
}

.cards {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty {
  font-size: 11px;
  color: var(--subtle-text-color);
  padding: 16px 8px;
  text-align: center;
}

.card {
  padding: 8px 10px;
  border: 1px solid rgb(137 160 174 / 22%);
  border-radius: 6px;
  background: rgb(255 255 255 / 55%);
  cursor: pointer;
}

.card:hover {
  background: var(--hover-color);
}

.card-text {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-color);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--subtle-text-color);
}

.delete {
  border: none;
  background: transparent;
  color: var(--subtle-text-color);
  cursor: pointer;
  font-size: 11px;
}

.delete:hover {
  color: #d44747;
}
</style>
