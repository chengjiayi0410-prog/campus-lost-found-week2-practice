<script setup>
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const { login } = useAuthStore();

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const submitting = ref(false);

async function submitForm() {
  errorMessage.value = "";
  submitting.value = true;

  try {
    await login({
      username: username.value,
      password: password.value
    });

    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : null;

    await router.push(redirect || { name: "home" });
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
      <h1>登录</h1>
      <p class="form-hint">
        测试普通用户：student1 / TestPass123!
        <br />
        测试管理员：admin / AdminPass123!
      </p>

      <form class="form-stack" @submit.prevent="submitForm">
        <label class="form-field">
          <span>用户名</span>
          <input
            v-model.trim="username"
            type="text"
            autocomplete="username"
            required
          />
        </label>

        <label class="form-field">
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <p v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </p>

        <button class="btn btn-primary" type="submit" :disabled="submitting">
          {{ submitting ? "登录中..." : "登录" }}
        </button>
      </form>

      <p class="auth-switch">
        还没有账号？
        <RouterLink :to="{ name: 'register' }">立即注册</RouterLink>
      </p>
    </section>
  </main>
</template>
