import { computed, reactive } from "vue";
import { seedItems } from "../data/seedItems";

const state = reactive({
  items: seedItems.map((item) => ({ ...item }))
  //seedItems.map((item) => ({ ...item })) 创建副本，避免直接修改初始数据
});
//reactive() 让数组成为响应式数据，新增或删除后页面会自动更新
const items = computed(() => state.items);
// computed() 根据当前数据生成可供页面读取的列表
function getById(id) {
    //getById() 为后面的详情页查询单条信息
  return state.items.find((item) => String(item.id) === String(id));
}
function formatDate() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${now.getMonth() + 1}月${now.getDate()}日 ${hours}:${minutes}`;
}

function addItem(payload) {
    //addItem() 和 removeItem() 为发布、删除功能做准备
  const nextId =
    Math.max(0, ...state.items.map((item) => Number(item.id))) + 1;

  state.items.unshift({
  id: nextId,
  ...payload,
  date: formatDate()
});

  return nextId;
}

function removeItem(id) {
    //addItem() 和 removeItem() 为发布、删除功能做准备
  const index = state.items.findIndex(
    (item) => String(item.id) === String(id)
  );

  if (index >= 0) {
    state.items.splice(index, 1);
  }
}

export function useItemStore() {
  return {
    items,
    getById,
    addItem,
    removeItem
  };
}