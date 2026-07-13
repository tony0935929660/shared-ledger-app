# ERD

```mermaid
erDiagram
  AUTH_USERS ||--|| MEMBERS : profile
  LEDGERS ||--o{ LEDGER_MEMBERS : contains
  MEMBERS ||--o{ LEDGER_MEMBERS : joins
  LEDGERS ||--o{ CATEGORIES : owns
  LEDGERS ||--o{ TRANSACTIONS : owns
  CATEGORIES ||--o{ TRANSACTIONS : classifies
  MEMBERS ||--o{ TRANSACTIONS : creates
  MEMBERS ||--o{ TRANSACTIONS : advances
  TRANSACTIONS ||--o{ TRANSACTION_ATTACHMENTS : has
```
