<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { typeLabels } from "../data/seedItems";
import { useItemStore } from "../stores/items";

const { items, pagination, listLoading, listError, fetchItems, removeItem } =
  useItemStore();

const page = ref(1);
const deletingId = ref(null);
const actionError = ref("");

function formatDate(value) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function loadItems() {
  try {
    await fetchItems({
      page: page.value,
      pageSize: 10
    });
  } catch {
    // 错误信息已经保存在 store 中
  }
}

async function goToPage(value) {
  if (value < 1 || value > pagination.value.totalPages) {
    return;
  }

  page.value = value;
  await loadItems();
}

async function handleDelete(item) {
  actionError.value = "";

  const confirmed = window.confirm(`确定删除“${item.title}”吗？`);

  if (!confirmed) {
    return;
  }

  deletingId.value = item.id;

  try {
    await removeItem(item.id);

    if (items.value.length === 0 && page.value > 1) {
      page.value -= 1;
      await loadItems();
    }
  } catch (error) {
    actionError.value = error.message;
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadItems);
</script>

<template>
  <main class="shell page">
    <header class="admin-head">
      <div>
        <h1>管理后台</h1>
        <p>共 {{ pagination.total }} 条有效信息</p>
      </div>

      <RouterLink class="btn btn-secondary" :to="{ name: 'home' }">
        返回首页
      </RouterLink>
    </header>

    <p v-if="actionError" class="form-error">
      {{ actionError }}
    </p>

    <div v-if="listLoading" class="empty-state">
      <p>正在加载信息...</p>
    </div>

    <div v-else-if="listError" class="empty-state">
      <p>{{ listError }}</p>
      <button type="button" @click="loadItems">重新加载</button>
    </div>

    <div v-else-if="items.length" class="admin-list">
      <article v-for="item in items" :key="item.id" class="admin-row">
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
              :class="item.type === 'lost' ? 'badge-lost' : 'badge-found'"
            >
              {{ typeLabels[item.type] }}
            </span>
          </div>

          <p class="admin-desc">
            {{ item.description }}
          </p>

          <p class="admin-meta">
            {{ item.category.name }}
            · {{ item.location }} · {{ formatDate(item.createdAt) }} ·
            {{ item.author.nickname }}
          </p>
        </div>

        <button
          class="btn btn-danger"
          type="button"
          :disabled="deletingId === item.id"
          @click="handleDelete(item)"
        >
          {{ deletingId === item.id ? "删除中..." : "删除" }}
        </button>
      </article>
    </div>

    <div v-else class="empty-state">
      <p>当前没有有效信息</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'home' }">
        返回首页
      </RouterLink>
    </div>

    <div v-if="pagination.totalPages > 1" class="pagination">
      <button
        class="btn btn-secondary"
        type="button"
        :disabled="page <= 1 || listLoading"
        @click="goToPage(page - 1)"
      >
        上一页
      </button>

      <span> 第 {{ page }} / {{ pagination.totalPages }} 页 </span>

      <button
        class="btn btn-secondary"
        type="button"
        :disabled="page >= pagination.totalPages || listLoading"
        @click="goToPage(page + 1)"
      >
        下一页
      </button>
    </div>
  </main>
</template>
