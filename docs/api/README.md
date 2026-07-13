# API / RPC Documents

V1 主要 RPC：

- create_transaction
- mark_transaction_returned
- soft_delete_transaction

所有 RPC 必須：

- 依 auth.uid() 驗證使用者
- 驗證 ledger membership
- 驗證商業規則
- 回傳明確錯誤碼
