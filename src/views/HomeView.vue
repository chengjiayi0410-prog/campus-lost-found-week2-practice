<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import ItemRow from "../components/ItemRow.vue";
import { categoryLabels } from "../data/seedItems";
import { useItemStore } from "../stores/items";

const { items, pagination, listLoading, listError, fetchItems } =
  useItemStore();

const keyword = ref("");
const selectedType = ref("all");
const selectedCategory = ref("all");
const page = ref(1);

const typeOptions = [
  { value: "all", label: "全部" },
  { value: "lost", label: "失物" },
  { value: "found", label: "招领" }
];

const categoryOptions = [
  { value: "all", label: "不限" },
  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))
];

let searchTimer;

async function loadItems() {
  try {
    await fetchItems({
      page: page.value,
      pageSize: 10,
      keyword: keyword.value,
      type: selectedType.value,
      category: selectedCategory.value
    });
  } catch {
    // 错误消息已经保存在 store 中
  }
}

function setType(value) {
  selectedType.value = value;
  page.value = 1;
  loadItems();
}

function setCategory(value) {
  selectedCategory.value = value;
  page.value = 1;
  loadItems();
}

function handleSearch() {
  page.value = 1;
  loadItems();
}

function resetFilters() {
  keyword.value = "";
  selectedType.value = "all";
  selectedCategory.value = "all";
  page.value = 1;
  loadItems();
}

function goToPage(value) {
  if (value < 1 || value > pagination.value.totalPages) {
    return;
  }

  page.value = value;
  loadItems();
}

watch(keyword, () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    page.value = 1;
    loadItems();
  }, 300);
});

onMounted(loadItems);
onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <main class="shell page">
    <div class="page-head">
      <h1>失物招领</h1>

      <form class="search-form" @submit.prevent="handleSearch">
        <label class="sr-only" for="searchInput"> 搜索物品 </label>
        <input
          id="searchInput"
          v-model.trim="keyword"
          type="search"
          placeholder="搜索物品、地点"
        />
        <button type="submit">搜索</button>
      </form>
    </div>

    <div class="toolbar">
      <div class="segmented" role="group" aria-label="信息类型">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          class="segment"
          :class="{
            'is-active': selectedType === option.value
          }"
          type="button"
          @click="setType(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="category-filter" role="group" aria-label="物品分类">
        <button
          v-for="option in categoryOptions"
          :key="option.value"
          class="chip"
          :class="{
            'is-active': selectedCategory === option.value
          }"
          type="button"
          @click="setCategory(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <p class="result-text">
        <strong>{{ pagination.total }}</strong> 条
      </p>
    </div>

    <div v-if="listLoading" class="empty-state">
      <p>正在加载信息...</p>
    </div>

    <div v-else-if="listError" class="empty-state">
      <p>{{ listError }}</p>
      <button type="button" @click="loadItems">重新加载</button>
    </div>

    <div v-else-if="items.length" class="item-list">
      <ItemRow v-for="item in items" :key="item.id" :item="item" />
    </div>

    <div v-else class="empty-state">
      <p>没有匹配的信息</p>
      <button type="button" @click="resetFilters">清除筛选</button>
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
