# SPEC-001 Foundation

## Goal

建立專案、登入、成員資料、資料庫 Migration 與共用基礎。

## Scope

- Vue 3 + Vite + TypeScript
- Vuetify
- Pinia
- Vue Router
- Supabase Client
- Supabase Auth
- PWA 基礎
- Database Migration
- RLS
- Seed Categories

## Pages

- `/login`
- `/`
- `/transactions`
- `/transactions/new`

## Authentication Rules

- 未登入者只能前往 `/login`
- 已登入者前往 `/login` 時導向 `/`
- 登入成功後同步建立 member profile
- V1 可使用 Email Magic Link 或 Google Login

## Seed Categories

### Income

- 專案收入
- 商品收入
- 其他收入

### Expense

- 軟體
- 行銷
- 開發
- 薪水
- 獎金
- 設備
- 交通
- 餐飲
- 行政
- 其他支出

### Capital

- 初始資本
- 後續增資

## Acceptance Criteria

### AC-001 Login

Given 使用者未登入  
When 開啟首頁  
Then 導向登入頁

### AC-002 Authenticated User

Given 使用者登入成功  
When 開啟首頁  
Then 可進入系統且可取得 member 資料

### AC-003 Member Creation

Given 使用者第一次登入  
When 驗證完成  
Then members 表建立對應資料

### AC-004 Database Security

Given 非 ledger 成員  
When 直接呼叫 Supabase API  
Then 無法讀取或建立 ledger 資料

### AC-005 PWA

Given 使用者使用支援的手機瀏覽器  
When 開啟網站  
Then 可加入主畫面
