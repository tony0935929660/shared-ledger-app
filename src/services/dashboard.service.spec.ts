import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardData } from './transaction.service'

type Row = Record<string, unknown>

class QueryBuilder<T extends Row> implements PromiseLike<{ data: T[]; error: null }> {
  private selectedColumns: string[] | null = null
  private filters: Array<(row: T) => boolean> = []
  private orderRules: Array<{ column: keyof T; ascending: boolean }> = []
  private rowLimit: number | null = null

  constructor(private readonly rows: T[]) {}

  select(columns: string): this {
    const normalized = columns.trim()
    this.selectedColumns = normalized === '*' ? null : normalized.split(',').map((part) => part.trim())
    return this
  }

  eq(column: keyof T & string, value: unknown): this {
    this.filters.push((row) => row[column] === value)
    return this
  }

  in(column: keyof T & string, values: unknown[]): this {
    const valueSet = new Set(values)
    this.filters.push((row) => valueSet.has(row[column]))
    return this
  }

  is(column: keyof T & string, value: unknown): this {
    if (value === null) {
      this.filters.push((row) => row[column] === null)
    } else {
      this.filters.push((row) => row[column] === value)
    }
    return this
  }

  gte(column: keyof T & string, value: string): this {
    this.filters.push((row) => String(row[column] ?? '') >= value)
    return this
  }

  lte(column: keyof T & string, value: string): this {
    this.filters.push((row) => String(row[column] ?? '') <= value)
    return this
  }

  order(column: keyof T & string, options: { ascending: boolean }): this {
    this.orderRules.push({ column, ascending: options.ascending })
    return this
  }

  limit(limitValue: number): this {
    this.rowLimit = limitValue
    return this
  }

  async maybeSingle(): Promise<{ data: T | null; error: null }> {
    const result = this.executeRows()
    return { data: result[0] ?? null, error: null }
  }

  then<TResult1 = { data: T[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: this.executeRows(), error: null }).then(onfulfilled, onrejected)
  }

  private executeRows(): T[] {
    let result = [...this.rows]

    for (const filter of this.filters) {
      result = result.filter(filter)
    }

    for (const rule of this.orderRules) {
      result.sort((a, b) => {
        const left = String(a[rule.column] ?? '')
        const right = String(b[rule.column] ?? '')

        if (left === right) return 0
        if (rule.ascending) return left > right ? 1 : -1
        return left < right ? 1 : -1
      })
    }

    if (typeof this.rowLimit === 'number') {
      result = result.slice(0, this.rowLimit)
    }

    if (!this.selectedColumns) {
      return result
    }

    return result.map((row) => {
      const selected: Row = {}
      for (const key of this.selectedColumns ?? []) {
        selected[key] = row[key]
      }
      return selected as T
    })
  }
}

const fixtures = vi.hoisted(() => ({
  ledgerMembers: [
    {
      ledger_id: 'ledger-1',
      member_id: 'user-1',
      joined_at: '2026-01-01T00:00:00Z',
    },
  ],
  members: [
    { id: 'user-1', display_name: 'Owner', email: 'owner@example.com', is_active: true },
    { id: 'member-2', display_name: 'Tony', email: 'tony@example.com', is_active: true },
    { id: 'member-3', display_name: 'Amy', email: 'amy@example.com', is_active: true },
  ],
  categories: [
    { id: 'cat-cap', name: '創辦人投入' },
    { id: 'cat-inc', name: '收入' },
    { id: 'cat-exp', name: '支出' },
  ],
  transactions: [
    {
      id: 'tx-1',
      ledger_id: 'ledger-1',
      type: 'capital',
      title: '創辦人投入',
      amount: '1000.00',
      category_id: 'cat-cap',
      transaction_date: '2026-07-01',
      payment_method: null,
      advance_member_id: null,
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-07-01T09:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-2',
      ledger_id: 'ledger-1',
      type: 'income',
      title: '專案尾款',
      amount: '200.00',
      category_id: 'cat-inc',
      transaction_date: '2026-07-05',
      payment_method: null,
      advance_member_id: null,
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-07-05T12:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-3',
      ledger_id: 'ledger-1',
      type: 'income',
      title: '舊案收入',
      amount: '100.00',
      category_id: 'cat-inc',
      transaction_date: '2026-06-20',
      payment_method: null,
      advance_member_id: null,
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-06-20T08:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-4',
      ledger_id: 'ledger-1',
      type: 'expense',
      title: '公司採購',
      amount: '50.00',
      category_id: 'cat-exp',
      transaction_date: '2026-07-03',
      payment_method: 'company',
      advance_member_id: null,
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-07-03T03:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-5',
      ledger_id: 'ledger-1',
      type: 'expense',
      title: '代墊午餐',
      amount: '70.00',
      category_id: 'cat-exp',
      transaction_date: '2026-07-10',
      payment_method: 'member_advance',
      advance_member_id: 'member-2',
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-07-10T11:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-6',
      ledger_id: 'ledger-1',
      type: 'expense',
      title: '代墊文具(已返還)',
      amount: '30.00',
      category_id: 'cat-exp',
      transaction_date: '2026-07-11',
      payment_method: 'member_advance',
      advance_member_id: 'member-2',
      returned_at: '2026-07-12T02:00:00Z',
      created_by: 'user-1',
      created_at: '2026-07-11T13:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-7',
      ledger_id: 'ledger-1',
      type: 'expense',
      title: '代墊咖啡',
      amount: '20.00',
      category_id: 'cat-exp',
      transaction_date: '2026-07-12',
      payment_method: 'member_advance',
      advance_member_id: 'member-3',
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-07-12T09:00:00Z',
      deleted_at: null,
    },
    {
      id: 'tx-8',
      ledger_id: 'ledger-1',
      type: 'capital',
      title: '已刪除投入',
      amount: '999.00',
      category_id: 'cat-cap',
      transaction_date: '2026-07-13',
      payment_method: null,
      advance_member_id: null,
      returned_at: null,
      created_by: 'user-1',
      created_at: '2026-07-13T01:00:00Z',
      deleted_at: '2026-07-13T02:00:00Z',
    },
  ],
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'ledger_members') return new QueryBuilder(fixtures.ledgerMembers)
      if (table === 'transactions') return new QueryBuilder(fixtures.transactions)
      if (table === 'members') return new QueryBuilder(fixtures.members)
      if (table === 'categories') return new QueryBuilder(fixtures.categories)
      throw new Error(`Unexpected table: ${table}`)
    },
  },
}))

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates dashboard metrics, pending reimbursements, and recent transactions', async () => {
    const data = await getDashboardData()

    expect(data.metrics.totalCapital).toBe('1000.00')
    expect(data.metrics.currentMonthIncome).toBe('200.00')
    expect(data.metrics.currentMonthExpense).toBe('170.00')
    expect(data.metrics.currentBalance).toBe('1130.00')

    expect(data.pendingReimbursements).toEqual([
      { memberId: 'member-2', memberName: 'Tony', amount: '70.00' },
      { memberId: 'member-3', memberName: 'Amy', amount: '20.00' },
    ])

    expect(data.recentTransactions).toHaveLength(7)
    expect(data.recentTransactions[0]?.id).toBe('tx-7')
    expect(data.recentTransactions.some((item) => item.id === 'tx-8')).toBe(false)
  })
})
