# Deployment Guide (Cloudflare Pages + Supabase)

這份文件是本專案的正式機部署手冊。
目標是用最低成本（Free Tier）上線可供團隊實際連線使用的版本。

## 0. 架構與成本

- Frontend: Cloudflare Pages
- Backend: Supabase (Auth + PostgreSQL + Storage + RLS)
- 起步成本: 可先用免費方案

注意：若你要自訂網域，網域本身可能有年費。

## 1. 佈署前檢查 (Local)

在專案根目錄執行：

```bash
npm install
npm run typecheck
npm run test
npm run build
```

如果 `npm run build` 失敗，不要先上線，先修正到可建置。

## 2. 準備 Supabase Production 專案

1. 建立/選擇一個 Supabase Production Project
2. 取得以下值（等等要放到 Cloudflare Pages 環境變數）:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3. 套用資料庫 Migration 到 Production

本專案目前 migration 檔在：
- `supabase/migrations/20260713190000_spec001_foundation.sql`
- `supabase/migrations/20260713213000_spec002_transaction.sql`

你可以選其中一種方式：

### 方式 A: Supabase SQL Editor（最直覺）

1. 打開 Supabase Dashboard
2. 進入 SQL Editor
3. 依序貼上並執行上述 migration 檔內容
4. 確認執行成功（tables / policies / rpc 都存在）

### 方式 B: Supabase CLI（較自動化）

1. 安裝 Supabase CLI
2. login 並 link 到 production project
3. 執行 migration push（或等效指令）

如果你團隊要走 CI/CD，建議後續改用 CLI 流程。

## 4. Cloudflare Pages 專案設定

1. 到 Cloudflare Dashboard -> Pages -> Create a project
2. 連接你的 GitHub Repo（本專案）
3. Build 設定：
- Framework preset: Vite（若可選）
- Build command: `npm run build`
- Build output directory: `dist`

4. Environment Variables（至少加在 Production）：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

建議 Preview 也加同一組測試環境變數，避免 PR 預覽失敗。

## 5. SPA 路由設定（重要）

本專案使用 Vue Router history mode。
為避免直接打開子路由（例如 `/transactions`）出現 404，請新增檔案：

- `public/_redirects`

內容：

```txt
/* /index.html 200
```

提交此檔後重新部署。

## 6. 佈署後驗收（最少要做）

### 6.1 功能驗收

1. 未登入導向登入頁
2. 登入成功可進 Dashboard
3. 可新增收入 / 支出 / 資本投入
4. Dashboard 指標有正確顯示
5. 點待返還成員可 drill down 到交易列表
6. 可更新個人顯示名稱

### 6.2 安全驗收

1. RLS 啟用
2. Storage policy 已限制 ledger member
3. 無一般 transaction update policy
4. 刪除為 soft delete，不是 hard delete

## 7. 常見問題排查

### 問題 A: 首頁可以開，子路由 404

- 通常是缺少 `public/_redirects`

### 問題 B: Build 成功但頁面白屏

- 檢查 Cloudflare Pages 的環境變數是否都有設定
- 檢查瀏覽器 Console 是否為 Supabase URL/KEY 相關錯誤

### 問題 C: 登入成功但查不到資料

- 檢查 migration 是否完整套用
- 檢查 members / ledger_members 是否有資料
- 檢查 RLS policy 條件是否通過（active member）

## 8. 推薦上線流程

1. 在 main 分支保持 `typecheck + test + build` 全綠
2. 每次發版先套用必要 migration
3. 再觸發 Cloudflare Pages production deploy
4. 依 6.1 與 6.2 跑 smoke test

---

如果你要，我可以下一步直接幫你補 `public/_redirects` 檔，避免正式機路由 404。
