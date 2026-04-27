from __future__ import annotations

from calendar import monthrange
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from app.extensions import db
from app.models import Account, Category, RecurringTransaction, Subcategory, Transaction


ALLOWED_RECURRING_FREQUENCIES = {"daily", "weekly", "monthly", "yearly"}


def list_recurring_rules(user_id: int, today: date | None = None) -> dict:
    reference_day = today or date.today()
    rules = (
        RecurringTransaction.query.filter_by(user_id=user_id)
        .order_by(RecurringTransaction.next_run_date.asc(), RecurringTransaction.created_at.asc())
        .all()
    )
    serialized = []
    due_count = 0
    for rule in rules:
        payload = rule.to_dict()
        payload["is_due"] = rule.next_run_date <= reference_day
        if payload["is_due"]:
            due_count += 1
        serialized.append(payload)

    return {
        "rules": serialized,
        "due_count": due_count,
    }


def validate_recurring_payload(payload: dict, user_id: int) -> tuple[dict | None, str | None]:
    recurring_type = (payload.get("type") or "").strip().lower()
    if recurring_type not in {"income", "expense"}:
        return None, "Recurring transaction type must be income or expense."

    account_id, error = parse_required_int(payload.get("account_id"), "Account is required.")
    if error:
        return None, error

    category_id, error = parse_required_int(payload.get("category_id"), "Category is required.")
    if error:
        return None, error

    subcategory_id, error = parse_optional_int(payload.get("subcategory_id"), "Subcategory is invalid.")
    if error:
        return None, error

    amount, error = parse_required_amount(payload.get("amount"))
    if error:
        return None, error

    frequency = (payload.get("frequency") or "").strip().lower()
    if frequency not in ALLOWED_RECURRING_FREQUENCIES:
        return None, "Frequency must be daily, weekly, monthly, or yearly."

    next_run_date, error = parse_required_date(payload.get("next_run_date"))
    if error:
        return None, error

    description = (payload.get("description") or "").strip() or None

    account = Account.query.filter_by(account_id=account_id, user_id=user_id).first()
    if not account:
        return None, "Selected account was not found."

    category = Category.query.filter_by(category_id=category_id, user_id=user_id).first()
    if not category:
        return None, "Selected category was not found."
    if category.type != recurring_type:
        return None, "Category type must match the recurring transaction type."

    subcategory = None
    if subcategory_id is not None:
        subcategory = Subcategory.query.filter_by(subcategory_id=subcategory_id).first()
        if not subcategory or subcategory.category_id != category.category_id:
            return None, "Selected subcategory does not belong to the selected category."

    return {
        "type": recurring_type,
        "account": account,
        "category": category,
        "subcategory": subcategory,
        "amount": amount,
        "description": description,
        "frequency": frequency,
        "next_run_date": next_run_date,
    }, None


def run_due_recurring_rules(user_id: int, today: date | None = None) -> dict:
    reference_day = today or date.today()
    due_rules = (
        RecurringTransaction.query.filter(
            RecurringTransaction.user_id == user_id,
            RecurringTransaction.next_run_date <= reference_day,
        )
        .order_by(RecurringTransaction.next_run_date.asc(), RecurringTransaction.created_at.asc())
        .all()
    )

    generated_transactions: list[Transaction] = []
    affected_rule_ids: list[int] = []

    for rule in due_rules:
        if rule.recurring_id not in affected_rule_ids:
            affected_rule_ids.append(rule.recurring_id)

        run_date = rule.next_run_date
        while run_date <= reference_day:
            transaction = Transaction(
                user_id=rule.user_id,
                account_id=rule.account_id,
                category_id=rule.category_id,
                subcategory_id=rule.subcategory_id,
                recurring_id=rule.recurring_id,
                amount=rule.amount,
                type=rule.type,
                date=run_date,
                description=rule.description,
            )
            db.session.add(transaction)
            generated_transactions.append(transaction)
            run_date = advance_run_date(run_date, rule.frequency)

        rule.next_run_date = run_date

    db.session.commit()

    return {
        "created_count": len(generated_transactions),
        "affected_rule_ids": affected_rule_ids,
        "generated_transactions": [transaction.to_dict() for transaction in generated_transactions],
    }


def advance_run_date(current: date, frequency: str) -> date:
    if frequency == "daily":
        return date.fromordinal(current.toordinal() + 1)
    if frequency == "weekly":
        return date.fromordinal(current.toordinal() + 7)
    if frequency == "monthly":
        return add_months_clamped(current, 1)
    if frequency == "yearly":
        return add_years_clamped(current, 1)
    raise ValueError(f"Unsupported frequency: {frequency}")


def add_months_clamped(current: date, months: int) -> date:
    total_month = (current.month - 1) + months
    year = current.year + total_month // 12
    month = total_month % 12 + 1
    day = min(current.day, monthrange(year, month)[1])
    return date(year, month, day)


def add_years_clamped(current: date, years: int) -> date:
    year = current.year + years
    month = current.month
    day = min(current.day, monthrange(year, month)[1])
    return date(year, month, day)


def parse_required_int(value, error_message: str):
    parsed_value, error = parse_optional_int(value, error_message)
    if parsed_value is None:
        return None, error_message
    return parsed_value, error


def parse_optional_int(value, error_message: str):
    if value in (None, ""):
        return None, None
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, error_message


def parse_required_amount(value):
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        return None, "Amount must be a valid number."

    if amount <= 0:
        return None, "Amount must be greater than zero."

    return amount, None


def parse_required_date(value):
    if not value:
        return None, "Next run date is required."
    return parse_optional_date(value, "Next run date is invalid.")


def parse_optional_date(value, error_message: str):
    if not value:
        return None, None
    try:
        parts = str(value).split("-")
        return date(int(parts[0]), int(parts[1]), int(parts[2])), None
    except (ValueError, IndexError, TypeError):
        return None, error_message
