<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { SelectOption, TransactionType } from '../features/transactions/types'
import { createTransaction, getTransactionFormOptions } from '../services/transaction.service'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const categories = ref<SelectOption[]>([])
const members = ref<SelectOption[]>([])

const form = reactive({
  type: 'expense' as TransactionType,
  title: '',
  amount: '',
  categoryId: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  note: '',
  paymentMethod: 'company' as 'company' | 'member_advance' | null,
  advanceMemberId: null as string | null,
  attachments: [] as File[],
})

const isExpense = computed(() => form.type === 'expense')
const requiresAdvanceMember = computed(() => form.type === 'expense' && form.paymentMethod === 'member_advance')

watch(
  () => form.type,
  async (nextType) => {
    if (nextType !== 'expense') {
      form.paymentMethod = null
      form.advanceMemberId = null
    } else if (!form.paymentMethod) {
      form.paymentMethod = 'company'
    }

    await loadOptions(nextType)
  }
)

watch(
  () => form.paymentMethod,
  (paymentMethod) => {
    if (paymentMethod !== 'member_advance') {
      form.advanceMemberId = null
    }
  }
)

function handleAttachmentChange(fileList: File[] | File | null) {
  if (Array.isArray(fileList)) {
    form.attachments = fileList
    return
  }

  if (fileList instanceof File) {
    form.attachments = [fileList]
    return
  }

  form.attachments = []
}

async function loadOptions(type: TransactionType) {
  loading.value = true
  errorMessage.value = ''

  try {
    const options = await getTransactionFormOptions(type)
    categories.value = options.categories
    members.value = options.members

    if (!categories.value.some((item) => item.value === form.categoryId)) {
      form.categoryId = categories.value[0]?.value ?? ''
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '載入交易選項失敗'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const transactionId = await createTransaction({
      type: form.type,
      title: form.title,
      amount: form.amount,
      categoryId: form.categoryId,
      transactionDate: form.transactionDate,
      note: form.note,
      paymentMethod: form.paymentMethod,
      advanceMemberId: form.advanceMemberId,
      attachments: form.attachments,
    })

    successMessage.value = '交易建立成功'
    await router.replace(`/transactions/${transactionId}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '建立交易失敗'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadOptions(form.type)
})
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="xl" elevation="2" :loading="loading">
      <v-card-title>新增交易</v-card-title>

      <v-card-text>
        <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">{{ successMessage }}</v-alert>
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.type"
              label="交易類型"
              :items="[
                { title: '支出', value: 'expense' },
                { title: '收入', value: 'income' },
                { title: '資本投入', value: 'capital' },
              ]"
              item-title="title"
              item-value="value"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="8">
            <v-text-field v-model="form.title" label="項目名稱" variant="outlined" />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field v-model="form.amount" label="金額" type="number" variant="outlined" min="0" step="0.01" />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.categoryId"
              label="分類"
              :items="categories"
              item-title="label"
              item-value="value"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field v-model="form.transactionDate" type="date" label="交易日期" variant="outlined" />
          </v-col>

          <v-col cols="12" v-if="isExpense" md="6">
            <v-select
              v-model="form.paymentMethod"
              label="付款方式"
              :items="[
                { title: '公司付款', value: 'company' },
                { title: '成員代墊', value: 'member_advance' },
              ]"
              item-title="title"
              item-value="value"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" v-if="requiresAdvanceMember" md="6">
            <v-select
              v-model="form.advanceMemberId"
              label="代墊人"
              :items="members"
              item-title="label"
              item-value="value"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea v-model="form.note" label="備註" variant="outlined" rows="3" />
          </v-col>

          <v-col cols="12">
            <v-file-input
              multiple
              chips
              show-size
              accept="image/jpeg,image/png,image/webp"
              label="附件（最多 5 張，每張 5MB）"
              variant="outlined"
              @update:model-value="handleAttachmentChange"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" to="/transactions">取消</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="submitting" @click="handleSubmit">建立交易</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
