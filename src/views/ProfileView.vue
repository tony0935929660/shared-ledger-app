<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { updateMemberDisplayName } from '../services/auth.service'

const authStore = useAuthStore()

const saving = ref(false)
const displayName = ref('')
const toastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success' | 'error'>('success')

const email = computed(() => authStore.member?.email ?? authStore.user?.email ?? '-')

function showToast(message: string, color: 'success' | 'error'): void {
  toastMessage.value = message
  toastColor.value = color
  toastVisible.value = true
}

async function handleSave(): Promise<void> {
  saving.value = true

  try {
    const nextName = displayName.value.trim()
    await updateMemberDisplayName(nextName)

    if (authStore.member) {
      authStore.member = {
        ...authStore.member,
        display_name: nextName,
      }
    }

    showToast('個人資料已更新', 'success')
  } catch (error) {
    console.error('Failed to update member profile:', error)
    showToast('更新失敗，請稍後再試。', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  displayName.value = authStore.member?.display_name ?? authStore.user?.email?.split('@')[0] ?? ''
})
</script>

<template>
  <v-container class="py-8 mx-auto" style="max-width: 720px">
    <v-snackbar v-model="toastVisible" :color="toastColor" timeout="3500" location="top">
      {{ toastMessage }}
    </v-snackbar>

    <v-card rounded="xl" elevation="2">
      <v-card-title>個人資料</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="displayName"
              label="顯示名稱"
              variant="outlined"
              maxlength="50"
              counter
            />
          </v-col>
          <v-col cols="12">
            <v-text-field :model-value="email" label="Email" variant="outlined" readonly />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="saving" @click="handleSave">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
