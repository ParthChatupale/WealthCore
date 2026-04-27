from flask import Blueprint, g, jsonify, request

from app.auth import auth_error, login_required
from app.extensions import db
from app.models import RecurringTransaction
from app.recurring_service import list_recurring_rules, run_due_recurring_rules, validate_recurring_payload


recurring_bp = Blueprint("recurring", __name__, url_prefix="/api/recurring")


@recurring_bp.get("")
@login_required
def list_rules():
    return jsonify(list_recurring_rules(g.current_user.user_id))


@recurring_bp.post("")
@login_required
def create_rule():
    payload, error = validate_recurring_payload(request.get_json(silent=True) or {}, g.current_user.user_id)
    if error:
        return auth_error(error, 400)

    rule = RecurringTransaction(
        user_id=g.current_user.user_id,
        account_id=payload["account"].account_id,
        category_id=payload["category"].category_id,
        subcategory_id=payload["subcategory"].subcategory_id if payload["subcategory"] else None,
        amount=payload["amount"],
        type=payload["type"],
        description=payload["description"],
        frequency=payload["frequency"],
        next_run_date=payload["next_run_date"],
    )
    db.session.add(rule)
    db.session.commit()
    return jsonify({"rule": rule.to_dict()}), 201


@recurring_bp.patch("/<int:recurring_id>")
@login_required
def update_rule(recurring_id: int):
    rule = get_user_rule_or_404(recurring_id)
    payload, error = validate_recurring_payload(request.get_json(silent=True) or {}, g.current_user.user_id)
    if error:
        return auth_error(error, 400)

    rule.account_id = payload["account"].account_id
    rule.category_id = payload["category"].category_id
    rule.subcategory_id = payload["subcategory"].subcategory_id if payload["subcategory"] else None
    rule.amount = payload["amount"]
    rule.type = payload["type"]
    rule.description = payload["description"]
    rule.frequency = payload["frequency"]
    rule.next_run_date = payload["next_run_date"]
    db.session.commit()
    return jsonify({"rule": rule.to_dict()})


@recurring_bp.delete("/<int:recurring_id>")
@login_required
def delete_rule(recurring_id: int):
    rule = get_user_rule_or_404(recurring_id)
    db.session.delete(rule)
    db.session.commit()
    return jsonify({"message": "Recurring rule deleted"})


@recurring_bp.post("/run-due")
@login_required
def run_due():
    return jsonify(run_due_recurring_rules(g.current_user.user_id))


def get_user_rule_or_404(recurring_id: int) -> RecurringTransaction:
    rule = RecurringTransaction.query.filter_by(
        recurring_id=recurring_id,
        user_id=g.current_user.user_id,
    ).first()
    if not rule:
        raise NotFoundError()
    return rule


class NotFoundError(Exception):
    pass


@recurring_bp.errorhandler(NotFoundError)
def handle_not_found(_error):
    return auth_error("Recurring rule not found.", 404)
