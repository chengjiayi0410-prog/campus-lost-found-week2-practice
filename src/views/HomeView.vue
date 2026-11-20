<script setup>
import { computed, ref } from "vue";
import ItemRow from "../components/ItemRow.vue";
import { categoryLabels } from "../data/seedItems";
import { useItemStore } from "../stores/items";

const { items } = useItemStore();

const keyword = ref("");
const selectedType = ref("all");
const selectedCategory = ref("all");

const typeOptions = [
  { value: "all", label: "全部" },
  { value: "lost", label: "失物" },
  { value: "found", label: "招领" }
];

const categoryOptions = [
  { value: "all", label: "不限" },
  ...Object.entries(categoryLabels).map(([value, label]) => ({
    value,
    label
  }))
];

const filteredItems = computed(() => {
  const text = keyword.value.trim().toLowerCase();

  return items.value.filter((item) => {
    const searchableText = [
      item.title,
      item.description,
      item.location
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword =
      !text || searchableText.includes(text);

    const matchesType =
      selectedType.value === "all" ||
      item.type === selectedType.value;

    const matchesCategory =
      selectedCategory.value === "all" ||
      item.category === selectedCategory.value;

    return matchesKeyword && matchesType && matchesCategory;
  });
});

function setType(value) {
  selectedType.value = value;
}

function setCategory(value) {
  selectedCategory.value = value;
}

function resetFilters() {
  keyword.value = "";
  selectedType.value = "all";
  selectedCategory.value = "all";
}
</script>

<template>
  <main class="shell page">
    <div class="page-head">
      <h1>失物招领</h1>

      <form class="search-form" @submit.prevent>
        <label class="sr-only" for="searchInput">
          搜索物品
        </label>
        <input
          id="searchInput"
          v-model.trim="keyword"
          type="search"
          placeholder="搜索物品、地点"
        >
        <button type="submit">搜索</button>
      </form>
    </div>

    <div class="toolbar">
      <div
        class="segmented"
        role="group"
        aria-label="信息类型"
      >
        <button
          v-for="option in typeOptions"
          :key="option.value"
          class="segment"
          :class="{ 'is-active': selectedType === option.value }"
          type="button"
          @click="setType(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div
        class="category-filter"
        role="group"
        aria-label="物品分类"
      >
        <button
          v-for="option in categoryOptions"
          :key="option.value"
          class="chip"
          :class="{ 'is-active': selectedCategory === option.value }"
          type="button"
          @click="setCategory(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <p class="result-text">
        <strong>{{ filteredItems.length }}</strong> 条
      </p>
    </div>

    <div v-if="filteredItems.length" class="item-list">
  <ItemRow
    v-for="item in filteredItems"
    :key="item.id"
    :item="item"
  />
</div>

    <div v-else class="empty-state">
      <p>没有匹配的信息</p>
      <button type="button" @click="resetFilters">
        清除筛选
      </button>
    </div>
  </main>
</template>