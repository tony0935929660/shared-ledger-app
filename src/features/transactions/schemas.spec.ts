import { describe, expect, it } from 'vitest'
import { transactionFormSchema } from './schemas'

function createBasePayload() {
  return {
    type: 'expense' as const,
    title: 'Laptop',
    amount: '1000',
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    transactionDate: '2026-07-13',
    note: '',
    paymentMethod: 'member_advance' as const,
    advanceMemberId: '550e8400-e29b-41d4-a716-446655440001',
    attachments: [],
  }
}

describe('transactionFormSchema', () => {
  it('rejects member_advance without advance member', () => {
    const payload = {
      ...createBasePayload(),
      advanceMemberId: null,
    }

    const parsed = transactionFormSchema.safeParse(payload)
    expect(parsed.success).toBe(false)
  })

  it('rejects payment fields for income', () => {
    const payload = {
      ...createBasePayload(),
      type: 'income' as const,
      paymentMethod: 'company' as const,
      advanceMemberId: null,
    }

    const parsed = transactionFormSchema.safeParse(payload)
    expect(parsed.success).toBe(false)
  })

  it('accepts valid company expense', () => {
    const payload = {
      ...createBasePayload(),
      paymentMethod: 'company' as const,
      advanceMemberId: null,
    }

    const parsed = transactionFormSchema.safeParse(payload)
    expect(parsed.success).toBe(true)
  })
})
