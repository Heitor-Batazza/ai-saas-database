# 🧠 AI SaaS Multi-Tenant Database Architecture

Core database architecture designed for a multi-tenant AI Knowledge and Document Management SaaS. Built with **TypeScript**, **PostgreSQL**, **Drizzle ORM**, and **pgvector** for native vector similarity search.

---

## 🎯 Architecture Overview

```mermaid
erDiagram
    USERS ||--o{ WORKSPACE_MEMBERS : belongs_to
    WORKSPACES ||--o{ WORKSPACE_MEMBERS : contains
    WORKSPACES ||--o{ DOCUMENTS : owns
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : contains
    WORKSPACES ||--o{ USAGE_LOGS : tracks
    WORKSPACES ||--o{ API_KEYS : issues

    USERS {
        uuid id PK
        string email
        string full_name
        timestamp created_at
    }
    WORKSPACES {
        uuid id PK
        string name
        string slug
        string plan_tier "free | pro | enterprise"
        int credits_balance
    }
    DOCUMENTS {
        uuid id PK
        uuid workspace_id FK
        string title
        string file_url
        string status "processing | ready | error"
    }
    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        text content
        vector embedding "1536 dimensions"
    }
    USAGE_LOGS {
        uuid id PK
        uuid workspace_id FK
        string action "ai_chat | embedding_generation"
        int tokens_used
        timestamp created_at
    }
```

---

## 🚀 Tech Stack

* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) with `pgvector` extension
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Migration & Tooling:** `drizzle-kit` & `tsx`
* **Validation:** [Zod](https://zod.dev/)

---

## 📂 Project Structure

```
├── src/
│   └── db/
│       ├── schema.ts         # Table definitions, relations, enums & vector extensions
│       ├── index.ts          # PostgreSQL connection & Drizzle instance
│       ├── seed.ts           # Realistic test data generator
│       └── queries.ts        # Production-grade query examples & semantic search
├── drizzle/                  # Auto-generated SQL migrations
├── drizzle.config.ts         # Drizzle Kit CLI configuration
├── tsconfig.json             # TypeScript compiler settings
└── package.json              # Scripts & dependencies
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your PostgreSQL connection string:
```bash
cp .env.example .env
```

### 3. Generate Migrations
```bash
npm run db:generate
```

### 4. Open Drizzle Studio (Visual DB GUI)
```bash
npm run db:studio
```

---

## 👤 Author
Developed by **Heitor Batazza** as part of the AI-Native Full Stack Engineering track.
