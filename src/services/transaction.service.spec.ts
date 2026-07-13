import { describe, expect, it, vi } from 'vitest'
import { createTransaction } from './transaction.service'
import type { TransactionFormInput } from '../features/transactions/types'

const mocks = vi.hoisted(() => {
  const uploadMock = vi.fn()
  const removeMock = vi.fn()
  const rpcMock = vi.fn()
  const getUserMock = vi.fn()
  const maybeSingleMock = vi.fn()
  const limitMock = vi.fn()
  const orderMock = vi.fn()
  const eqMock = vi.fn()
  const selectMock = vi.fn()
  const fromMock = vi.fn()

  return {
    uploadMock,
    removeMock,
    rpcMock,
    getUserMock,
    maybeSingleMock,
    limitMock,
    orderMock,
    eqMock,
    selectMock,
    fromMock,
  }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mocks.getUserMock,
    },
    storage: {
      from: () => ({
        upload: mocks.uploadMock,
        remove: mocks.removeMock,
      }),
    },
    rpc: mocks.rpcMock,
    from: mocks.fromMock,
  },
}))

describe('createTransaction', () => {
  it('rejects member advance without member', async () => {
    const payload: TransactionFormInput = {
      type: 'expense',
      title: 'Taxi',
      amount: '100',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      transactionDate: '2026-07-13',
      note: '',
      paymentMethod: 'member_advance',
      advanceMemberId: null,
      attachments: [],
    }

    await expect(createTransaction(payload)).rejects.toThrow('成員代墊必須選擇代墊人')
  })

  it('cleans uploaded files if rpc fails', async () => {
    const payload: TransactionFormInput = {
      type: 'expense',
      title: 'Taxi',
      amount: '100',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      transactionDate: '2026-07-13',
      note: '',
      paymentMethod: 'company',
      advanceMemberId: null,
      attachments: [new File(['x'], 'a.png', { type: 'image/png' })],
    }

    mocks.getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    mocks.maybeSingleMock.mockResolvedValue({ data: { ledger_id: 'l1' }, error: null })
    mocks.limitMock.mockReturnValue({ maybeSingle: mocks.maybeSingleMock })
    mocks.orderMock.mockReturnValue({ limit: mocks.limitMock })
    mocks.eqMock.mockReturnValue({ order: mocks.orderMock })
    mocks.selectMock.mockReturnValue({ eq: mocks.eqMock })
    mocks.fromMock.mockReturnValue({ select: mocks.selectMock })

    mocks.uploadMock.mockResolvedValue({ error: null })
    mocks.rpcMock.mockResolvedValue({ data: null, error: new Error('rpc failed') })
    mocks.removeMock.mockResolvedValue({ error: null })

    await expect(createTransaction(payload)).rejects.toThrow('rpc failed')
    expect(mocks.removeMock).toHaveBeenCalledTimes(1)
  })
})
