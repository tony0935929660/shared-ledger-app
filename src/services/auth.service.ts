import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

function resolveDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name
  const displayName = user.user_metadata?.display_name
  const name = user.user_metadata?.name
  const nickname = user.user_metadata?.nickname
  const givenName = user.user_metadata?.given_name
  const familyName = user.user_metadata?.family_name

  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  if (typeof displayName === 'string' && displayName.trim()) return displayName.trim()
  if (typeof name === 'string' && name.trim()) return name.trim()
  if (typeof nickname === 'string' && nickname.trim()) return nickname.trim()

  const first = typeof givenName === 'string' ? givenName.trim() : ''
  const last = typeof familyName === 'string' ? familyName.trim() : ''
  const combined = `${first} ${last}`.trim()
  if (combined) return combined

  if (user.email) return user.email.split('@')[0] || user.email
  return 'Member'
}

export async function signInWithMagicLink(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) throw error
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function ensureMemberProfile(user: User): Promise<void> {
  if (!user.id || !user.email) {
    throw new Error('Authenticated user is missing required profile fields.')
  }

  const displayName = resolveDisplayName(user)

  const { error: upsertError } = await supabase
    .from('members')
    .upsert({
      id: user.id,
      email: user.email,
      display_name: displayName,
      is_active: true,
    })

  if (upsertError) throw upsertError

  const { error: bootstrapError } = await supabase.rpc('bootstrap_first_ledger', {
    p_ledger_name: 'Company Ledger',
  })

  if (bootstrapError) throw bootstrapError
}

export async function updateMemberDisplayName(displayName: string): Promise<void> {
  const normalizedName = displayName.trim()
  if (!normalizedName) {
    throw new Error('顯示名稱不可為空')
  }

  const { data, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!data.user?.id) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('members')
    .update({ display_name: normalizedName })
    .eq('id', data.user.id)

  if (error) throw error
}
