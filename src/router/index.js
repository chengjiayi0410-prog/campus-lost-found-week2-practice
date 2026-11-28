import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ItemDetailView from "../views/ItemDetailView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import PublishView from "../views/PublishView.vue";
import AdminView from "../views/AdminView.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },
    {
      path: "/items/:id",
      name: "item-detail",
      component: ItemDetailView,
      props: true
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true }
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guestOnly: true }
    },
    {
      path: "/publish",
      name: "publish",
      component: PublishView,
      meta: { requiresAuth: true }
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true
      }
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/"
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  const { isLoggedIn, isAdmin, initialized, restoreSession } = useAuthStore();

  if (!initialized.value) {
    await restoreSession();
  }

  if (to.meta.guestOnly && isLoggedIn.value) {
    return { name: "home" };
  }

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return {
      name: "login",
      query: { redirect: to.fullPath }
    };
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: "home" };
  }
});

export default router;
