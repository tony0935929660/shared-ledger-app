export type TransactionType = 'income' | 'expense' | 'capital'
export type PaymentMethod = 'company' | 'member_advance'

export type TransactionFilter = {
  keyword?: string
  type?: TransactionType
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  advanceMemberId?: string
  reimbursementStatus?: 'pending' | 'returned'
}

export type TransactionListItem = {
  id: string
  type: TransactionType
  title: string
  amount: string
  categoryName: string
  transactionDate: string
  paymentMethod: PaymentMethod | null
  advanceMemberName: string | null
  returnedAt: string | null
  createdByName: string
  createdAt: string
}

export type DashboardMetrics = {
  totalCapital: string
  currentMonthIncome: string
  currentMonthExpense: string
  currentBalance: string
}

export type PendingReimbursementItem = {
  memberId: string
  memberName: string
  amount: string
}

export type DashboardData = {
  metrics: DashboardMetrics
  pendingReimbursements: PendingReimbursementItem[]
  recentTransactions: TransactionListItem[]
}

export type TransactionFormInput = {
  type: TransactionType
  title: string
  amount: string
  categoryId: string
  transactionDate: string
  note: string
  paymentMethod: PaymentMethod | null
  advanceMemberId: string | null
  attachments: File[]
}

export type TransactionAttachment = {
  id: string
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string | null
}

export type TransactionDetail = {
  id: string
  type: TransactionType
  title: string
  amount: string
  categoryName: string
  transactionDate: string
  note: string | null
  paymentMethod: PaymentMethod | null
  advanceMemberName: string | null
  returnedAt: string | null
  returnedByName: string | null
  createdByName: string
  createdAt: string
  attachments: TransactionAttachment[]
}

export type SelectOption = {
  label: string
  value: string
}
