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
        is_active = true;

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