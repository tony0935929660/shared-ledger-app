<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const greetingName = computed(() => {
  if (authStore.member?.display_name) return authStore.member.display_name
  return authStore.user?.email ?? 'Member'
})
</script>

<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="text-h5">歡迎，{{ greetingName }}</v-card-title>
          <v-card-text>
            Foundation 已完成登入、路由保護、Member 同步與資料庫初始化。
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/transactions">前往交易列表</v-btn>
            <v-btn variant="text" to="/transactions/new">新增交易頁</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
