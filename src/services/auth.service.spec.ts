import type { User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const upsertMock = vi.fn()
  const fromMock = vi.fn(() => ({
    upsert: upsertMock,
  }))
  const rpcMock = vi.fn()

  return {
    upsertMock,
    fromMock,
    rpcMock,
  }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mocks.fromMock,
    rpc: mocks.rpcMock,
  },
}))

import { ensureMemberProfile } from './auth.service'

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
    mocks.upsertMock.mockResolvedValue({ error: null })
    mocks.rpcMock.mockResolvedValue({ error: null })
  })

  it('upserts member profile and bootstraps first ledger', async () => {
    const user = createUser({ user_metadata: { full_name: 'Jane Doe' } })

    await ensureMemberProfile(user)

    expect(mocks.fromMock).toHaveBeenCalledWith('members')
    expect(mocks.upsertMock).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
      display_name: 'Jane Doe',
      is_active: true,
    })
    expect(mocks.rpcMock).toHaveBeenCalledWith('bootstrap_first_ledger', {
      p_ledger_name: 'Company Ledger',
    })
  })

  it('throws when id or email is missing', async () => {
    await expect(
      ensureMemberProfile(createUser({ email: undefined }))
    ).rejects.toThrow('Authenticated user is missing required profile fields.')
  })
})
