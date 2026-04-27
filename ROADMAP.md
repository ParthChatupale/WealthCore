# Finance Manager Roadmap

This file is the current source of truth for project progress.

We are no longer following the original phase numbers exactly, because the implementation order changed once seeded categories allowed transactions and budgets to go live earlier.

From this point onward, we should update this file whenever a milestone is completed or the next work changes.

## Status Legend

- `[x]` Completed
- `[ ]` Planned / not completed yet
- `[~]` In progress or partially complete with known issues

## Completed Foundations

- [x] Project structure split into `Frontend/` and `backend/`
- [x] Flask app factory and PostgreSQL configuration
- [x] SQLAlchemy models for users, accounts, categories, subcategories, transactions, budgets, recurring transactions, and report snapshots
- [x] Flask-Migrate setup and initial schema migration
- [x] Real PostgreSQL database connected through `.env`

## Completed User and Auth Flow

- [x] User registration
- [x] User login
- [x] User logout
- [x] `GET /api/auth/me`
- [x] JWT authentication using HttpOnly cookie
- [x] Protected route guard on backend
- [x] Frontend login/register pages connected to backend
- [x] Frontend route protection for authenticated app pages
- [x] Seed default categories during registration

## Completed First-Time Setup and Accounts

- [x] Store `country` and `currency` on the user
- [x] Dashboard first-time setup checklist
- [x] Create account
- [x] List accounts
- [x] Update account
- [x] Delete unused account
- [x] Use `initial_balance` instead of ambiguous mutable `balance`
- [x] Calculate displayed account balance from `initial_balance + transaction history`

## Completed Transactions and Live Dashboard

- [x] Read seeded categories from backend
- [x] Create income transaction
- [x] Create expense transaction
- [x] List transactions
- [x] Filter transactions by type, account, category, and date
- [x] Edit transaction
- [x] Delete transaction
- [x] Dashboard total balance
- [x] Dashboard current month income
- [x] Dashboard current month expenses
- [x] Dashboard current month savings
- [x] Dashboard recent transactions
- [x] Dashboard account summary

## Completed Budget Core

- [x] `GET /api/budgets/current`
- [x] `GET /api/budgets/summary`
- [x] `POST /api/budgets`
- [x] `PATCH /api/budgets/<id>`
- [x] `DELETE /api/budgets/<id>`
- [x] Category-wise monthly budget limits for expense categories
- [x] Budget vs actual calculation from live transactions
- [x] Dashboard budget snapshot
- [x] Live budget page wired to backend

## Completed Stabilization Work

- [x] Budget UX polish
  - [x] Fix month switching bug caused by partial `YYYY-MM` input such as `2026-0`
  - [x] Replace native month input with a custom themed month picker
  - [x] Improve budget page visual hierarchy and polish
  - [x] Confirm budget dashboard snapshot remains in sync after month and transaction changes

## Completed Taxonomy Phase

- [x] Category, Subcategory, and Icon Management
  - [x] Add category CRUD
  - [x] Add subcategory CRUD
  - [x] Add category icon support
  - [x] Add `/app/categories`
  - [x] Group transactions by category + subcategory in the form UX
  - [x] Use icons in transaction rows, filters, and budget surfaces

## After Taxonomy Phase

- [ ] Reports and analytics
  - [ ] Overview report
  - [ ] Monthly trend report
  - [ ] Category breakdown report
  - [ ] Budget vs actual report page
  - [ ] Consider PostgreSQL views for reporting queries

- [ ] Settings
  - [ ] View profile/settings
  - [ ] Update name and email
  - [ ] Update country and currency
  - [ ] Change password

- [ ] Recurring transactions
  - [ ] Create recurring rule
  - [ ] List recurring rules
  - [ ] Edit recurring rule
  - [ ] Delete recurring rule
  - [ ] Generate due transactions
  - [ ] Advance `next_run_date`

## Final Submission Phase

- [ ] End-to-end testing checklist
- [ ] Better empty states and API error messages
- [ ] Seed/sample demo data if needed
- [ ] Final documentation refresh
- [ ] ER diagram cleanup
- [ ] DB constraints and normalization explanation
- [ ] Presentation/demo notes

## Working Rules

1. This file should be updated whenever a milestone is completed.
2. We should follow the order in this file unless we explicitly decide to revise it.
3. Bugs discovered in completed areas should be added under `Current Stabilization Work` before moving deeper into new features.
