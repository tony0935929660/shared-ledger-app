<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { signOut } from './services/auth.service'

const authStore = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  try {
    await signOut()
    await router.replace('/login')
  } catch (error) {
    console.error('Failed to sign out:', error)
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title class="font-weight-bold">Company Ledger</v-app-bar-title>
      <template v-if="authStore.isAuthenticated">
        <v-btn variant="text" to="/">首頁</v-btn>
        <v-btn variant="text" to="/profile">個人資料</v-btn>
        <v-btn variant="text" to="/transactions">交易</v-btn>
        <v-btn variant="text" to="/transactions/new">新增</v-btn>
        <v-btn variant="outlined" class="ml-2" @click="handleSignOut">登出</v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
