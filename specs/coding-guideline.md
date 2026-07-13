# Coding Guideline

## Vue

- 使用 `<script setup lang="ts">`
- Page 負責組合，不直接寫資料庫 Query
- 表單使用獨立 schema 驗證
- 建議使用 Zod

## Services

Service 命名：

- `getTransactions`
- `createTransaction`
- `markTransactionReturned`
- `softDeleteTransaction`

## Types

Database Generated Types 放置：

```text
src/types/database.types.ts
```

Application DTO 放置：

```text
src/features/<feature>/types.ts
```

## Money

- Database 使用 numeric
- Frontend 不使用浮點數進行財務累加
- 可使用 decimal.js 或以字串傳遞
- 顯示使用 Intl.NumberFormat

## Dates

- transaction_date 使用 YYYY-MM-DD
- 系統時間使用 ISO 8601 UTC
- 顯示轉換為 Asia/Taipei
