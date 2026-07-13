<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { SelectOption, TransactionFilter, TransactionListItem, TransactionType } from '../features/transactions/types'
import { getTransactionFormOptions, getTransactions } from '../services/transaction.service'

const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const items = ref<TransactionListItem[]>([])
const categories = ref<SelectOption[]>([])
const members = ref<SelectOption[]>([])

const filters = reactive<TransactionFilter>({
  keyword: '',
  type: undefined,
  categoryId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  advanceMemberId: undefined,
  reimbursementStatus: undefined,
})

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getReimbursementLabel(item: TransactionListItem): string {
  if (item.paymentMethod !== 'member_advance') return '-'
  return item.returnedAt ? '已返還' : '待返還'
}

async function loadFilterOptions(type: TransactionType = 'expense') {
  try {
    const options = await getTransactionFormOptions(type)
    categories.value = options.categories
    members.value = options.members
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '載入篩選資料失敗'
  }
}

async function loadTransactions() {
  loading.value = true
  errorMessage.value = ''

  try {
    items.value = await getTransactions(filters)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '讀取交易列表失敗'
  } finally {
    loading.value = false
  }
}

watch(
  () => filters.type,
  async (nextType) => {
    if (!nextType) {
      await loadFilterOptions('expense')
      return
    }

    await loadFilterOptions(nextType)
    filters.categoryId = undefined
  }
)

onMounted(async () => {
  await loadFilterOptions('expense')
  await loadTransactions()
})
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="xl" elevation="2" :loading="loading">
      <v-card-title class="d-flex align-center">
        <span>交易列表</span>
        <v-spacer />
        <v-btn color="primary" to="/transactions/new">新增交易</v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="filters.keyword" label="關鍵字（項目/備註）" variant="outlined" density="compact" />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.type"
              label="類型"
              :items="[
                { title: '全部', value: undefined },
                { title: '收入', value: 'income' },
                { title: '支出', value: 'expense' },
                { title: '資本投入', value: 'capital' },
              ]"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.categoryId"
              label="分類"
              :items="[{ label: '全部', value: undefined }, ...categories]"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.reimbursementStatus"
              label="返還狀態"
              :items="[
                { title: '全部', value: undefined },
                { title: '待返還', value: 'pending' },
                { title: '已返還', value: 'returned' },
              ]"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="filters.dateFrom" type="date" label="開始日期" variant="outlined" density="compact" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="filters.dateTo" type="date" label="結束日期" variant="outlined" density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.advanceMemberId"
              label="代墊人"
              :items="[{ label: '全部', value: undefined }, ...members]"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn color="primary" block @click="loadTransactions">查詢</v-btn>
          </v-col>
        </v-row>

        <v-table class="mt-4">
          <thead>
            <tr>
              <th>日期</th>
              <th>類型</th>
              <th>項目</th>
              <th>金額</th>
              <th>分類</th>
              <th>建立者</th>
              <th>付款方式</th>
              <th>代墊人</th>
              <th>返還狀態</th>
              <th>建立時間</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="cursor-pointer"
              @click="router.push(`/transactions/${item.id}`)"
            >
              <td>{{ item.transactionDate }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.title }}</td>
              <td>{{ formatCurrency(item.amount) }}</td>
              <td>{{ item.categoryName }}</td>
              <td>{{ item.createdByName }}</td>
              <td>{{ item.paymentMethod ?? '-' }}</td>
              <td>{{ item.advanceMemberName ?? '-' }}</td>
              <td>{{ getReimbursementLabel(item) }}</td>
              <td>{{ formatDateTime(item.createdAt) }}</td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="10" class="text-center text-medium-emphasis py-4">目前沒有符合條件的交易</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
