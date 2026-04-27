from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from re import compile

from flask import Blueprint, g, jsonify, request

from app.auth import auth_error, login_required
from app.extensions import db
from app.finance_service import (
    get_budget_summary,
    list_expense_categories,
    month_key_from_date,
)
from app.models import Budget, Category


budget_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")
MONTH_PATTERN = compile(r"^\d{4}-(0[1-9]|1[0-2])$")


@budget_bp.get("/current")
@login_required
def get_current_budget():
    month_key = request.args.get("month") or month_key_from_date()
    error = validate_month_key(month_key)
    if error:
        return auth_error(error, 400)

    summary = get_budget_summary(g.current_user.user_id, month_key)
    return jsonify(
        {
            **summary,
            "available_categories": list_expense_categories(g.current_user.user_id),
        }
    )


@budget_bp.get("/summary")
@login_required
def get_budget_summary_endpoint():
    month_key = request.args.get("month") or month_key_from_date()
    error = validate_month_key(month_key)
    if error:
        return auth_error(error, 400)

    return jsonify(get_budget_summary(g.current_user.user_id, month_key))


@budget_bp.post("")
@login_required
def save_monthly_budget():
    payload = request.get_json(silent=True) or {}
    month_key = (payload.get("month") or "").strip()
    error = validate_month_key(month_key)
    if error:
        return auth_error(error, 400)

    category_limits = payload.get("category_limits")
    validated_limits, error = validate_category_limits(g.current_user.user_id, category_limits)
    if error:
        return auth_error(error, 400)

    existing_rows = {
        budget.category_id: budget
        for budget in Budget.query.filter_by(
            user_id=g.current_user.user_id,
            month=month_key,
        ).all()
    }

    submitted_category_ids = {item["category"].category_id for item in validated_limits}

    for category_id, budget in existing_rows.items():
        if category_id not in submitted_category_ids:
            db.session.delete(budget)

    for item in validated_limits:
        category = item["category"]
        limit_amount = item["limit_amount"]
        if category.category_id in existing_rows:
            existing_rows[category.category_id].limit_amount = limit_amount
        else:
            db.session.add(
                Budget(
                    user_id=g.current_user.user_id,
                    category_id=category.category_id,
                    month=month_key,
                    limit_amount=limit_amount,
                )
            )

    db.session.commit()
    summary = get_budget_summary(g.current_user.user_id, month_key)
    response = jsonify(
        {
            **summary,
            "available_categories": list_expense_categories(g.current_user.user_id),
        }
    )
    response.status_code = 201
    return response


@budget_bp.patch("/<int:budget_id>")
@login_required
def update_budget_row(budget_id: int):
    budget = get_user_budget_or_404(budget_id)
    payload = request.get_json(silent=True) or {}

    limit_amount, error = parse_limit_amount(payload.get("limit_amount"))
    if error:
        return auth_error(error, 400)

    budget.limit_amount = limit_amount
    db.session.commit()

    category_spent_summary = get_budget_summary(g.current_user.user_id, budget.month)
    updated_row = next(
        row for row in category_spent_summary["categories"] if row["budget_id"] == budget.budget_id
    )
    return jsonify({"budget": updated_row})


@budget_bp.delete("/<int:budget_id>")
@login_required
def delete_budget_row(budget_id: int):
    budget = get_user_budget_or_404(budget_id)
    db.session.delete(budget)
    db.session.commit()
    return jsonify({"message": "Budget deleted"})


def validate_month_key(month_key: str) -> str | None:
    if not month_key:
        return "Month is required."
    if not MONTH_PATTERN.match(month_key):
        return "Month must be in YYYY-MM format."
    return None


def validate_category_limits(user_id: int, category_limits) -> tuple[list[dict] | None, str | None]:
    if not isinstance(category_limits, list):
        return None, "Category limits must be provided as a list."

    validated = []
    seen_category_ids = set()

    for item in category_limits:
        if not isinstance(item, dict):
            return None, "Category limits must be valid objects."

        category_id = item.get("category_id")
        if category_id in seen_category_ids:
            return None, "Duplicate category budgets are not allowed for the same month."

        try:
            parsed_category_id = int(category_id)
        except (TypeError, ValueError):
            return None, "Category is required."

        category = Category.query.filter_by(
            category_id=parsed_category_id,
            user_id=user_id,
            type="expense",
        ).first()
        if not category:
            return None, "Budget categories must be your expense categories."

        limit_amount, error = parse_limit_amount(item.get("limit_amount"))
        if error:
            return None, error

        validated.append(
            {
                "category": category,
                "limit_amount": limit_amount,
            }
        )
        seen_category_ids.add(parsed_category_id)

    return validated, None


def parse_limit_amount(value) -> tuple[Decimal | None, str | None]:
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        return None, "Budget limit must be a valid number."

    if amount < 0:
        return None, "Budget limit cannot be negative."

    return amount, None


def get_user_budget_or_404(budget_id: int) -> Budget:
    budget = Budget.query.filter_by(
        budget_id=budget_id,
        user_id=g.current_user.user_id,
    ).first()
    if not budget:
        raise NotFoundError()
    return budget


class NotFoundError(Exception):
    pass


@budget_bp.errorhandler(NotFoundError)
def handle_not_found(_error):
    return auth_error("Budget not found.", 404)
