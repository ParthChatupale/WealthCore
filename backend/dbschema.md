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
- Categories
- Recurring
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
        string country nullable
        string currency nullable
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
        string icon_name nullable
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
        string description nullable
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
        int subcategory_id FK nullable
        decimal amount
        string type
        string description nullable
        string frequency
        date next_run_date
        datetime created_at
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
    SUBCATEGORY ||--o{ RECURRING_TRANSACTION : optionally_classifies

    RECURRING_TRANSACTION ||--o{ TRANSACTION : generates
```

## Notes

- Each user has isolated financial data through `user_id`.
- Authentication is handled with JWT stored in an HttpOnly cookie.
- `accounts.initial_balance` stores the starting amount for each account.
- Once transactions are implemented, displayed account balance is calculated as:
  `initial_balance + total income - total expenses` for that account.
- Monthly budgets are stored as one row per `user + expense category + month`.
- Budget tracking is live: actual spending for a month is calculated from `expense` transactions in that same month.
- Overall monthly budget is derived from the sum of category budget limits rather than stored separately.
- Categories now support `icon_name`, and each category can contain user-owned subcategories.
- `subcategory_id` is optional because a transaction may use only a main category.
- `recurring_id` is optional because only generated recurring transactions reference it.
- Recurring rules now also support optional `subcategory_id` and `description`.
- `month` in `budgets` and `report_snapshots` represents a monthly reporting period such as `2026-04`.
- `transactions` are the core financial records and drive dashboard summaries, budget tracking, and reports.
- `report_snapshots` currently exists in the schema but live reporting is built from real queries, not stored snapshots.

## Table Purpose

- `users`: authentication and user-level regional preferences
- `accounts`: money containers such as bank, cash, and wallet
- `categories`: main classification buckets for income and expense data
- `subcategories`: more detailed grouping under a parent category
- `transactions`: actual financial events and the main analytical source
- `budgets`: monthly category-level spending plans
- `recurring_transactions`: automation rules that generate future transactions
- `report_snapshots`: reserved reporting table for future extension

## Why Recurring Rules Are Separate

Recurring rules are not actual money events. They are instructions that say “create this transaction whenever it becomes due.”  
Keeping them separate from `transactions` avoids mixing:

- future automation rules
- historical financial records

When a rule becomes due, it generates real transaction rows linked by `transactions.recurring_id`.

## Normalization and Constraints

- User-owned data is isolated by `user_id`
- Account names are unique per user
- Category names are unique per user per type
- Subcategory names are unique within a category
- Budget rows are unique per `user + category + month`
- Transaction and recurring `type` are constrained to `income` or `expense`
- Recurring `frequency` is constrained to `daily`, `weekly`, `monthly`, or `yearly`
- Positive-money constraints are enforced on transactions and recurring rules
- Account balances are not duplicated as mutable state; live balance is derived from transaction history
