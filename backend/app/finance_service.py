from datetime import date
from decimal import Decimal

from sqlalchemy import case, func

from app.extensions import db
from app.models import Account, Budget, Category, Transaction


ZERO_DECIMAL = Decimal("0.00")


def get_account_adjustments(user_id: int) -> dict[int, Decimal]:
    amount_delta = case(
        (Transaction.type == "income", Transaction.amount),
        else_=-Transaction.amount,
    )
    rows = (
        db.session.query(
            Transaction.account_id,
            func.coalesce(func.sum(amount_delta), 0),
        )
        .filter(Transaction.user_id == user_id)
        .group_by(Transaction.account_id)
        .all()
    )
    return {account_id: Decimal(delta) for account_id, delta in rows}


def serialize_account_with_balance(account: Account, adjustments: dict[int, Decimal]):
    display_balance = Decimal(account.initial_balance) + adjustments.get(account.account_id, ZERO_DECIMAL)
    return account.to_dict(display_balance=display_balance)


def list_accounts_with_balances(user_id: int) -> list[dict]:
    accounts = (
        Account.query.filter_by(user_id=user_id)
        .order_by(Account.created_at.asc())
        .all()
    )
    adjustments = get_account_adjustments(user_id)
    return [serialize_account_with_balance(account, adjustments) for account in accounts]


def get_current_month_range(reference_date: date | None = None) -> tuple[date, date]:
    current = reference_date or date.today()
    start = current.replace(day=1)

    if start.month == 12:
        next_month = start.replace(year=start.year + 1, month=1)
    else:
        next_month = start.replace(month=start.month + 1)

    return start, next_month


def get_current_month_summary(user_id: int, reference_date: date | None = None) -> dict[str, float]:
    start, next_month = get_current_month_range(reference_date)

    def amount_sum(transaction_type: str) -> Decimal:
        total = (
            db.session.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == user_id,
                Transaction.type == transaction_type,
                Transaction.date >= start,
                Transaction.date < next_month,
            )
            .scalar()
        )
        return Decimal(total or 0)

    income = amount_sum("income")
    expenses = amount_sum("expense")

    return {
        "current_month_income": float(income),
        "current_month_expenses": float(expenses),
        "current_month_savings": float(income - expenses),
    }


def month_key_from_date(reference_date: date | None = None) -> str:
    current = reference_date or date.today()
    return current.strftime("%Y-%m")


def month_range_from_key(month_key: str) -> tuple[date, date]:
    year = int(month_key[:4])
    month = int(month_key[5:7])
    start = date(year, month, 1)

    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)

    return start, next_month


def get_monthly_expense_spending_by_category(user_id: int, month_key: str) -> dict[int, Decimal]:
    start, next_month = month_range_from_key(month_key)
    rows = (
        db.session.query(
            Transaction.category_id,
            func.coalesce(func.sum(Transaction.amount), 0),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= start,
            Transaction.date < next_month,
        )
        .group_by(Transaction.category_id)
        .all()
    )
    return {category_id: Decimal(total) for category_id, total in rows}


def get_budget_rows_with_actuals(user_id: int, month_key: str) -> list[dict]:
    budget_rows = (
        Budget.query.join(Category)
        .filter(
            Budget.user_id == user_id,
            Budget.month == month_key,
            Category.type == "expense",
        )
        .order_by(Category.name.asc())
        .all()
    )
    actuals = get_monthly_expense_spending_by_category(user_id, month_key)

    rows = []
    for budget in budget_rows:
        spent_amount = actuals.get(budget.category_id, ZERO_DECIMAL)
        remaining_amount = Decimal(budget.limit_amount) - spent_amount
        over_budget_amount = abs(remaining_amount) if remaining_amount < 0 else ZERO_DECIMAL
        rows.append(
            {
                "budget_id": budget.budget_id,
                "category_id": budget.category_id,
                "category_name": budget.category.name if budget.category else None,
                "icon_name": budget.category.icon_name if budget.category else None,
                "limit_amount": float(budget.limit_amount),
                "spent_amount": float(spent_amount),
                "remaining_amount": float(remaining_amount),
                "over_budget_amount": float(over_budget_amount),
            }
        )
    return rows


def get_budget_summary(user_id: int, month_key: str) -> dict:
    category_rows = get_budget_rows_with_actuals(user_id, month_key)
    total_limit = sum(Decimal(str(row["limit_amount"])) for row in category_rows)
    total_spent = sum(Decimal(str(row["spent_amount"])) for row in category_rows)
    total_remaining = total_limit - total_spent
    used_percentage = 0
    if total_limit > 0:
        used_percentage = min(100, round(float((total_spent / total_limit) * 100), 2))

    over_budget_categories = [
        {
            "category_id": row["category_id"],
            "category_name": row["category_name"],
            "icon_name": row["icon_name"],
            "over_budget_amount": row["over_budget_amount"],
        }
        for row in category_rows
        if row["over_budget_amount"] > 0
    ]

    return {
        "month": month_key,
        "has_budget": bool(category_rows),
        "total_limit": float(total_limit),
        "total_spent": float(total_spent),
        "total_remaining": float(total_remaining),
        "used_percentage": used_percentage,
        "over_budget_categories": over_budget_categories,
        "categories": category_rows,
    }


def list_expense_categories(user_id: int) -> list[dict]:
    categories = (
        Category.query.filter_by(user_id=user_id, type="expense")
        .order_by(Category.name.asc())
        .all()
    )
    return [category.to_dict(include_subcategories=True) for category in categories]
