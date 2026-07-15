# Product and Architecture Decisions

## ADR-001 Transaction Types

V1 僅允許：

- Income
- Expense
- Capital

不得新增 Transfer、Loan、Refund 等其他類型。

## ADR-002 Transaction Immutability

交易建立後，以下欄位不得修改：

- type
- title
- amount
- category_id
- transaction_date
- note
- payment_method
- advance_member_id
- created_by
- created_at

## ADR-003 Reimbursement Exception

唯一允許變更的交易資訊：

- returned_at
- returned_by

`returned_by` 由系統自動寫入目前登入者。

返還一旦設定後，不允許取消（不得將 `returned_at` 改回 NULL）。

## ADR-004 Payment Method

只有 Expense 可設定付款方式：

- `company`
- `member_advance`

Income 與 Capital 的 `payment_method` 必須為 NULL。

## ADR-005 Advance Member

- `member_advance` 必須指定 `advance_member_id`
- `company` 必須令 `advance_member_id` 為 NULL
- Income 與 Capital 必須令 `advance_member_id` 為 NULL

## ADR-006 Soft Delete

任何交易與附件不得 Hard Delete。

刪除交易時填入：

- deleted_at
- deleted_by

## ADR-007 Attachment Storage

圖片檔案放在 Supabase Storage。

Database 僅保存：

- storage_path
- original_name
- mime_type
- size_bytes

## ADR-008 Single Shared Ledger

V1 僅支援一個共同公司帳本。

資料模型保留 `ledger_id`，但不提供多帳本 UI。

## ADR-009 Currency

V1 僅使用新台幣 TWD。

金額使用 `numeric(14,2)`。

## ADR-010 Timezone

所有資料庫時間使用 UTC。

前端顯示使用 Asia/Taipei。

## ADR-011 Active Member Authorization

本專案中的「有效成員」定義為：

- `members.is_active = true`

所有 ledger 讀取與交易相關操作，皆需符合有效成員授權。

## ADR-012 Controlled RPC Path

V1 的高風險狀態變更必須走受控 RPC，不允許直接一般 UPDATE/DELETE：

- 返還更新：`mark_transaction_returned(transaction_id, returned_at)`
- 交易軟刪除：`soft_delete_transaction(transaction_id)`

此規則用於集中商業邏輯、避免越權更新，並確保稽核欄位由系統一致寫入。
