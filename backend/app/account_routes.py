from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from flask import Blueprint, g, jsonify, request

from app.auth import auth_error, login_required
from app.extensions import db
from app.models import Account, Transaction


account_bp = Blueprint("accounts", __name__, url_prefix="/api")

ALLOWED_ACCOUNT_TYPES = {"Cash", "Bank", "Wallet"}


@account_bp.get("/accounts")
@login_required
def list_accounts():
    accounts = (
        Account.query.filter_by(user_id=g.current_user.user_id)
        .order_by(Account.created_at.asc())
        .all()
    )
    return jsonify({"accounts": [account.to_dict() for account in accounts]})


@account_bp.post("/accounts")
@login_required
def create_account():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    account_type = (payload.get("type") or "").strip()
    initial_balance = payload.get("initial_balance")

    parsed_balance, error = parse_initial_balance(initial_balance)
    if error:
        return auth_error(error, 400)

    error = validate_account_input(name, account_type, parsed_balance)
    if error:
        return auth_error(error, 400)

    if account_name_exists(g.current_user.user_id, name):
        return auth_error("An account with this name already exists.", 409)

    account = Account(
        user_id=g.current_user.user_id,
        name=name,
        type=account_type,
        initial_balance=parsed_balance,
    )
    db.session.add(account)
    db.session.commit()

    response = jsonify({"account": account.to_dict()})
    response.status_code = 201
    return response


@account_bp.patch("/accounts/<int:account_id>")
@login_required
def update_account(account_id: int):
    account = get_user_account_or_404(account_id)
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    account_type = (payload.get("type") or "").strip()
    initial_balance = payload.get("initial_balance")

    parsed_balance, error = parse_initial_balance(initial_balance)
    if error:
        return auth_error(error, 400)

    error = validate_account_input(name, account_type, parsed_balance)
    if error:
        return auth_error(error, 400)

    if account_name_exists(g.current_user.user_id, name, exclude_id=account.account_id):
        return auth_error("An account with this name already exists.", 409)

    account.name = name
    account.type = account_type
    account.initial_balance = parsed_balance
    db.session.commit()

    return jsonify({"account": account.to_dict()})


@account_bp.delete("/accounts/<int:account_id>")
@login_required
def delete_account(account_id: int):
    account = get_user_account_or_404(account_id)

    has_transactions = Transaction.query.filter_by(account_id=account.account_id).first() is not None
    if has_transactions:
        return auth_error("This account cannot be deleted because it already has transactions.", 409)

    db.session.delete(account)
    db.session.commit()
    return jsonify({"message": "Account deleted"})


@account_bp.get("/dashboard")
@login_required
def dashboard():
    user = g.current_user
    accounts = (
        Account.query.filter_by(user_id=user.user_id)
        .order_by(Account.created_at.asc())
        .all()
    )

    total_balance = round(sum(float(account.initial_balance) for account in accounts), 2)
    return jsonify(
        {
            "user": user.to_dict(),
            "accounts": [account.to_dict() for account in accounts],
            "summary": {
                "total_balance": total_balance,
                "account_count": len(accounts),
            },
            "setup_status": {
                "profile_complete": True,
                "regional_complete": bool(user.country and user.currency),
                "has_accounts": bool(accounts),
            },
        }
    )


def get_user_account_or_404(account_id: int) -> Account:
    account = Account.query.filter_by(
        account_id=account_id,
        user_id=g.current_user.user_id,
    ).first()
    if not account:
        raise NotFoundError()
    return account


def validate_account_input(name: str, account_type: str, initial_balance: Decimal) -> str | None:
    if not name:
        return "Account name is required."
    if account_type not in ALLOWED_ACCOUNT_TYPES:
        return "Account type must be Cash, Bank, or Wallet."

    if initial_balance < 0:
        return "Initial balance cannot be negative."
    return None


def parse_initial_balance(value) -> tuple[Decimal | None, str | None]:
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        return None, "Initial balance must be a valid number."

    return amount, None


def account_name_exists(user_id: int, name: str, exclude_id: int | None = None) -> bool:
    query = Account.query.filter_by(user_id=user_id, name=name)
    if exclude_id is not None:
        query = query.filter(Account.account_id != exclude_id)
    return query.first() is not None


class NotFoundError(Exception):
    pass


@account_bp.errorhandler(NotFoundError)
def handle_not_found(_error):
    return auth_error("Account not found.", 404)
