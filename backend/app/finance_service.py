from datetime import date
from decimal import Decimal

from sqlalchemy import case, func

from app.extensions import db
from app.models import Account, Transaction


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
