<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  categoryLabels,
  typeLabels
} from "../data/seedItems";
import { useAuthStore } from "../stores/auth";
import { useItemStore } from "../stores/items";

const router = useRouter();
const { currentUser } = useAuthStore();
const { addItem } = useItemStore();

const selectedType = ref("lost");
const category = ref("card");
const title = ref("");
const description = ref("");
const location = ref("");
const imageData = ref("");
const errorMessage = ref("");

const typeOptions = Object.entries(typeLabels).map(
  ([value, label]) => ({
    value,
    label
  })
);

const categoryOptions = Object.entries(categoryLabels).map(
  ([value, label]) => ({
    value,
    label
  })
);

function handleImageChange(event) {
  errorMessage.value = "";

  const file = event.target.files?.[0];

  if (!file) {
    imageData.value = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    errorMessage.value = "只能选择图片文件";
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = "图片不能超过 2 MB";
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    imageData.value = String(reader.result);
  };

  reader.readAsDataURL(file);
}

function validateForm() {
  if (!title.value.trim()) {
    return "请填写物品名称";
  }

  if (!description.value.trim()) {
    return "请填写物品描述";
  }

  if (!location.value.trim()) {
    return "请填写地点";
  }

  return "";
}

function submitForm() {
  errorMessage.value = validateForm();

  if (errorMessage.value) {
    return;
  }

  const newId = addItem({
    type: selectedType.value,
    category: category.value,
    title: title.value.trim(),
    description: description.value.trim(),
    location: location.value.trim(),
    author: currentUser.value?.nickname || "同学",
    image: imageData.value
  });

  router.push({
    name: "item-detail",
    params: { id: newId }
  });
}
</script>

<template>
  <main class="shell page">
    <section class="auth-card publish-card">
      <div class="publish-head">
        <div>
          <h1>发布信息</h1>
          <p class="form-hint">
            填写物品信息，帮助失主与拾取者尽快联系。
          </p>
        </div>
        <RouterLink class="back-link" :to="{ name: 'home' }">
          返回列表
        </RouterLink>
      </div>

      <form class="form-stack" @submit.prevent="submitForm">
        <div class="form-row">
          <label class="form-field">
            <span>信息类型</span>
            <select v-model="selectedType">
              <option
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>物品分类</span>
            <select v-model="category">
              <option
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <label class="form-field">
          <span>物品名称</span>
          <input
            v-model.trim="title"
            type="text"
            maxlength="60"
            placeholder="例如：蓝色校园卡"
          >
        </label>

        <label class="form-field">
          <span>详细描述</span>
          <textarea
            v-model.trim="description"
            rows="5"
            maxlength="500"
            placeholder="描述颜色、特征、包装等便于辨认的信息"
          ></textarea>
        </label>

        <label class="form-field">
          <span>丢失或拾取地点</span>
          <input
            v-model.trim="location"
            type="text"
            maxlength="80"
            placeholder="例如：图书馆三楼"
          >
        </label>

        <label class="form-field">
          <span>物品图片（选填，最大 2 MB）</span>
          <input
            type="file"
            accept="image/*"
            @change="handleImageChange"
          >
        </label>

        <img
          v-if="imageData"
          class="image-preview"
          :src="imageData"
          alt="待发布图片预览"
        >

        <p v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </p>

        <div class="publish-actions">
          <button class="btn btn-primary" type="submit">
            发布信息
          </button>
        </div>
      </form>
    </section>
  </main>
</template>