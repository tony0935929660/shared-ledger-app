import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('RLS smoke checks for SPEC-001 migration', () => {
  const sql = readFileSync('supabase/migrations/20260713190000_spec001_foundation.sql', 'utf8')

  it('enables RLS on core tables', () => {
    expect(sql).toContain('alter table public.members enable row level security;')
    expect(sql).toContain('alter table public.ledgers enable row level security;')
    expect(sql).toContain('alter table public.ledger_members enable row level security;')
    expect(sql).toContain('alter table public.categories enable row level security;')
    expect(sql).toContain('alter table public.transactions enable row level security;')
  })

  it('binds created_by to auth.uid() for transaction inserts', () => {
    expect(sql).toContain('create policy transactions_insert_member on public.transactions')
    expect(sql).toContain('created_by = auth.uid()')
  })

  it('checks active member requirement in membership helper', () => {
    expect(sql).toContain('and m.is_active = true')
    expect(sql).toContain('create or replace function public.is_active_ledger_member(target_ledger_id uuid)')
  })
})
