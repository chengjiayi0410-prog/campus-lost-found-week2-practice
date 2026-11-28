<script setup>
import {
  onBeforeUnmount,
  ref
} from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  categoryLabels,
  typeLabels
} from "../data/seedItems";
import { useItemStore } from "../stores/items";

const router = useRouter();
const {
  addItem,
  uploadItemImage
} = useItemStore();

const selectedType = ref("lost");
const category = ref("card");
const title = ref("");
const description = ref("");
const location = ref("");
const imageFile = ref(null);
const imagePreview = ref("");
const errorMessage = ref("");
const submitting = ref(false);

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const typeOptions = Object.entries(typeLabels).map(
  ([value, label]) => ({ value, label })
);

const categoryOptions = Object.entries(categoryLabels).map(
  ([value, label]) => ({ value, label })
);

function clearImagePreview() {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
    imagePreview.value = "";
  }
}

function handleImageChange(event) {
  errorMessage.value = "";
  clearImagePreview();
  imageFile.value = null;

  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!allowedImageTypes.has(file.type)) {
    errorMessage.value = "仅支持 JPG、PNG 和 WebP 图片";
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = "图片不能超过 2 MB";
    event.target.value = "";
    return;
  }

  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
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

async function submitForm() {
  errorMessage.value = validateForm();

  if (errorMessage.value) {
    return;
  }

  submitting.value = true;

  try {
    const post = await addItem({
      type: selectedType.value,
      category: category.value,
      title: title.value.trim(),
      description: description.value.trim(),
      location: location.value.trim()
    });

    if (imageFile.value) {
      try {
        await uploadItemImage(post.id, imageFile.value);
      } catch (uploadError) {
        window.alert(
          `信息已发布，但图片上传失败：${uploadError.message}`
        );
      }
    }

    await router.push({
      name: "item-detail",
      params: { id: post.id }
    });
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    submitting.value = false;
  }
}

onBeforeUnmount(clearImagePreview);
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
            maxlength="100"
            placeholder="例如：蓝色校园卡"
          >
        </label>

        <label class="form-field">
          <span>详细描述</span>
          <textarea
            v-model.trim="description"
            rows="5"
            maxlength="2000"
            placeholder="描述颜色、特征、包装等便于辨认的信息"
          ></textarea>
        </label>

        <label class="form-field">
          <span>丢失或拾取地点</span>
          <input
            v-model.trim="location"
            type="text"
            maxlength="100"
            placeholder="例如：图书馆三楼"
          >
        </label>

        <label class="form-field">
          <span>
            物品图片（选填，JPG/PNG/WebP，最大 2 MB）
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleImageChange"
          >
        </label>

        <img
          v-if="imagePreview"
          class="image-preview"
          :src="imagePreview"
          alt="待发布图片预览"
        >

        <p v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </p>

        <div class="publish-actions">
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="submitting"
          >
            {{ submitting ? "发布中..." : "发布信息" }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>