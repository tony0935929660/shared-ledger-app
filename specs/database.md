# Database Specification

## 1. ledgers

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| name | text | required |
| currency | text | default TWD |
| created_at | timestamptz | default now() |
| created_by | uuid | required |

## 2. members

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK, references auth.users |
| display_name | text | required |
| email | text | required |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

## 3. ledger_members

| Column | Type | Rule |
|---|---|---|
| ledger_id | uuid | FK |
| member_id | uuid | FK |
| role | text | owner / member |
| joined_at | timestamptz | default now() |

Primary Key: `(ledger_id, member_id)`

## 4. categories

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| ledger_id | uuid | FK |
| name | text | required |
| transaction_type | text | income / expense / capital |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

## 5. transactions

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| ledger_id | uuid | FK, required |
| type | text | income / expense / capital |
| title | text | required, max 100 |
| amount | numeric(14,2) | > 0 |
| category_id | uuid | FK, required |
| transaction_date | date | required |
| note | text | nullable, max 1000 |
| payment_method | text | company / member_advance / null |
| advance_member_id | uuid | nullable FK |
| returned_at | timestamptz | nullable |
| returned_by | uuid | nullable FK |
| created_by | uuid | required FK |
| created_at | timestamptz | default now() |
| deleted_by | uuid | nullable FK |
| deleted_at | timestamptz | nullable |

## 6. transaction_attachments

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| transaction_id | uuid | FK |
| storage_path | text | required |
| original_name | text | required |
| mime_type | text | image/jpeg, image/png, image/webp |
| size_bytes | bigint | required |
| created_by | uuid | required |
| created_at | timestamptz | default now() |
| deleted_by | uuid | nullable |
| deleted_at | timestamptz | nullable |

## Constraints

### CK-001 Transaction Type

`type IN ('income','expense','capital')`

### CK-002 Positive Amount

`amount > 0`

### CK-003 Expense Payment

當 `type = 'expense'`：

- payment_method 不得為 NULL
- payment_method = company 時 advance_member_id 必須為 NULL
- payment_method = member_advance 時 advance_member_id 必須非 NULL

### CK-004 Non-Expense Payment

當 `type IN ('income','capital')`：

- payment_method 必須為 NULL
- advance_member_id 必須為 NULL
- returned_at 必須為 NULL
- returned_by 必須為 NULL

### CK-005 Returned Fields

- returned_at 為 NULL 時 returned_by 必須為 NULL
- returned_at 非 NULL 時 returned_by 必須非 NULL
- 只有 member_advance 可填 returned_at

## Recommended Indexes

- transactions `(ledger_id, transaction_date desc, created_at desc)`
- transactions `(ledger_id, type, deleted_at)`
- transactions `(ledger_id, advance_member_id, returned_at)` where deleted_at is null
- categories `(ledger_id, transaction_type, is_active)`
- transaction_attachments `(transaction_id, deleted_at)`

## RLS Rules

### Select

只有 ledger_members 中的有效成員可以讀取該 ledger。

### Insert

只有 ledger_members 中的有效成員可以建立交易。

`created_by` 必須等於 `auth.uid()`。

### Update

一般 Update 不允許。

返還更新必須透過受控 RPC：

`mark_transaction_returned(transaction_id, returned_at)`

### Delete

禁止 SQL DELETE。

軟刪除必須透過 RPC：

`soft_delete_transaction(transaction_id)`
