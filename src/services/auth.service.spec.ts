import type { User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const insertMock = vi.fn()
  const maybeSingleMock = vi.fn()
  const selectEqMock = vi.fn(() => ({
    maybeSingle: maybeSingleMock,
  }))
  const selectMock = vi.fn(() => ({
    eq: selectEqMock,
  }))
  const updateEqMock = vi.fn()
  const updateMock = vi.fn(() => ({
    eq: updateEqMock,
  }))
  const fromMock = vi.fn(() => ({
    insert: insertMock,
    select: selectMock,
    update: updateMock,
  }))
  const rpcMock = vi.fn()
  const getUserMock = vi.fn()

  return {
    insertMock,
    maybeSingleMock,
    selectEqMock,
    selectMock,
    updateEqMock,
    updateMock,
    fromMock,
    rpcMock,
    getUserMock,
  }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mocks.getUserMock,
    },
    from: mocks.fromMock,
    rpc: mocks.rpcMock,
  },
}))

import { ensureMemberProfile, updateMemberDisplayName } from './auth.service'

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    ...overrides,
  } as User
}

describe('ensureMemberProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.maybeSingleMock.mockResolvedValue({ data: null, error: null })
    mocks.insertMock.mockResolvedValue({ error: null })
    mocks.updateEqMock.mockResolvedValue({ error: null })
    mocks.rpcMock.mockResolvedValue({ error: null })
    mocks.getUserMock.mockResolvedValue({
      data: { user: { id: '00000000-0000-0000-0000-000000000001' } },
      error: null,
    })
  })

  it('creates member profile with display name on first sign-in and bootstraps first ledger', async () => {
    const user = createUser({ user_metadata: { full_name: 'Jane Doe' } })

    await ensureMemberProfile(user)

    expect(mocks.fromMock).toHaveBeenCalledWith('members')
    expect(mocks.selectMock).toHaveBeenCalledWith('id')
    expect(mocks.selectEqMock).toHaveBeenCalledWith('id', user.id)
    expect(mocks.insertMock).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
      display_name: 'Jane Doe',
      is_active: true,
    })
    expect(mocks.rpcMock).toHaveBeenCalledWith('bootstrap_first_ledger', {
      p_ledger_name: 'Company Ledger',
    })
  })

  it('does not overwrite display name for existing members on later sign-ins', async () => {
    const user = createUser({ user_metadata: { full_name: 'Updated Name' } })
    mocks.maybeSingleMock.mockResolvedValue({
      data: { id: user.id },
      error: null,
    })

    await ensureMemberProfile(user)

    expect(mocks.updateMock).toHaveBeenCalledWith({
      email: user.email,
      is_active: true,
    })
    expect(mocks.updateEqMock).toHaveBeenCalledWith('id', user.id)
  })

  it('throws when id or email is missing', async () => {
    await expect(
      ensureMemberProfile(createUser({ email: undefined }))
    ).rejects.toThrow('Authenticated user is missing required profile fields.')
  })

  it('updates current member display name', async () => {
    await updateMemberDisplayName('  Tony Chen  ')

    expect(mocks.fromMock).toHaveBeenCalledWith('members')
    expect(mocks.updateMock).toHaveBeenCalledWith({ display_name: 'Tony Chen' })
    expect(mocks.updateEqMock).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000001')
  })

  it('rejects empty display name', async () => {
    await expect(updateMemberDisplayName('   ')).rejects.toThrow('顯示名稱不可為空')
  })
})
