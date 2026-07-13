# Coding Rules

## General

- TypeScript 必須開啟 strict。
- 禁止使用 `any`，除非有明確註解理由。
- 使用 Vue 3 Composition API 與 `<script setup lang="ts">`。
- 商業規則不得只存在於 UI 顯示邏輯。
- 資料庫 Constraint 與 RLS 必須同步保護規則。
- 禁止 Hard Delete。
- 禁止建立一般交易編輯頁。

## Naming

- 檔案使用 kebab-case。
- TypeScript 變數與函式使用 camelCase。
- Type / Interface 使用 PascalCase。
- Database Table 與 Column 使用 snake_case。

## Error Handling

- 使用者可理解的錯誤需顯示 Toast。
- 原始資料庫錯誤不得直接顯示給使用者。
- 所有 service function 必須回傳明確型別。
- 非預期錯誤需記錄到 console，Production 可替換成監控服務。

## Testing

- 重要商業規則使用 Unit Test。
- 建立交易、軟刪除、返還更新使用 Integration Test 或 E2E。
