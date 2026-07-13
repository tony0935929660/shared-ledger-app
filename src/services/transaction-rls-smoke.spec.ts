import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('SPEC-002 migration smoke checks', () => {
  const sql = readFileSync('supabase/migrations/20260713213000_spec002_transaction.sql', 'utf8')

  it('contains atomic create RPC', () => {
    expect(sql).toContain('create or replace function public.create_transaction_with_attachments')
    expect(sql).toContain('jsonb_array_length(p_attachments) > 5')
  })

  it('contains storage policies for transaction attachments bucket', () => {
    expect(sql).toContain("bucket_id = 'transaction-attachments'")
    expect(sql).toContain('create policy "attachments object insert by ledger member"')
    expect(sql).toContain('create policy "attachments object select by ledger member"')
  })
})
