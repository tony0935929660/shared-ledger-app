create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'TWD' check (currency = 'TWD'),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.members (id)
);

create table if not exists public.ledger_members (
  ledger_id uuid not null references public.ledgers (id) on delete restrict,
  member_id uuid not null references public.members (id) on delete restrict,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (ledger_id, member_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete restrict,
  name text not null,
  transaction_type text not null check (transaction_type in ('income', 'expense', 'capital')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (ledger_id, transaction_type, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete restrict,
  type text not null check (type in ('income', 'expense', 'capital')),
  title text not null check (char_length(title) <= 100),
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid not null references public.categories (id),
  transaction_date date not null,
  note text null check (note is null or char_length(note) <= 1000),
  payment_method text null check (payment_method in ('company', 'member_advance')),
  advance_member_id uuid null references public.members (id),
  returned_at timestamptz null,
  returned_by uuid null references public.members (id),
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now(),
  deleted_by uuid null references public.members (id),
  deleted_at timestamptz null,
  constraint ck_expense_payment check (
    (type = 'expense' and payment_method is not null)
    or (type in ('income', 'capital') and payment_method is null)
  ),
  constraint ck_expense_advance_member check (
    (type = 'expense' and payment_method = 'company' and advance_member_id is null)
    or (type = 'expense' and payment_method = 'member_advance' and advance_member_id is not null)
    or (type in ('income', 'capital') and advance_member_id is null)
  ),
  constraint ck_non_expense_returned_fields check (
    (type = 'expense')
    or (type in ('income', 'capital') and returned_at is null and returned_by is null)
  ),
  constraint ck_returned_pair check (
    (returned_at is null and returned_by is null)
    or (returned_at is not null and returned_by is not null)
  ),
  constraint ck_only_member_advance_returned check (
    returned_at is null or payment_method = 'member_advance'
  )
);

create table if not exists public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete restrict,
  storage_path text not null,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null,
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now(),
  deleted_by uuid null references public.members (id),
  deleted_at timestamptz null
);

create index if not exists idx_transactions_ledger_date_created
  on public.transactions (ledger_id, transaction_date desc, created_at desc);

create index if not exists idx_transactions_ledger_type_deleted
  on public.transactions (ledger_id, type, deleted_at);

create index if not exists idx_transactions_ledger_advance_returned_active
  on public.transactions (ledger_id, advance_member_id, returned_at)
  where deleted_at is null;

create index if not exists idx_categories_ledger_type_active
  on public.categories (ledger_id, transaction_type, is_active);

create index if not exists idx_attachments_transaction_deleted
  on public.transaction_attachments (transaction_id, deleted_at);

alter table public.members enable row level security;
alter table public.ledgers enable row level security;
alter table public.ledger_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_attachments enable row level security;

grant usage on schema public to anon, authenticated;

grant select, insert, update on table public.members to authenticated;
grant select on table public.ledgers to authenticated;
grant select on table public.ledger_members to authenticated;
grant select on table public.categories to authenticated;
grant select, insert on table public.transactions to authenticated;
grant select, insert on table public.transaction_attachments to authenticated;

create or replace function public.is_active_ledger_member(target_ledger_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ledger_members lm
    join public.members m on m.id = lm.member_id
    where lm.ledger_id = target_ledger_id
      and lm.member_id = auth.uid()
      and m.is_active = true
  );
$$;

revoke all on function public.is_active_ledger_member(uuid) from public;
grant execute on function public.is_active_ledger_member(uuid) to authenticated;

create policy members_select_self on public.members
  for select
  using (id = auth.uid());

create policy members_insert_self on public.members
  for insert
  with check (id = auth.uid());

create policy members_update_self on public.members
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy ledgers_select_member on public.ledgers
  for select
  using (public.is_active_ledger_member(id));

create policy ledgers_insert_creator on public.ledgers
  for insert
  with check (created_by = auth.uid());

create policy ledger_members_select_member on public.ledger_members
  for select
  using (public.is_active_ledger_member(ledger_id));

create policy categories_select_member on public.categories
  for select
  using (public.is_active_ledger_member(ledger_id));

create policy transactions_select_member on public.transactions
  for select
  using (public.is_active_ledger_member(ledger_id));

create policy transactions_insert_member on public.transactions
  for insert
  with check (public.is_active_ledger_member(ledger_id) and created_by = auth.uid());

create policy attachments_select_member on public.transaction_attachments
  for select
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_id
        and public.is_active_ledger_member(t.ledger_id)
    )
  );

create policy attachments_insert_member on public.transaction_attachments
  for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.transactions t
      where t.id = transaction_id
        and public.is_active_ledger_member(t.ledger_id)
    )
  );

create or replace function public.bootstrap_first_ledger(p_ledger_name text default 'Company Ledger')
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_existing_ledger uuid;
  v_ledger_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select u.email,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      split_part(u.email, '@', 1),
      'Member'
    )
  into v_email, v_display_name
  from auth.users u
  where u.id = v_uid;

  if v_email is null then
    raise exception 'Auth user record not found';
  end if;

  insert into public.members (id, email, display_name, is_active)
  values (v_uid, v_email, v_display_name, true)
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name;

  select lm.ledger_id
  into v_existing_ledger
  from public.ledger_members lm
  where lm.member_id = v_uid
  order by lm.joined_at asc
  limit 1;

  if v_existing_ledger is not null then
    return v_existing_ledger;
  end if;

  select l.id
  into v_ledger_id
  from public.ledgers l
  order by l.created_at asc
  limit 1;

  if v_ledger_id is null then
    insert into public.ledgers (name, currency, created_by)
    values (coalesce(nullif(trim(p_ledger_name), ''), 'Company Ledger'), 'TWD', v_uid)
    returning id into v_ledger_id;

    insert into public.ledger_members (ledger_id, member_id, role)
    values (v_ledger_id, v_uid, 'owner');

    insert into public.categories (ledger_id, name, transaction_type)
    values
      (v_ledger_id, '專案收入', 'income'),
      (v_ledger_id, '商品收入', 'income'),
      (v_ledger_id, '其他收入', 'income'),
      (v_ledger_id, '軟體', 'expense'),
      (v_ledger_id, '行銷', 'expense'),
      (v_ledger_id, '開發', 'expense'),
      (v_ledger_id, '薪水', 'expense'),
      (v_ledger_id, '獎金', 'expense'),
      (v_ledger_id, '設備', 'expense'),
      (v_ledger_id, '交通', 'expense'),
      (v_ledger_id, '餐飲', 'expense'),
      (v_ledger_id, '行政', 'expense'),
      (v_ledger_id, '其他支出', 'expense'),
      (v_ledger_id, '初始資本', 'capital'),
      (v_ledger_id, '後續增資', 'capital')
    on conflict (ledger_id, transaction_type, name) do nothing;
  end if;

  return v_ledger_id;
end;
$$;

revoke all on function public.bootstrap_first_ledger(text) from public;
grant execute on function public.bootstrap_first_ledger(text) to authenticated;

create or replace function public.mark_transaction_returned(
  p_transaction_id uuid,
  p_returned_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_updated integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.transactions t
  set returned_at = p_returned_at,
      returned_by = v_uid
  where t.id = p_transaction_id
    and t.deleted_at is null
    and t.type = 'expense'
    and t.payment_method = 'member_advance'
    and t.returned_at is null
    and public.is_active_ledger_member(t.ledger_id);

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Transaction cannot be marked as returned';
  end if;
end;
$$;

revoke all on function public.mark_transaction_returned(uuid, timestamptz) from public;
grant execute on function public.mark_transaction_returned(uuid, timestamptz) to authenticated;

create or replace function public.soft_delete_transaction(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_updated integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.transactions t
  set deleted_at = now(),
      deleted_by = v_uid
  where t.id = p_transaction_id
    and t.deleted_at is null
    and public.is_active_ledger_member(t.ledger_id);

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Transaction not found or no permission';
  end if;
end;
$$;

revoke all on function public.soft_delete_transaction(uuid) from public;
grant execute on function public.soft_delete_transaction(uuid) to authenticated;
