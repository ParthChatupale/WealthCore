# Finance Manager Database Schema

This is the current working schema and flow reference for the backend implementation.

## Auth and User Flow

Unauthenticated users can access:

- Landing page
- Login
- Register

Authenticated users can access:

- Dashboard
- Transactions
- Accounts
- Budget
- Reports
- Settings
- Logout

Authentication flow:

```text
User logs in or registers
Backend issues a JWT access token
JWT is stored in an HttpOnly cookie
Protected routes validate that cookie and resolve the current user
Dashboard and all finance data are loaded only for that user
If the auth cookie is missing or invalid, return unauthorized
```

Regional preferences are currently stored directly on `users`:

```text
users.country
users.currency
```

## ER Diagram

```mermaid
erDiagram

    USER {
        int user_id PK
        string name
        string email
        string password_hash
        string country
        string currency
        datetime created_at
    }

    ACCOUNT {
        int account_id PK
        int user_id FK
        string name
        string type
        decimal initial_balance
        datetime created_at
    }

    CATEGORY {
        int category_id PK
        int user_id FK
        string name
        string type
        boolean is_default
    }

    SUBCATEGORY {
        int subcategory_id PK
        int category_id FK
        string name
    }

    TRANSACTION {
        int transaction_id PK
        int user_id FK
        int account_id FK
        int category_id FK
        int subcategory_id FK nullable
        int recurring_id FK nullable
        decimal amount
        string type
        date date
        string description
        datetime created_at
    }

    BUDGET {
        int budget_id PK
        int user_id FK
        int category_id FK
        string month
        decimal limit_amount
    }

    RECURRING_TRANSACTION {
        int recurring_id PK
        int user_id FK
        int account_id FK
        int category_id FK
        decimal amount
        string type
        string frequency
        date next_run_date
    }

    REPORT_SNAPSHOT {
        int report_id PK
        int user_id FK
        string month
        decimal total_income
        decimal total_expense
        decimal savings
        datetime generated_at
    }

    USER ||--o{ ACCOUNT : owns
    USER ||--o{ CATEGORY : defines
    USER ||--o{ TRANSACTION : records
    USER ||--o{ BUDGET : sets
    USER ||--o{ RECURRING_TRANSACTION : schedules
    USER ||--o{ REPORT_SNAPSHOT : generates

    ACCOUNT ||--o{ TRANSACTION : used_for
    ACCOUNT ||--o{ RECURRING_TRANSACTION : source_for

    CATEGORY ||--o{ SUBCATEGORY : contains
    CATEGORY ||--o{ TRANSACTION : classifies
    CATEGORY ||--o{ BUDGET : planned_for
    CATEGORY ||--o{ RECURRING_TRANSACTION : assigned_to

    SUBCATEGORY ||--o{ TRANSACTION : optionally_classifies

    RECURRING_TRANSACTION ||--o{ TRANSACTION : generates
```

## Notes

- Each user has isolated financial data through `user_id`.
- Authentication is handled with JWT stored in an HttpOnly cookie.
- `accounts.initial_balance` stores the starting amount for each account.
- Once transactions are implemented, displayed account balance is calculated as:
  `initial_balance + total income - total expenses` for that account.
- `subcategory_id` is optional because a transaction may use only a main category.
- `recurring_id` is optional because only generated recurring transactions reference it.
- `month` in `budgets` and `report_snapshots` represents a monthly reporting period such as `2026-04`.
- `transactions` are the core financial records and drive dashboard summaries, budget tracking, and reports.
