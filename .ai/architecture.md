# Architecture

## High-Level Architecture

```text
Browser / PWA
    |
    v
Vue 3 + TypeScript + Vuetify
    |
    v
Supabase SDK
    |
    +-- Auth
    +-- PostgreSQL
    +-- Row Level Security
    +-- Storage
    +-- Realtime (optional for V1)
```

## Deployment

```text
Frontend: Cloudflare Pages
Backend Services: Supabase
```

## Architectural Principles

- Mobile First
- Minimal Backend Maintenance
- Database-Level Authorization
- Immutable Transaction Records
- Soft Delete Only
- Explicit Business Constraints
- Prefer simple relational design over premature abstraction

## Frontend Layers

```text
src/
├── app/
├── components/
├── composables/
├── features/
│   ├── auth/
│   ├── transactions/
│   ├── dashboard/
│   └── members/
├── lib/
├── router/
├── services/
├── stores/
├── types/
└── views/
```

## Data Access

前端不得在 Component 內直接散落 Supabase Query。

所有資料操作集中在：

```text
src/services/
```

建議：

- auth.service.ts
- member.service.ts
- transaction.service.ts
- dashboard.service.ts
- attachment.service.ts
