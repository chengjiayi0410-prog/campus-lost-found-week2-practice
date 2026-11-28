<script setup>
import { onMounted, watch } from "vue";
import { RouterLink } from "vue-router";
import { getApiAssetUrl } from "../api/client";
import { typeLabels } from "../data/seedItems";
import { useItemStore } from "../stores/items";

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const { currentItem, itemLoading, itemError, fetchItemById } = useItemStore();

async function loadItem() {
  try {
    await fetchItemById(props.id);
  } catch {
    // 错误消息已经保存在 store 中
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

onMounted(loadItem);
watch(() => props.id, loadItem);
</script>

<template>
  <main class="shell page detail-page">
    <RouterLink class="back-link" :to="{ name: 'home' }">
      ← 返回列表
    </RouterLink>

    <div v-if="itemLoading" class="empty-state">
      <p>正在加载详情...</p>
    </div>

    <div v-else-if="itemError" class="empty-state">
      <p>{{ itemError }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'home' }">
        返回列表
      </RouterLink>
    </div>

    <template v-else-if="currentItem">
      <header class="detail-head">
        <span class="detail-icon" aria-hidden="true">
          {{ currentItem.category.icon }}
        </span>

        <div class="detail-heading">
          <div class="detail-title-row">
            <h1>{{ currentItem.title }}</h1>
            <span
              class="badge"
              :class="
                currentItem.type === 'lost' ? 'badge-lost' : 'badge-found'
              "
            >
              {{ typeLabels[currentItem.type] }}
            </span>
          </div>

          <p class="detail-meta">
            {{ currentItem.location }}
            · {{ formatDate(currentItem.createdAt) }}
          </p>
        </div>
      </header>

      <section class="detail-content">
        <p class="detail-category">
          {{ currentItem.category.name }}
        </p>

        <img
          v-if="currentItem.images.length"
          class="detail-image"
          :src="getApiAssetUrl(currentItem.images[0].url)"
          :alt="currentItem.title"
        />

        <p class="detail-desc">
          {{ currentItem.description }}
        </p>

        <p class="detail-author">
          发布者：
          {{ currentItem.author.nickname }}
          （{{ currentItem.author.username }}）
        </p>
      </section>
    </template>
  </main>
</template>
