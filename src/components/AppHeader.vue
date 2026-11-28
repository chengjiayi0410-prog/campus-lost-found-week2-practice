<script setup>
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const { currentUser, isLoggedIn, isAdmin, logout } = useAuthStore();

function handleLogout() {
  logout();
  router.push({ name: "home" });
}
</script>

<template>
  <header class="topbar">
    <div class="shell topbar-inner">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <span class="brand-mark">寻</span>
        <span class="brand-name">校园失物招领</span>
      </RouterLink>

      <nav class="header-nav" aria-label="主导航">
        <RouterLink v-if="isAdmin" class="nav-link" :to="{ name: 'admin' }">
          管理
        </RouterLink>

        <template v-if="isLoggedIn">
          <span class="header-user">
            {{ currentUser?.nickname }}
          </span>
          <button class="btn btn-secondary" type="button" @click="handleLogout">
            退出
          </button>
        </template>

        <template v-else>
          <RouterLink class="nav-link" :to="{ name: 'login' }">
            登录
          </RouterLink>
          <RouterLink class="nav-link" :to="{ name: 'register' }">
            注册
          </RouterLink>
        </template>

        <RouterLink class="btn btn-primary" :to="{ name: 'publish' }">
          发布
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
