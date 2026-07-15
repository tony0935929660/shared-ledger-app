import Decimal from 'decimal.js'
import { supabase } from '../lib/supabase'
import { transactionFormSchema, type TransactionFormPayload } from '../features/transactions/schemas'
import type {
  DashboardData,
  DashboardMetrics,
  PendingReimbursementItem,
  SelectOption,
  TransactionAttachment,
  TransactionDetail,
  TransactionFilter,
  TransactionFormInput,
  TransactionListItem,
  TransactionType,
} from '../features/transactions/types'
import type { Database } from '../types/database.types'

type MemberRow = Database['public']['Tables']['members']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type TransactionRow = Database['public']['Tables']['transactions']['Row']
type AttachmentRow = Database['public']['Tables']['transaction_attachments']['Row']
type AmountRow = Pick<TransactionRow, 'amount'>
type PendingReimbursementRow = Pick<TransactionRow, 'amount' | 'advance_member_id'>

const attachmentBucket = 'transaction-attachments'

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user?.id) throw new Error('User not authenticated')
  return data.user.id
}

async function getCurrentLedgerId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('ledger_members')
    .select('ledger_id')
    .eq('member_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data?.ledger_id) throw new Error('No active ledger membership found')
  return data.ledger_id
}

async function cleanupUploadedFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(attachmentBucket).remove(paths)
  if (error) {
    console.error('Failed to cleanup uploaded files:', error)
  }
}

function formatMemberLabel(member: MemberRow): string {
  return `${member.display_name} (${member.email})`
}

function buildMemberNameMap(members: MemberRow[]): Map<string, string> {
  return new Map(members.map((member) => [member.id, member.display_name]))
}

function buildCategoryNameMap(categories: CategoryRow[]): Map<string, string> {
  return new Map(categories.map((category) => [category.id, category.name]))
}

async function getMembersByIds(memberIds: string[]): Promise<MemberRow[]> {
  if (memberIds.length === 0) return []
  const { data, error } = await supabase.from('members').select('*').in('id', memberIds)
  if (error) throw error
  return data ?? []
}

async function getCategoriesByIds(categoryIds: string[]): Promise<CategoryRow[]> {
  if (categoryIds.length === 0) return []
  const { data, error } = await supabase.from('categories').select('*').in('id', categoryIds)
  if (error) throw error
  return data ?? []
}

function getTaipeiCurrentMonthRange(now: Date = new Date()): { dateFrom: string; dateTo: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value

  if (!year || !month) {
    throw new Error('Failed to resolve current month in Asia/Taipei')
  }

  const yearValue = Number(year)
  const monthValue = Number(month)
  const lastDay = new Date(yearValue, monthValue, 0).getDate()

  return {
    dateFrom: `${year}-${month}-01`,
    dateTo: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

function sumAmounts(rows: AmountRow[]): string {
  const total = rows.reduce((accumulator, row) => accumulator.plus(row.amount), new Decimal(0))
  return total.toFixed(2)
}

async function getAmountRowsByType(
  ledgerId: string,
  type: TransactionType,
  dateFrom?: string,
  dateTo?: string
): Promise<AmountRow[]> {
  let query = supabase
    .from('transactions')
    .select('amount')
    .eq('ledger_id', ledgerId)
    .eq('type', type)
    .is('deleted_at', null)

  if (dateFrom) query = query.gte('transaction_date', dateFrom)
  if (dateTo) query = query.lte('transaction_date', dateTo)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []) as AmountRow[]
}

async function enrichTransactions(rows: TransactionRow[]): Promise<TransactionListItem[]> {
  const memberIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.created_by, row.advance_member_id])
        .filter((value): value is string => Boolean(value))
    )
  )
  const categoryIds = Array.from(new Set(rows.map((row) => row.category_id)))

  const [members, categories] = await Promise.all([getMembersByIds(memberIds), getCategoriesByIds(categoryIds)])

  const memberMap = buildMemberNameMap(members)
  const categoryMap = buildCategoryNameMap(categories)

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    amount: row.amount,
    categoryName: categoryMap.get(row.category_id) ?? 'Unknown',
    transactionDate: row.transaction_date,
    paymentMethod: row.payment_method,
    advanceMemberName: row.advance_member_id ? (memberMap.get(row.advance_member_id) ?? null) : null,
    returnedAt: row.returned_at,
    createdByName: memberMap.get(row.created_by) ?? 'Unknown',
    createdAt: row.created_at,
  }))
}

async function getPendingReimbursements(ledgerId: string): Promise<PendingReimbursementItem[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount,advance_member_id')
    .eq('ledger_id', ledgerId)
    .eq('type', 'expense')
    .eq('payment_method', 'member_advance')
    .is('returned_at', null)
    .is('deleted_at', null)

  if (error) throw error

  const rows = (data ?? []) as PendingReimbursementRow[]
  const amountByMember = new Map<string, Decimal>()

  for (const row of rows) {
    if (!row.advance_member_id) continue
    const current = amountByMember.get(row.advance_member_id) ?? new Decimal(0)
    amountByMember.set(row.advance_member_id, current.plus(row.amount))
  }

  const memberIds = Array.from(amountByMember.keys())
  const members = await getMembersByIds(memberIds)
  const memberMap = buildMemberNameMap(members)

  return memberIds
    .map((memberId) => ({
      memberId,
      memberName: memberMap.get(memberId) ?? 'Unknown',
      amount: (amountByMember.get(memberId) ?? new Decimal(0)).toFixed(2),
    }))
    .sort((a, b) => Number(b.amount) - Number(a.amount))
}

async function getRecentTransactions(ledgerId: string): Promise<TransactionListItem[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('ledger_id', ledgerId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error

  return enrichTransactions((data ?? []) as TransactionRow[])
}

export async function getDashboardData(): Promise<DashboardData> {
  const userId = await getCurrentUserId()
  const ledgerId = await getCurrentLedgerId(userId)
  const { dateFrom, dateTo } = getTaipeiCurrentMonthRange()

  const [capitalRows, allIncomeRows, allExpenseRows, monthIncomeRows, monthExpenseRows, pendingReimbursements, recentTransactions] =
    await Promise.all([
      getAmountRowsByType(ledgerId, 'capital'),
      getAmountRowsByType(ledgerId, 'income'),
      getAmountRowsByType(ledgerId, 'expense'),
      getAmountRowsByType(ledgerId, 'income', dateFrom, dateTo),
      getAmountRowsByType(ledgerId, 'expense', dateFrom, dateTo),
      getPendingReimbursements(ledgerId),
      getRecentTransactions(ledgerId),
    ])

  const totalCapital = sumAmounts(capitalRows)
  const currentMonthIncome = sumAmounts(monthIncomeRows)
  const currentMonthExpense = sumAmounts(monthExpenseRows)
  const currentBalance = new Decimal(sumAmounts(capitalRows))
    .plus(sumAmounts(allIncomeRows))
    .minus(sumAmounts(allExpenseRows))
    .toFixed(2)

  const metrics: DashboardMetrics = {
    totalCapital,
    currentMonthIncome,
    currentMonthExpense,
    currentBalance,
  }

  return {
    metrics,
    pendingReimbursements,
    recentTransactions,
  }
}

export async function getTransactionFormOptions(type: TransactionType): Promise<{
  categories: SelectOption[]
  members: SelectOption[]
}> {
  const userId = await getCurrentUserId()
  const ledgerId = await getCurrentLedgerId(userId)

  const [{ data: categories, error: categoryError }, { data: ledgerMembers, error: ledgerMemberError }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('ledger_id', ledgerId)
      .eq('transaction_type', type)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('ledger_members').select('member_id').eq('ledger_id', ledgerId),
  ])

  if (categoryError) throw categoryError
  if (ledgerMemberError) throw ledgerMemberError

  const members = await getMembersByIds((ledgerMembers ?? []).map((item) => item.member_id))
  const activeMembers = members.filter((member) => member.is_active)

  return {
    categories: (categories ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
    members: activeMembers.map((member) => ({
      label: formatMemberLabel(member),
      value: member.id,
    })),
  }
}

export async function createTransaction(input: TransactionFormInput): Promise<string> {
  const parsed = transactionFormSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    throw new Error(firstIssue?.message ?? 'Invalid transaction input')
  }

  const payload: TransactionFormPayload = parsed.data

  const userId = await getCurrentUserId()
  const ledgerId = await getCurrentLedgerId(userId)

  const uploadedPaths: string[] = []
  const attachmentMetadata: Array<{
    storage_path: string
    original_name: string
    mime_type: string
    size_bytes: number
  }> = []

  try {
    for (const file of payload.attachments) {
      const fileExt = file.name.includes('.') ? file.name.split('.').pop() : undefined
      const objectName = `${ledgerId}/${userId}/${crypto.randomUUID()}${fileExt ? `.${fileExt}` : ''}`

      const { error: uploadError } = await supabase.storage
        .from(attachmentBucket)
        .upload(objectName, file, { upsert: false, contentType: file.type })

      if (uploadError) throw uploadError

      uploadedPaths.push(objectName)
      attachmentMetadata.push({
        storage_path: objectName,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
    }

    const { data, error } = await supabase.rpc('create_transaction_with_attachments', {
      p_type: payload.type,
      p_title: payload.title,
      p_amount: payload.amount,
      p_category_id: payload.categoryId,
      p_transaction_date: payload.transactionDate,
      p_note: payload.note || null,
      p_payment_method: payload.type === 'expense' ? payload.paymentMethod : null,
      p_advance_member_id: payload.type === 'expense' ? payload.advanceMemberId : null,
      p_attachments: attachmentMetadata,
    })

    if (error) throw error
    if (!data) throw new Error('Transaction creation failed')

    return data
  } catch (error) {
    await cleanupUploadedFiles(uploadedPaths)
    throw error
  }
}

export async function getTransactions(filter: TransactionFilter): Promise<TransactionListItem[]> {
  const userId = await getCurrentUserId()
  const ledgerId = await getCurrentLedgerId(userId)

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('ledger_id', ledgerId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filter.keyword) {
    const keyword = filter.keyword.trim()
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,note.ilike.%${keyword}%`)
    }
  }

  if (filter.type) query = query.eq('type', filter.type)
  if (filter.categoryId) query = query.eq('category_id', filter.categoryId)
  if (filter.dateFrom) query = query.gte('transaction_date', filter.dateFrom)
  if (filter.dateTo) query = query.lte('transaction_date', filter.dateTo)
  if (filter.advanceMemberId) query = query.eq('advance_member_id', filter.advanceMemberId)

  if (filter.reimbursementStatus === 'pending') {
    query = query.eq('payment_method', 'member_advance').is('returned_at', null)
  }

  if (filter.reimbursementStatus === 'returned') {
    query = query.eq('payment_method', 'member_advance').not('returned_at', 'is', null)
  }

  const { data: rows, error } = await query
  if (error) throw error

  return enrichTransactions((rows ?? []) as TransactionRow[])
}

export async function getTransactionDetail(transactionId: string): Promise<TransactionDetail> {
  const { data: row, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle()

  if (error) throw error
  if (!row || row.deleted_at) throw new Error('Transaction not found')

  const transaction = row as TransactionRow

  const memberIds = [transaction.created_by, transaction.advance_member_id, transaction.returned_by].filter(
    (value): value is string => Boolean(value)
  )

  const [members, categories, attachmentRows] = await Promise.all([
    getMembersByIds(memberIds),
    getCategoriesByIds([transaction.category_id]),
    supabase
      .from('transaction_attachments')
      .select('*')
      .eq('transaction_id', transaction.id)
      .is('deleted_at', null),
  ])

  const memberMap = buildMemberNameMap(members)
  const categoryMap = buildCategoryNameMap(categories)

  const attachmentData = (attachmentRows.data ?? []) as AttachmentRow[]
  const storagePaths = attachmentData.map((attachment) => attachment.storage_path)

  let signedUrlMap = new Map<string, string>()
  if (storagePaths.length > 0) {
    const { data: signedUrls, error: signedError } = await supabase.storage
      .from(attachmentBucket)
      .createSignedUrls(storagePaths, 60 * 60)

    if (signedError) throw signedError

    signedUrlMap = new Map(
      (signedUrls ?? []).flatMap((item) => (item.signedUrl && item.path ? [[item.path, item.signedUrl]] : []))
    )
  }

  const attachments: TransactionAttachment[] = attachmentData.map((attachment) => ({
    id: attachment.id,
    storagePath: attachment.storage_path,
    originalName: attachment.original_name,
    mimeType: attachment.mime_type,
    sizeBytes: attachment.size_bytes,
    url: signedUrlMap.get(attachment.storage_path) ?? null,
  }))

  return {
    id: transaction.id,
    type: transaction.type,
    title: transaction.title,
    amount: transaction.amount,
    categoryName: categoryMap.get(transaction.category_id) ?? 'Unknown',
    transactionDate: transaction.transaction_date,
    note: transaction.note,
    paymentMethod: transaction.payment_method,
    advanceMemberName: transaction.advance_member_id ? (memberMap.get(transaction.advance_member_id) ?? null) : null,
    returnedAt: transaction.returned_at,
    returnedByName: transaction.returned_by ? (memberMap.get(transaction.returned_by) ?? null) : null,
    createdByName: memberMap.get(transaction.created_by) ?? 'Unknown',
    createdAt: transaction.created_at,
    attachments,
  }
}

export async function markTransactionReturned(transactionId: string, returnedAt: string): Promise<void> {
  const { error } = await supabase.rpc('mark_transaction_returned', {
    p_transaction_id: transactionId,
    p_returned_at: returnedAt,
  })

  if (error) throw error
}

export async function softDeleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_transaction', {
    p_transaction_id: transactionId,
  })

  if (error) throw error
}
