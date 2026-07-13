import type { User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { ensureMemberProfile } from '../services/auth.service'
import type { Database } from '../types/database.types'

type MemberRow = Database['public']['Tables']['members']['Row']

type AuthState = {
  user: User | null
  member: MemberRow | null
  initialized: boolean
  loading: boolean
}

let authSubscriptionBound = false

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    member: null,
    initialized: false,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async initialize(): Promise<void> {
      if (this.initialized) return

      this.loading = true
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Failed to restore session:', error)
      }

      this.user = data.session?.user ?? null

      if (this.user) {
        await this.syncMember(this.user)
      }

      if (!authSubscriptionBound) {
        supabase.auth.onAuthStateChange(async (_event, session) => {
          this.user = session?.user ?? null

          if (this.user) {
            await this.syncMember(this.user)
          } else {
            this.member = null
          }
        })
        authSubscriptionBound = true
      }

      this.initialized = true
      this.loading = false
    },

    async syncMember(user: User): Promise<void> {
      try {
        await ensureMemberProfile(user)

        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        this.member = data
      } catch (error) {
        console.error('Failed to sync member profile:', error)
      }
    },
  },
})
