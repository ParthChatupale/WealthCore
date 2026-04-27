from datetime import date
from decimal import Decimal

from sqlalchemy import case, func

from app.extensions import db
from app.models import (
    Account,
    Budget,
    Category,
    ReportBudgetActualView,
    ReportCategoryExpenseView,
    ReportMonthlyTotalsView,
    Transaction,
)


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


def previous_month_key(month_key: str) -> str:
    start, _ = month_range_from_key(month_key)
    if start.month == 1:
        previous = date(start.year - 1, 12, 1)
    else:
        previous = date(start.year, start.month - 1, 1)
    return previous.strftime("%Y-%m")


def rolling_month_keys(month_key: str, months: int) -> list[str]:
    start, _ = month_range_from_key(month_key)
    month_points: list[date] = []

    year = start.year
    month = start.month
    for _ in range(months):
        month_points.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1

    return [item.strftime("%Y-%m") for item in reversed(month_points)]


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


def get_monthly_income_expense_totals(user_id: int, month_key: str) -> dict[str, Decimal]:
    start, next_month = month_range_from_key(month_key)
    rows = (
        db.session.query(
            Transaction.type,
            func.coalesce(func.sum(Transaction.amount), 0),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.date >= start,
            Transaction.date < next_month,
        )
        .group_by(Transaction.type)
        .all()
    )
    totals = {
        "income": ZERO_DECIMAL,
        "expense": ZERO_DECIMAL,
    }
    for transaction_type, total in rows:
        totals[str(transaction_type)] = Decimal(total or 0)

    return {
        "income": totals["income"],
        "expenses": totals["expense"],
        "savings": totals["income"] - totals["expense"],
    }


def calculate_delta_pct(current: Decimal, previous: Decimal) -> float:
    if previous == 0:
        if current == 0:
            return 0.0
        return 100.0 if current > 0 else -100.0
    return round(float(((current - previous) / previous) * 100), 2)


def get_monthly_totals_from_view(user_id: int, month_key: str) -> dict[str, Decimal]:
    row = ReportMonthlyTotalsView.query.filter_by(user_id=user_id, month=month_key).first()
    if not row:
        return {
            "income": ZERO_DECIMAL,
            "expenses": ZERO_DECIMAL,
            "savings": ZERO_DECIMAL,
        }

    return {
        "income": Decimal(row.income_total or 0),
        "expenses": Decimal(row.expense_total or 0),
        "savings": Decimal(row.savings_total or 0),
    }


def get_report_overview(user_id: int, month_key: str) -> dict:
    current = get_monthly_totals_from_view(user_id, month_key)
    previous = get_monthly_totals_from_view(user_id, previous_month_key(month_key))
    category_breakdown = get_category_breakdown(user_id, month_key)
    top_category = category_breakdown[0] if category_breakdown else None

    return {
        "month": month_key,
        "income": float(current["income"]),
        "expenses": float(current["expenses"]),
        "savings": float(current["savings"]),
        "income_delta_pct": calculate_delta_pct(current["income"], previous["income"]),
        "expense_delta_pct": calculate_delta_pct(current["expenses"], previous["expenses"]),
        "savings_delta_pct": calculate_delta_pct(current["savings"], previous["savings"]),
        "top_category": {
            "category_id": top_category["category_id"],
            "category_name": top_category["category_name"],
            "icon_name": top_category["icon_name"],
            "spent_amount": top_category["spent_amount"],
        }
        if top_category
        else None,
        "account_balances": list_accounts_with_balances(user_id),
    }


def get_monthly_trend(user_id: int, month_key: str, months: int = 6) -> list[dict]:
    keys = rolling_month_keys(month_key, months)
    month_map = {
        key: {
            "month": key,
            "income": 0.0,
            "expenses": 0.0,
            "savings": 0.0,
        }
        for key in keys
    }

    rows = (
        ReportMonthlyTotalsView.query.filter(
            ReportMonthlyTotalsView.user_id == user_id,
            ReportMonthlyTotalsView.month.in_(keys),
        )
        .all()
    )

    for row in rows:
        key = row.month
        if key not in month_map:
            continue
        month_map[key]["income"] = float(row.income_total or 0)
        month_map[key]["expenses"] = float(row.expense_total or 0)
        month_map[key]["savings"] = float(row.savings_total or 0)

    return [month_map[key] for key in keys]


def get_category_breakdown(user_id: int, month_key: str) -> list[dict]:
    previous_key = previous_month_key(month_key)
    current_rows = (
        ReportCategoryExpenseView.query.filter_by(user_id=user_id, month=month_key)
        .order_by(
            ReportCategoryExpenseView.spent_amount.desc(),
            ReportCategoryExpenseView.category_name.asc(),
        )
        .all()
    )
    previous_rows = ReportCategoryExpenseView.query.filter_by(user_id=user_id, month=previous_key).all()

    previous_map = {row.category_id: Decimal(row.spent_amount or 0) for row in previous_rows}
    current_map = {}
    total_expenses = ZERO_DECIMAL
    for row in current_rows:
        amount = Decimal(row.spent_amount or 0)
        current_map[row.category_id] = {
            "category_id": row.category_id,
            "category_name": row.category_name,
            "icon_name": row.icon_name,
            "spent_amount": amount,
        }
        total_expenses += amount

    category_ids = set(current_map.keys()) | set(previous_map.keys())
    if not category_ids:
        return []

    category_meta_rows = (
        Category.query.filter(Category.category_id.in_(category_ids))
        .order_by(Category.name.asc())
        .all()
    )
    category_meta = {
        category.category_id: {
            "category_name": category.name,
            "icon_name": category.icon_name,
        }
        for category in category_meta_rows
    }

    rows = []
    for category_id in category_ids:
        meta = category_meta.get(category_id, {})
        current_amount = current_map.get(category_id, {}).get("spent_amount", ZERO_DECIMAL)
        previous_amount = previous_map.get(category_id, ZERO_DECIMAL)
        percentage = 0.0
        if total_expenses > 0:
            percentage = round(float((current_amount / total_expenses) * 100), 2)

        rows.append(
            {
                "category_id": category_id,
                "category_name": meta.get("category_name"),
                "icon_name": meta.get("icon_name"),
                "spent_amount": float(current_amount),
                "percentage_of_expenses": percentage,
                "previous_month_spent": float(previous_amount),
                "change_pct": calculate_delta_pct(current_amount, previous_amount),
            }
        )

    rows.sort(key=lambda item: (-item["spent_amount"], item["category_name"] or ""))
    return rows


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


def get_report_budget_rows(user_id: int, month_key: str) -> list[dict]:
    rows = (
        ReportBudgetActualView.query.filter_by(user_id=user_id, month=month_key)
        .order_by(ReportBudgetActualView.category_name.asc())
        .all()
    )

    return [
        {
            "budget_id": row.budget_id,
            "category_id": row.category_id,
            "category_name": row.category_name,
            "icon_name": row.icon_name,
            "limit_amount": float(row.limit_amount),
            "spent_amount": float(row.spent_amount),
            "remaining_amount": float(row.remaining_amount),
            "over_budget_amount": float(row.over_budget_amount),
        }
        for row in rows
    ]


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


def get_report_budget_summary(user_id: int, month_key: str) -> dict:
    category_rows = get_report_budget_rows(user_id, month_key)
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
