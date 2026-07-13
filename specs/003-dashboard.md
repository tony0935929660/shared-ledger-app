# SPEC-003 Dashboard

## Goal

讓團隊快速掌握公司資金狀況與未返還代墊。

## Metrics

### Total Capital

所有未刪除 Capital 總額。

### Current Month Income

當月未刪除 Income 總額。

### Current Month Expense

當月未刪除 Expense 總額。

### Current Balance

```text
Total Capital + All Income - All Expense
```

## Pending Reimbursements

只計算：

- type = expense
- payment_method = member_advance
- returned_at is null
- deleted_at is null

依 `advance_member_id` 分組。

## Recent Transactions

顯示最近 10 筆未刪除交易。

## Acceptance Criteria

### AC-201 Capital

Given 有多筆資本投入  
When 開啟 Dashboard  
Then 正確顯示全部資本投入總額

### AC-202 Monthly Metrics

Given 不同月份有收入與支出  
When 開啟本月 Dashboard  
Then 僅本月收入支出計入月統計

### AC-203 Balance

Given 有資本、收入與支出  
When 開啟 Dashboard  
Then 餘額符合公式

### AC-204 Pending Reimbursement

Given Tony 有兩筆未返還與一筆已返還代墊  
When 開啟 Dashboard  
Then 只統計兩筆未返還金額

### AC-205 Drill Down

Given 點擊某位成員的待返還金額  
When 進入交易列表  
Then 自動套用該成員與未返還條件
