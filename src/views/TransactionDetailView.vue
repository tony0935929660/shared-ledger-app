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
const errorMessage = ref('')
const successMessage = ref('')
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

async function loadDetail() {
  const transactionId = route.params.id
  if (typeof transactionId !== 'string') {
    errorMessage.value = '交易 ID 無效'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    detail.value = await getTransactionDetail(transactionId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '讀取交易詳情失敗'
  } finally {
    loading.value = false
  }
}

async function handleMarkReturned() {
  const transactionId = route.params.id
  if (typeof transactionId !== 'string') return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await markTransactionReturned(transactionId, `${returnedAt.value}T00:00:00.000Z`)
    successMessage.value = '已完成返還標記'
    await loadDetail()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '返還更新失敗'
  } finally {
    saving.value = false
  }
}

async function handleSoftDelete() {
  const transactionId = route.params.id
  if (typeof transactionId !== 'string') return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await softDeleteTransaction(transactionId)
    successMessage.value = '交易已軟刪除'
    await router.replace('/transactions')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '刪除失敗'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <v-container class="py-8">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/transactions">回交易列表</v-btn>

    <v-card rounded="xl" elevation="2" class="mt-4" :loading="loading">
      <v-card-title>交易詳情</v-card-title>
      <v-card-text v-if="detail">
        <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">{{ successMessage }}</v-alert>
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

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
        <v-btn color="error" variant="outlined" :loading="saving" @click="handleSoftDelete">軟刪除</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
