import { computed, reactive } from "vue";

const state = reactive({
  users: [
    {
      username: "admin",
      password: "admin123",
      nickname: "管理员",
      role: "admin"
    }
  ],
  currentUser: null
});

const currentUser = computed(() => state.currentUser);
const isLoggedIn = computed(() => Boolean(state.currentUser));
const isAdmin = computed(() => state.currentUser?.role === "admin");

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function toPublicUser(user) {
  const { password, ...publicUser } = user;
  return publicUser;
}

function register({ username, password, nickname }) {
  const name = username.trim();

  if (name.length < 2) {
    return { ok: false, message: "用户名至少需要 2 个字符" };
  }

  if (password.length < 6) {
    return { ok: false, message: "密码至少需要 6 个字符" };
  }

  const exists = state.users.some(
    (user) =>
      normalizeUsername(user.username) === normalizeUsername(name)
  );

  if (exists) {
    return { ok: false, message: "该用户名已被注册" };
  }

  const user = {
    username: name,
    password,
    nickname: (nickname || "").trim() || name,
    role: "user"
  };

  state.users.push(user);
  state.currentUser = toPublicUser(user);

  return { ok: true };
}

function login({ username, password }) {
  const user = state.users.find(
    (entry) =>
      normalizeUsername(entry.username) ===
      normalizeUsername(username)
  );

  if (!user || user.password !== password) {
    return { ok: false, message: "用户名或密码错误" };
  }

  state.currentUser = toPublicUser(user);
  return { ok: true };
}

function logout() {
  state.currentUser = null;
}

export function useAuthStore() {
  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    register,
    login,
    logout
  };
}