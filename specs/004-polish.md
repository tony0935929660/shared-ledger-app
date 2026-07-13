# SPEC-004 Polish and Release

## Goal

完成可正式提供創業團隊使用的 V1。

## Responsive Requirements

### Mobile

- 單欄布局
- 新增交易使用全螢幕或底部 Sheet
- 主要按鈕適合單手操作
- 圖片可直接拍照或選取

### Desktop

- Dashboard 卡片橫向排列
- Transaction List 使用 Table
- Filter 固定顯示或可展開

## UX States

- Loading
- Empty
- Error
- Success Toast
- Confirmation Dialog
- Upload Progress

## Security Review

- RLS 已啟用
- Storage Policy 已限制 ledger 成員
- 不存在 public write bucket
- 不存在 SQL hard delete
- 不存在一般 transaction update policy

## Deployment

- Cloudflare Pages
- Environment Variables
- Supabase Production Project
- Custom Domain optional

## Acceptance Criteria

### AC-301 Mobile

Given 手機寬度 360px  
When 使用全部核心功能  
Then 無水平捲動且可完成記帳

### AC-302 Desktop

Given 桌機寬度 1440px  
When 使用 Dashboard 與列表  
Then 內容不過度拉伸並保持可讀性

### AC-303 Failure Handling

Given 圖片上傳失敗  
When 建立交易  
Then 顯示明確錯誤且不留下半成品資料

### AC-304 Production

Given Production URL  
When 兩位成員分別登入  
Then 可看到同一本帳本並共同新增資料
