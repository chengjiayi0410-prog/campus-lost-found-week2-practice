import { computed, reactive } from "vue";
import {
  apiRequest,
  clearToken,
  getToken,
  setToken
} from "../api/client.js";

const state = reactive({
  currentUser: null,
  initialized: false
});

const currentUser = computed(() => state.currentUser);
const isLoggedIn = computed(() => Boolean(state.currentUser));
const isAdmin = computed(
  () => state.currentUser?.role === "admin"
);
const initialized = computed(() => state.initialized);

async function register({
  username,
  password,
  nickname
}) {
  await apiRequest("/auth/register", {
    method: "POST",
    body: {
      username,
      password,
      nickname
    }
  });

  return login({ username, password });
}

async function login({ username, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      username,
      password
    }
  });

  setToken(data.token);
  state.currentUser = data.user;

  return data.user;
}

async function restoreSession() {
  if (state.initialized) {
    return;
  }

  if (!getToken()) {
    state.initialized = true;
    return;
  }

  try {
    const data = await apiRequest("/auth/me");
    state.currentUser = data.user;
  } catch (error) {
    if (error.status === 401) {
      clearToken();
      state.currentUser = null;
    }
  } finally {
    state.initialized = true;
  }
}

function logout() {
  clearToken();
  state.currentUser = null;
}

export function useAuthStore() {
  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    initialized,
    register,
    login,
    restoreSession,
    logout
  };
}