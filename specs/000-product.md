# Product Requirements Document

## 1. Product Name

Company Ledger

## 2. Product Goal

建立一套給創業團隊內部共同使用的記帳工具，能夠記錄：

- 收入
- 支出
- 資本投入
- 成員代墊
- 代墊返還狀態
- 交易圖片附件
- 建立與刪除稽核資訊

## 3. User Stories

### US-001 Login

作為公司成員，我希望登入後才能查看與新增公司帳務資料。

### US-002 Create Transaction

作為公司成員，我希望新增收入、支出或資本投入。

### US-003 Member Advance

作為公司成員，我希望支出時可以指定由哪位成員代墊。

### US-004 Reimbursement

作為公司成員，我希望能將未返還代墊標記為已返還。

### US-005 Attachment

作為公司成員，我希望能附加收據、發票或其他憑證圖片。

### US-006 Audit

作為公司成員，我希望知道交易由誰、何時建立，以及由誰、何時刪除。

### US-007 Dashboard

作為公司成員，我希望快速看到資本投入、收入、支出、結餘及待返還代墊。

## 4. Transaction Types

- `income`
- `expense`
- `capital`

## 5. Success Criteria

- 團隊成員可在手機與桌機完成記帳。
- 新增一筆交易可在單一頁面完成。
- 所有交易均可追溯建立者與建立時間。
- 所有刪除均可追溯刪除者與刪除時間。
- 代墊未返還金額可依成員正確統計。
