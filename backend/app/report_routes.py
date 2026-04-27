from re import compile

from flask import Blueprint, g, jsonify, request

from app.auth import auth_error, login_required
from app.finance_service import (
    get_budget_summary,
    get_category_breakdown,
    get_monthly_trend,
    get_report_overview,
    month_key_from_date,
)


report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")
MONTH_PATTERN = compile(r"^\d{4}-(0[1-9]|1[0-2])$")


@report_bp.get("/overview")
@login_required
def overview():
    month_key, error = parse_month_key(request.args.get("month"))
    if error:
        return auth_error(error, 400)
    return jsonify(get_report_overview(g.current_user.user_id, month_key))


@report_bp.get("/monthly-trend")
@login_required
def monthly_trend():
    month_key, error = parse_month_key(request.args.get("month"))
    if error:
        return auth_error(error, 400)

    months, error = parse_month_count(request.args.get("months"))
    if error:
        return auth_error(error, 400)

    return jsonify(
        {
            "month": month_key,
            "months": months,
            "trend": get_monthly_trend(g.current_user.user_id, month_key, months),
        }
    )


@report_bp.get("/category-breakdown")
@login_required
def category_breakdown():
    month_key, error = parse_month_key(request.args.get("month"))
    if error:
        return auth_error(error, 400)

    return jsonify(
        {
            "month": month_key,
            "categories": get_category_breakdown(g.current_user.user_id, month_key),
        }
    )


@report_bp.get("/budget-vs-actual")
@login_required
def budget_vs_actual():
    month_key, error = parse_month_key(request.args.get("month"))
    if error:
        return auth_error(error, 400)

    return jsonify(get_budget_summary(g.current_user.user_id, month_key))


def parse_month_key(value: str | None) -> tuple[str, str | None]:
    month_key = (value or month_key_from_date()).strip()
    if not MONTH_PATTERN.match(month_key):
        return "", "Month must be in YYYY-MM format."
    return month_key, None


def parse_month_count(value: str | None) -> tuple[int, str | None]:
    if value in (None, ""):
        return 6, None

    try:
        months = int(value)
    except (TypeError, ValueError):
        return 0, "Months must be a valid integer."

    if months < 1 or months > 12:
        return 0, "Months must be between 1 and 12."
    return months, None
