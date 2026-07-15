<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getTransactionDetail,
  markTransactionReturned,
  softDeleteTransaction,
} from '../services/transaction.service'
import type { TransactionDetail } from '../features/transactions/types'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success' | 'error'>('success')
const deleteDialogVisible = ref(false)
const returnedAt = ref(new Date().toISOString().slice(0, 10))
const detail = ref<TransactionDetail | null>(null)

const canMarkReturned = computed(() => {
  if (!detail.value) return false
  return detail.value.type === 'expense' && detail.value.paymentMethod === 'member_advance' && !detail.value.returnedAt
})

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function showToast(message: string, color: 'success' | 'error'): void {
  toastMessage.value = message
  toastColor.value = color
  toastVisible.value = true
}

async function loadDetail() {
  const transactionId = route.params.id
  if (typeof transactionId !== 'string') {
    showToast('交易 ID 無效', 'error')
    return
  }

  loading.value = true

  try {
    detail.value = await getTransactionDetail(transactionId)
  } catch (error) {
    console.error('Failed to load transaction detail:', error)
    showToast('讀取交易詳情失敗，請稍後再試。', 'error')
  } finally {
    loading.value = false
  }
}

async function handleMarkReturned() {
  const transactionId = route.params.id
  if (typeof transactionId !== 'string') return

  saving.value = true

  try {
    await markTransactionReturned(transactionId, `${returnedAt.value}T00:00:00.000Z`)
    showToast('已完成返還標記', 'success')
    await loadDetail()
  } catch (error) {
    console.error('Failed to mark transaction returned:', error)
    showToast('返還更新失敗，請稍後再試。', 'error')
  } finally {
    saving.value = false
  }
}

async function confirmSoftDelete() {
  deleteDialogVisible.value = true
}

async function handleSoftDelete() {
  const transactionId = route.params.id
  if (typeof transactionId !== 'string') return

  deleteDialogVisible.value = false
  saving.value = true

  try {
    await softDeleteTransaction(transactionId)
    showToast('交易已軟刪除', 'success')
    await router.replace('/transactions')
  } catch (error) {
    console.error('Failed to soft delete transaction:', error)
    showToast('刪除失敗，請稍後再試。', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <v-container class="py-8 mx-auto" style="max-width: 960px">
    <v-snackbar v-model="toastVisible" :color="toastColor" timeout="3500" location="top">
      {{ toastMessage }}
    </v-snackbar>

    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/transactions">回交易列表</v-btn>

    <v-card rounded="xl" elevation="2" class="mt-4" :loading="loading">
      <v-card-title>交易詳情</v-card-title>
      <v-card-text v-if="detail">
        <v-row>
          <v-col cols="12" md="6"><strong>類型：</strong>{{ detail.type }}</v-col>
          <v-col cols="12" md="6"><strong>日期：</strong>{{ detail.transactionDate }}</v-col>
          <v-col cols="12" md="6"><strong>項目：</strong>{{ detail.title }}</v-col>
          <v-col cols="12" md="6"><strong>金額：</strong>{{ formatCurrency(detail.amount) }}</v-col>
          <v-col cols="12" md="6"><strong>分類：</strong>{{ detail.categoryName }}</v-col>
          <v-col cols="12" md="6"><strong>建立者：</strong>{{ detail.createdByName }}</v-col>
          <v-col cols="12" md="6"><strong>付款方式：</strong>{{ detail.paymentMethod ?? '-' }}</v-col>
          <v-col cols="12" md="6"><strong>代墊人：</strong>{{ detail.advanceMemberName ?? '-' }}</v-col>
          <v-col cols="12" md="6"><strong>返還時間：</strong>{{ formatDateTime(detail.returnedAt) }}</v-col>
          <v-col cols="12" md="6"><strong>返還者：</strong>{{ detail.returnedByName ?? '-' }}</v-col>
          <v-col cols="12"><strong>備註：</strong>{{ detail.note || '-' }}</v-col>
          <v-col cols="12"><strong>建立時間：</strong>{{ formatDateTime(detail.createdAt) }}</v-col>
        </v-row>

        <v-divider class="my-4" />

        <h3 class="text-subtitle-1 mb-3">附件</h3>
        <v-row>
          <v-col v-for="attachment in detail.attachments" :key="attachment.id" cols="12" sm="6" md="4">
            <v-card variant="outlined">
              <v-img v-if="attachment.url" :src="attachment.url" height="160" cover />
              <v-card-text>
                <div class="text-body-2">{{ attachment.originalName }}</div>
                <div class="text-caption text-medium-emphasis">{{ attachment.mimeType }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col v-if="detail.attachments.length === 0" cols="12" class="text-medium-emphasis">無附件</v-col>
        </v-row>
      </v-card-text>

      <v-card-actions v-if="detail">
        <template v-if="canMarkReturned">
          <v-text-field
            v-model="returnedAt"
            type="date"
            label="返還日期"
            max-width="220"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-btn color="success" :loading="saving" @click="handleMarkReturned">標記返還</v-btn>
        </template>

        <v-spacer />
        <v-btn color="error" variant="outlined" :loading="saving" @click="confirmSoftDelete">軟刪除</v-btn>
      </v-card-actions>

      <v-card-text v-else-if="!loading" class="text-medium-emphasis">
        找不到交易或交易已刪除。
      </v-card-text>
    </v-card>

    <v-dialog v-model="deleteDialogVisible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">確認軟刪除</v-card-title>
        <v-card-text>
          此操作會將交易標記為刪除，交易內容仍會保留供稽核使用。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogVisible = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="saving" @click="handleSoftDelete">確認刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
