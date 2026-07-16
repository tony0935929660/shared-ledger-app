<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { signInWithGoogle, signInWithMagicLink } from '../services/auth.service'

const emailSchema = z.string().email('請輸入有效的 Email')

const router = useRouter()
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function handleMagicLinkLogin() {
  const parsed = emailSchema.safeParse(email.value)
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0]?.message ?? 'Email 格式錯誤'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await signInWithMagicLink(parsed.data)
    sent.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    await signInWithGoogle()
    await router.replace('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Google 登入失敗'
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <v-card class="auth-card" elevation="8" rounded="xl">
      <v-card-title class="text-h5 text-center pt-6">Ledger</v-card-title>
      <v-card-subtitle class="text-center">登入以開始共同記帳</v-card-subtitle>
      <v-card-text class="pt-6">
        <v-text-field
          v-model="email"
          type="email"
          label="Email"
          variant="outlined"
          prepend-inner-icon="mdi-email-outline"
          :disabled="loading"
          class="mb-3"
        />

        <v-btn
          color="primary"
          block
          size="large"
          :loading="loading"
          :disabled="loading"
          @click="handleMagicLinkLogin"
        >
          使用 Magic Link 登入
        </v-btn>

        <v-divider class="my-4" />

        <v-btn
          color="secondary"
          variant="outlined"
          block
          size="large"
          :loading="loading"
          :disabled="loading"
          @click="handleGoogleLogin"
        >
          使用 Google 登入
        </v-btn>

        <v-alert v-if="sent" type="success" variant="tonal" class="mt-4">
          已寄出登入連結，請到信箱開啟。
        </v-alert>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.auth-card {
  width: min(460px, 100%);
}
</style>
