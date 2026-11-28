<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const { register } = useAuthStore();

const nickname = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const submitting = ref(false);

async function submitForm() {
  errorMessage.value = "";

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "两次输入的密码不一致";
    return;
  }

  submitting.value = true;

  try {
    await register({
      nickname: nickname.value,
      username: username.value,
      password: password.value
    });

    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="shell page">
    <section class="auth-card">
      <h1>注册</h1>
      <p class="form-hint">
        注册成功后会直接进入登录状态。
      </p>

      <form class="form-stack" @submit.prevent="submitForm">
        <label class="form-field">
          <span>昵称（选填）</span>
          <input
            v-model.trim="nickname"
            type="text"
            maxlength="50"
            autocomplete="nickname"
          >
        </label>

        <label class="form-field">
          <span>用户名</span>
          <input
            v-model.trim="username"
            type="text"
            minlength="3"
            maxlength="30"
            autocomplete="username"
            required
          >
        </label>

        <label class="form-field">
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            minlength="8"
            autocomplete="new-password"
            required
          >
        </label>

        <label class="form-field">
          <span>确认密码</span>
          <input
            v-model="confirmPassword"
            type="password"
            minlength="8"
            autocomplete="new-password"
            required
          >
        </label>

        <p v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </p>

        <button
  class="btn btn-primary"
  type="submit"
  :disabled="submitting"
>
  {{ submitting ? "注册中..." : "注册" }}
</button>
      </form>

      <p class="auth-switch">
        已有账号？
        <RouterLink :to="{ name: 'login' }">返回登录</RouterLink>
      </p>
    </section>
  </main>
</template>
