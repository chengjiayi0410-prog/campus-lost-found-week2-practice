<script setup>
import {
  categoryIcons,
  typeLabels
} from "../data/seedItems";

defineProps({
  item: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <article class="item-card">
    <RouterLink
  class="card-link"
  :to="{ name: 'item-detail', params: { id: item.id } }"
>
      <span class="item-icon">
        {{ categoryIcons[item.category] }}
      </span>

      <span class="item-body">
        <span class="card-top">
          <span class="item-title">{{ item.title }}</span>
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
        </span>

        <span class="item-desc">
          {{ item.description }}
        </span>

        <span class="item-meta">
          <span class="item-location">
            {{ item.location }}
          </span>
          <span>·</span>
          <span class="item-date">{{ item.date }}</span>
        </span>
      </span>
      <span class="row-arrow" aria-hidden="true">→</span>
</RouterLink>
  </article>
</template>