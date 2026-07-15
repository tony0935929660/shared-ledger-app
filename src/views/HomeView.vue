<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DashboardData, PendingReimbursementItem, TransactionListItem } from '../features/transactions/types'
import { getDashboardData } from '../services/transaction.service'

const router = useRouter()

const loading = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
const dashboard = ref<DashboardData | null>(null)

const metricCards = computed(() => {
  const metrics = dashboard.value?.metrics
  return [
    { label: '資本投入', amount: metrics?.totalCapital ?? '0.00' },
    { label: '本月收入', amount: metrics?.currentMonthIncome ?? '0.00' },
    { label: '本月支出', amount: metrics?.currentMonthExpense ?? '0.00' },
    { label: '目前餘額', amount: metrics?.currentBalance ?? '0.00' },
  ]
})

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`))
}

function amountColor(item: TransactionListItem): string {
  if (item.type === 'expense') return 'text-error'
  return 'text-success'
}

function amountPrefix(item: TransactionListItem): string {
  if (item.type === 'expense') return '-'
  return '+'
}

function openPendingTransactions(item: PendingReimbursementItem): void {
  void router.push({
    path: '/transactions',
    query: {
      advanceMemberId: item.memberId,
      reimbursementStatus: 'pending',
    },
  })
}

function showErrorToast(message: string): void {
  toastMessage.value = message
  toastVisible.value = true
}

async function loadDashboard(): Promise<void> {
  loading.value = true

  try {
    dashboard.value = await getDashboardData()
  } catch (error) {
    console.error('Failed to load dashboard:', error)
    showErrorToast('讀取 Dashboard 失敗，請稍後再試。')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadDashboard()
})
</script>

<template>
  <v-container class="py-6 py-md-8">
    <v-snackbar v-model="toastVisible" color="error" timeout="3500" location="top">
      {{ toastMessage }}
    </v-snackbar>

    <v-row>
      <v-col v-for="card in metricCards" :key="card.label" cols="12" sm="6" md="3">
        <v-card rounded="xl" elevation="2" :loading="loading">
          <v-card-subtitle>{{ card.label }}</v-card-subtitle>
          <v-card-text class="text-h6 font-weight-bold">{{ formatCurrency(card.amount) }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="5">
        <v-card rounded="xl" elevation="2" :loading="loading">
          <v-card-title>待返還代墊</v-card-title>
          <v-divider />

          <v-list v-if="(dashboard?.pendingReimbursements.length ?? 0) > 0" lines="two">
            <v-list-item
              v-for="item in dashboard?.pendingReimbursements"
              :key="item.memberId"
              link
              @click="openPendingTransactions(item)"
            >
              <template #title>{{ item.memberName }}</template>
              <template #subtitle>點擊查看該成員待返還交易</template>
              <template #append>
                <span class="font-weight-bold">{{ formatCurrency(item.amount) }}</span>
              </template>
            </v-list-item>
          </v-list>

          <v-card-text v-else class="text-medium-emphasis">目前沒有待返還代墊</v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card rounded="xl" elevation="2" :loading="loading">
          <v-card-title class="d-flex align-center">
            <span>最近交易</span>
            <v-spacer />
            <v-btn variant="text" size="small" to="/transactions">查看全部</v-btn>
          </v-card-title>
          <v-divider />

          <v-list v-if="(dashboard?.recentTransactions.length ?? 0) > 0" lines="two">
            <v-list-item
              v-for="item in dashboard?.recentTransactions"
              :key="item.id"
              link
              @click="router.push(`/transactions/${item.id}`)"
            >
              <template #title>{{ item.title }}</template>
              <template #subtitle>{{ formatDate(item.transactionDate) }} ・ {{ item.categoryName }}</template>
              <template #append>
                <span :class="['font-weight-bold', amountColor(item)]">
                  {{ amountPrefix(item) }}{{ formatCurrency(item.amount) }}
                </span>
              </template>
            </v-list-item>
          </v-list>

          <v-card-text v-else class="text-medium-emphasis">目前沒有交易資料</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
