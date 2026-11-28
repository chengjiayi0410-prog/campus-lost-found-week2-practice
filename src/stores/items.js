import { computed, reactive } from "vue";
import { apiRequest } from "../api/client.js";

const state = reactive({
  items: [],
  currentItem: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  },
  listLoading: false,
  itemLoading: false,
  listError: "",
  itemError: ""
});

const items = computed(() => state.items);
const currentItem = computed(() => state.currentItem);
const pagination = computed(() => state.pagination);
const listLoading = computed(() => state.listLoading);
const itemLoading = computed(() => state.itemLoading);
const listError = computed(() => state.listError);
const itemError = computed(() => state.itemError);

async function fetchItems({
  page = 1,
  pageSize = 10,
  keyword = "",
  type = "",
  category = ""
} = {}) {
  state.listLoading = true;
  state.listError = "";

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize)
  });

  if (keyword.trim()) {
    query.set("keyword", keyword.trim());
  }

  if (type && type !== "all") {
    query.set("type", type);
  }

  if (category && category !== "all") {
    query.set("category", category);
  }

  try {
    const data = await apiRequest(`/posts?${query.toString()}`);

    state.items = data.data;
    state.pagination = data.pagination;

    return data;
  } catch (error) {
    state.items = [];
    state.listError = error.message;
    throw error;
  } finally {
    state.listLoading = false;
  }
}

async function fetchItemById(id) {
  state.itemLoading = true;
  state.itemError = "";
  state.currentItem = null;

  try {
    const data = await apiRequest(`/posts/${id}`);
    state.currentItem = data.data;

    return data.data;
  } catch (error) {
    state.itemError = error.message;
    throw error;
  } finally {
    state.itemLoading = false;
  }
}

async function addItem(payload) {
  const data = await apiRequest("/posts", {
    method: "POST",
    body: payload
  });

  return data.data;
}

async function updateItem(id, payload) {
  const data = await apiRequest(`/posts/${id}`, {
    method: "PUT",
    body: payload
  });

  const index = state.items.findIndex((item) => String(item.id) === String(id));

  if (index >= 0) {
    state.items[index] = data.data;
  }

  if (state.currentItem && String(state.currentItem.id) === String(id)) {
    state.currentItem = data.data;
  }

  return data.data;
}

async function removeItem(id) {
  await apiRequest(`/posts/${id}`, {
    method: "DELETE"
  });

  state.items = state.items.filter((item) => String(item.id) !== String(id));

  if (state.pagination.total > 0) {
    state.pagination = {
      ...state.pagination,
      total: state.pagination.total - 1
    };
  }
}

async function uploadItemImage(id, file) {
  const formData = new FormData();
  formData.append("image", file);

  const data = await apiRequest(`/posts/${id}/images`, {
    method: "POST",
    body: formData
  });

  return data.data;
}

export function useItemStore() {
  return {
    items,
    currentItem,
    pagination,
    listLoading,
    itemLoading,
    listError,
    itemError,
    fetchItems,
    fetchItemById,
    addItem,
    updateItem,
    removeItem,
    uploadItemImage
  };
}
