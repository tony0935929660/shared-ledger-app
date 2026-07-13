# Prompt — Review Spec Implementation

請檢查目前程式是否符合指定 Spec。

Review 項目：

- 是否違反 `specs/decisions.md`
- 是否存在可修改交易內容的入口
- 是否存在 Hard Delete
- 是否正確記錄 created_by / created_at
- 是否正確記錄 deleted_by / deleted_at
- 成員代墊是否強制選擇代墊人
- 公司付款是否禁止代墊人
- 收入與資本投入是否禁止付款方式與代墊欄位
- returned_at 是否為唯一允許變更的交易欄位
- RLS 是否防止非成員讀寫資料
- 是否符合手機與桌機使用情境

請列出：
1. Blocker
2. Major
3. Minor
4. 建議修正方式
