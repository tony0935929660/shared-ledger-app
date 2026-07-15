import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import TransactionDetailView from '../views/TransactionDetailView.vue'
import TransactionNewView from '../views/TransactionNewView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import { useAuthStore } from '../stores/auth'
import { resolveAuthGuard, type GuardMeta } from './guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/transactions/new',
      name: 'transactions-new',
      component: TransactionNewView,
      meta: { requiresAuth: true },
    },
    {
      path: '/transactions/:id',
      name: 'transaction-detail',
      component: TransactionDetailView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  return resolveAuthGuard(to.meta as GuardMeta, authStore.isAuthenticated)
})

export default router
