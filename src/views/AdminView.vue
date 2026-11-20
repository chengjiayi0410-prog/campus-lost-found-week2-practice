<script setup>
import { RouterLink } from "vue-router";
import {
  categoryLabels,
  typeLabels
} from "../data/seedItems";
import { useItemStore } from "../stores/items";

const { items, removeItem } = useItemStore();

function handleDelete(item) {
  const confirmed = window.confirm(
    `确定删除“${item.title}”吗？此操作只在当前演示中生效。`
  );

  if (!confirmed) {
    return;
  }

  removeItem(item.id);
}
</script>

<template>
  <main class="shell page">
    <header class="admin-head">
      <div>
        <h1>管理后台</h1>
        <p>共 {{ items.length }} 条信息</p>
      </div>

      <RouterLink class="btn btn-secondary" :to="{ name: 'home' }">
        返回首页
      </RouterLink>
    </header>

    <div v-if="items.length" class="admin-list">
      <article
        v-for="item in items"
        :key="item.id"
        class="admin-row"
      >
        <div class="admin-main">
          <div class="admin-title-row">
            <RouterLink
              class="admin-title"
              :to="{
                name: 'item-detail',
                params: { id: item.id }
              }"
            >
              {{ item.title }}
            </RouterLink>

            <span
              class="badge"
              :class="
                item.type === 'lost'
                  ? 'badge-lost'
                  : 'badge-found'
              "
            >
              {{ typeLabels[item.type] }}
            </span>
          </div>

          <p class="admin-desc">{{ item.description }}</p>

          <p class="admin-meta">
            {{ categoryLabels[item.category] }}
            · {{ item.location }}
            · {{ item.date }}
          </p>
        </div>

        <button
          class="btn btn-danger"
          type="button"
          @click="handleDelete(item)"
        >
          删除
        </button>
      </article>
    </div>

    <div v-else class="empty-state">
      <p>当前没有信息</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'home' }">
        返回首页
      </RouterLink>
    </div>
  </main>
</template>