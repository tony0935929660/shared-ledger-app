# Development Process

## 1. Select Spec

一次只選擇一個 Spec。

## 2. Read Context

AI 必須先讀：

- Project Context
- Architecture
- Decisions
- Database
- Coding Rules

## 3. Plan

AI 先輸出：

- 變更檔案
- Migration
- Components
- Services
- Tests

## 4. Implement

依 Spec 實作，不得擴張範圍。

## 5. Verify

執行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 6. Acceptance

逐項確認 Spec Acceptance Criteria。

## 7. Review

使用 `.ai/prompts/review-spec.md` 進行第二次 AI Review。
