# Data Access Contract

本專案主要透過 Supabase SDK 與 RPC 操作。

## Queries

### listTransactions

Input:

```ts
type TransactionFilter = {
  keyword?: string
  type?: 'income' | 'expense' | 'capital'
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  advanceMemberId?: string
  reimbursementStatus?: 'pending' | 'returned'
}
```

Output:

```ts
type TransactionListItem = {
  id: string
  type: 'income' | 'expense' | 'capital'
  title: string
  amount: string
  categoryName: string
  transactionDate: string
  paymentMethod: 'company' | 'member_advance' | null
  advanceMemberName: string | null
  returnedAt: string | null
  createdByName: string
  createdAt: string
}
```

## Commands

### createTransaction

必須使用 Database Transaction 或 RPC，確保：

- transaction 建立
- attachments 建立
- 任一步驟失敗則全部回滾

### markTransactionReturned

Input:

```ts
{
  transactionId: string
  returnedAt: string
}
```

### softDeleteTransaction

Input:

```ts
{
  transactionId: string
}
```
