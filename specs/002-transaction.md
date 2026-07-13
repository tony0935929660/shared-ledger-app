# SPEC-002 Transaction

## Goal

完成新增、列表、詳情、圖片、軟刪除及返還流程。

## Create Transaction Form

### Common Fields

- Transaction Type
- Title
- Amount
- Category
- Transaction Date
- Note
- Attachments

### Expense Fields

- Payment Method
- Advance Member

### Conditional Rules

#### Company Payment

- advance_member_id = null
- 不顯示返還欄位

#### Member Advance

- 必須選擇成員
- returned_at 初始為 null

#### Income / Capital

- 不顯示付款方式
- 不顯示代墊人
- 不顯示返還欄位

## Attachment Rules

- 0 至 5 張圖片
- JPEG / PNG / WebP
- 單張最大 5 MB
- 建立交易成功後才確認附件紀錄
- 上傳失敗不得產生不完整交易

## Transaction List

顯示：

- 日期
- 類型
- 項目名稱
- 金額
- 分類
- 建立者
- 付款方式
- 代墊人
- 返還狀態

排序：

1. transaction_date DESC
2. created_at DESC

## Filters

- Keyword: title / note
- Transaction Type
- Category
- Date Range
- Advance Member
- Reimbursement Status

## Reimbursement

只有未刪除、member_advance 且尚未返還的支出可以標記返還。

呼叫 RPC：

```text
mark_transaction_returned(transaction_id, returned_at)
```

系統自動：

- returned_by = auth.uid()

## Soft Delete

呼叫 RPC：

```text
soft_delete_transaction(transaction_id)
```

系統自動：

- deleted_at = now()
- deleted_by = auth.uid()

## Acceptance Criteria

### AC-101 Create Income

Given 使用者已登入  
When 建立一筆收入  
Then 交易建立成功且 payment_method、advance_member_id、returned_at 均為 NULL

### AC-102 Create Company Expense

Given 使用者選擇支出與公司直接付款  
When 送出表單  
Then advance_member_id 為 NULL

### AC-103 Create Member Advance

Given 使用者選擇支出與成員代墊  
When 選擇代墊人並送出  
Then 交易建立成功且 returned_at 為 NULL

### AC-104 Invalid Advance

Given 使用者選擇成員代墊但未選成員  
When 送出  
Then 表單禁止提交

### AC-105 Immutable Transaction

Given 交易已建立  
When 使用者嘗試修改金額或項目名稱  
Then 系統無編輯入口且資料庫拒絕更新

### AC-106 Return Advance

Given 交易為未返還成員代墊  
When 標記返還日期  
Then returned_at 與 returned_by 正確寫入

### AC-107 Soft Delete

Given 交易存在  
When 使用者刪除交易  
Then資料仍存在，deleted_at 與 deleted_by 有值，預設列表不顯示

### AC-108 Attachment

Given 使用者附加有效圖片  
When 建立交易  
Then 圖片可於詳情頁預覽
