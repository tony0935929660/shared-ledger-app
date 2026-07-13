-- SPEC-002 Transaction: storage policies + atomic transaction creation RPC

insert into storage.buckets (id, name, public)
values ('transaction-attachments', 'transaction-attachments', false)
on conflict (id) do nothing;

drop policy if exists members_select_self on public.members;

create policy members_select_same_ledger on public.members
  for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.ledger_members self_lm
      join public.ledger_members target_lm on target_lm.ledger_id = self_lm.ledger_id
      where self_lm.member_id = auth.uid()
        and target_lm.member_id = public.members.id
    )
  );

drop policy if exists "attachments object select by ledger member" on storage.objects;
drop policy if exists "attachments object insert by ledger member" on storage.objects;

create policy "attachments object select by ledger member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'transaction-attachments'
  and exists (
    select 1
    from public.ledger_members lm
    join public.members m on m.id = lm.member_id
    where lm.ledger_id::text = split_part(storage.objects.name, '/', 1)
      and lm.member_id = auth.uid()
      and m.is_active = true
  )
);

create policy "attachments object insert by ledger member"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'transaction-attachments'
  and auth.uid()::text = split_part(storage.objects.name, '/', 2)
  and exists (
    select 1
    from public.ledger_members lm
    join public.members m on m.id = lm.member_id
    where lm.ledger_id::text = split_part(storage.objects.name, '/', 1)
      and lm.member_id = auth.uid()
      and m.is_active = true
  )
);

create or replace function public.create_transaction_with_attachments(
  p_type text,
  p_title text,
  p_amount numeric,
  p_category_id uuid,
  p_transaction_date date,
  p_note text,
  p_payment_method text,
  p_advance_member_id uuid,
  p_attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ledger_id uuid;
  v_transaction_id uuid;
  v_attachment jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select lm.ledger_id
  into v_ledger_id
  from public.ledger_members lm
  join public.members m on m.id = lm.member_id
  where lm.member_id = v_uid
    and m.is_active = true
  order by lm.joined_at asc
  limit 1;

  if v_ledger_id is null then
    raise exception 'No active ledger membership';
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id = p_category_id
      and c.ledger_id = v_ledger_id
      and c.transaction_type = p_type
      and c.is_active = true
  ) then
    raise exception 'Category does not match transaction type or ledger';
  end if;

  if jsonb_typeof(p_attachments) <> 'array' then
    raise exception 'Attachments must be an array';
  end if;

  if jsonb_array_length(p_attachments) > 5 then
    raise exception 'Maximum 5 attachments';
  end if;

  insert into public.transactions (
    ledger_id,
    type,
    title,
    amount,
    category_id,
    transaction_date,
    note,
    payment_method,
    advance_member_id,
    created_by
  )
  values (
    v_ledger_id,
    p_type,
    p_title,
    p_amount,
    p_category_id,
    p_transaction_date,
    p_note,
    p_payment_method,
    p_advance_member_id,
    v_uid
  )
  returning id into v_transaction_id;

  for v_attachment in
    select * from jsonb_array_elements(p_attachments)
  loop
    insert into public.transaction_attachments (
      transaction_id,
      storage_path,
      original_name,
      mime_type,
      size_bytes,
      created_by
    )
    values (
      v_transaction_id,
      v_attachment ->> 'storage_path',
      v_attachment ->> 'original_name',
      v_attachment ->> 'mime_type',
      (v_attachment ->> 'size_bytes')::bigint,
      v_uid
    );
  end loop;

  return v_transaction_id;
end;
$$;

revoke all on function public.create_transaction_with_attachments(text, text, numeric, uuid, date, text, text, uuid, jsonb) from public;
grant execute on function public.create_transaction_with_attachments(text, text, numeric, uuid, date, text, text, uuid, jsonb) to authenticated;
