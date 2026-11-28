<script setup>
import { typeLabels } from "../data/seedItems";

defineProps({
  item: {
    type: Object,
    required: true
  }
});

function formatDate(value) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
</script>

<template>
  <article class="item-card">
    <RouterLink
      class="card-link"
      :to="{
        name: 'item-detail',
        params: { id: item.id }
      }"
    >
      <span class="item-icon">
        {{ item.category.icon }}
      </span>

      <span class="item-body">
        <span class="card-top">
          <span class="item-title">
            {{ item.title }}
          </span>
          <span
            class="badge"
            :class="item.type === 'lost' ? 'badge-lost' : 'badge-found'"
          >
            {{ typeLabels[item.type] }}
          </span>
        </span>

        <span class="item-desc">
          {{ item.description }}
        </span>

        <span class="item-meta">
          <span>{{ item.category.name }}</span>
          <span>·</span>
          <span class="item-location">
            {{ item.location }}
          </span>
          <span>·</span>
          <span class="item-date">
            {{ formatDate(item.createdAt) }}
          </span>
        </span>
      </span>

      <span class="row-arrow" aria-hidden="true">→</span>
    </RouterLink>
  </article>
</template>
