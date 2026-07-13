# Company Ledger — AI Coding Starter Kit

這是一套供創業團隊共同記帳系統使用的 Spec Driven Development 專案規格。

## 建議閱讀順序

1. `.ai/project-context.md`
2. `.ai/architecture.md`
3. `specs/000-product.md`
4. `specs/decisions.md`
5. `specs/database.md`
6. `specs/001-foundation.md`
7. `specs/002-transaction.md`
8. `specs/003-dashboard.md`
9. `specs/004-polish.md`
10. `specs/acceptance.md`

## AI Coding 執行原則

- 一次只實作一個 Spec。
- 實作前必須閱讀 `decisions.md` 與 `database.md`。
- 不得自行增加 V1 範圍外功能。
- 每個 Spec 完成後，必須依 Acceptance Criteria 驗收。
- 所有資料刪除只能使用 Soft Delete。
- 交易內容建立後不可修改，僅返還資訊可更新。

## 建議技術棧

- Frontend: Vue 3 + Vite + TypeScript
- UI: Vuetify
- State: Pinia
- Backend Platform: Supabase
- Database: PostgreSQL
- Auth: Supabase Auth
- Storage: Supabase Storage
- Hosting: Cloudflare Pages
- App Type: Responsive PWA

## Local Development (SPEC-001 Foundation)

### Prerequisites

- Node.js 20.x
- npm 10+
- Supabase project

### Setup

1. 複製環境變數

```bash
cp .env.example .env
```

2. 設定 `.env`

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

3. 安裝依賴

```bash
npm install
```

4. 啟動開發伺服器

```bash
npm run dev
```

### Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Supabase Migration

Foundation migration:

- `supabase/migrations/20260713190000_spec001_foundation.sql`

內容包含：

- Core tables
- Constraints
- RLS policies
- `bootstrap_first_ledger` RPC
- `mark_transaction_returned` RPC
- `soft_delete_transaction` RPC
