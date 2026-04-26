from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from flask import Blueprint, g, jsonify, request

from app.auth import auth_error, login_required
from app.extensions import db
from app.models import Account, Category, Subcategory, Transaction


transaction_bp = Blueprint("transactions", __name__, url_prefix="/api")
ALLOWED_TRANSACTION_TYPES = {"income", "expense"}


@transaction_bp.get("/categories")
@login_required
def list_categories():
    category_type = (request.args.get("type") or "").strip().lower()
    query = Category.query.filter_by(user_id=g.current_user.user_id).order_by(
        Category.type.asc(),
        Category.name.asc(),
    )

    if category_type:
        if category_type not in ALLOWED_TRANSACTION_TYPES:
            return auth_error("Category type must be income or expense.", 400)
        query = query.filter(Category.type == category_type)

    categories = query.all()
    return jsonify({"categories": [category.to_dict() for category in categories]})


@transaction_bp.get("/transactions")
@login_required
def list_transactions():
    query = (
        Transaction.query.filter_by(user_id=g.current_user.user_id)
        .join(Account)
        .join(Category)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
    )

    filters, error = parse_transaction_filters()
    if error:
        return auth_error(error, 400)

    if filters["type"]:
        query = query.filter(Transaction.type == filters["type"])
    if filters["account_id"] is not None:
        query = query.filter(Transaction.account_id == filters["account_id"])
    if filters["category_id"] is not None:
        query = query.filter(Transaction.category_id == filters["category_id"])
    if filters["date_from"] is not None:
        query = query.filter(Transaction.date >= filters["date_from"])
    if filters["date_to"] is not None:
        query = query.filter(Transaction.date <= filters["date_to"])

    transactions = query.all()
    return jsonify({"transactions": [transaction.to_dict() for transaction in transactions]})


@transaction_bp.post("/transactions")
@login_required
def create_transaction():
    payload, error = build_validated_transaction_payload(request.get_json(silent=True) or {})
    if error:
        return auth_error(error, 400)

    transaction = Transaction(
        user_id=g.current_user.user_id,
        account_id=payload["account"].account_id,
        category_id=payload["category"].category_id,
        subcategory_id=payload["subcategory"].subcategory_id if payload["subcategory"] else None,
        amount=payload["amount"],
        type=payload["type"],
        date=payload["date"],
        description=payload["description"],
    )
    db.session.add(transaction)
    db.session.commit()

    return jsonify({"transaction": transaction.to_dict()}), 201


@transaction_bp.patch("/transactions/<int:transaction_id>")
@login_required
def update_transaction(transaction_id: int):
    transaction = get_user_transaction_or_404(transaction_id)
    payload, error = build_validated_transaction_payload(request.get_json(silent=True) or {})
    if error:
        return auth_error(error, 400)

    transaction.account_id = payload["account"].account_id
    transaction.category_id = payload["category"].category_id
    transaction.subcategory_id = payload["subcategory"].subcategory_id if payload["subcategory"] else None
    transaction.amount = payload["amount"]
    transaction.type = payload["type"]
    transaction.date = payload["date"]
    transaction.description = payload["description"]
    db.session.commit()

    return jsonify({"transaction": transaction.to_dict()})


@transaction_bp.delete("/transactions/<int:transaction_id>")
@login_required
def delete_transaction(transaction_id: int):
    transaction = get_user_transaction_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transaction deleted"})


def parse_transaction_filters():
    transaction_type = (request.args.get("type") or "").strip().lower()
    if transaction_type and transaction_type not in ALLOWED_TRANSACTION_TYPES:
        return None, "Transaction type must be income or expense."

    account_id, error = parse_optional_int(request.args.get("account_id"), "Account filter is invalid.")
    if error:
        return None, error

    category_id, error = parse_optional_int(request.args.get("category_id"), "Category filter is invalid.")
    if error:
        return None, error

    date_from, error = parse_optional_date(request.args.get("date_from"), "date_from is invalid.")
    if error:
        return None, error

    date_to, error = parse_optional_date(request.args.get("date_to"), "date_to is invalid.")
    if error:
        return None, error

    if date_from and date_to and date_from > date_to:
        return None, "date_from cannot be later than date_to."

    return {
        "type": transaction_type or None,
        "account_id": account_id,
        "category_id": category_id,
        "date_from": date_from,
        "date_to": date_to,
    }, None


def build_validated_transaction_payload(payload):
    transaction_type = (payload.get("type") or "").strip().lower()
    if transaction_type not in ALLOWED_TRANSACTION_TYPES:
        return None, "Transaction type must be income or expense."

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

    transaction_date, error = parse_required_date(payload.get("date"))
    if error:
        return None, error

    description = (payload.get("description") or "").strip() or None

    account = Account.query.filter_by(
        account_id=account_id,
        user_id=g.current_user.user_id,
    ).first()
    if not account:
        return None, "Selected account was not found."

    category = Category.query.filter_by(
        category_id=category_id,
        user_id=g.current_user.user_id,
    ).first()
    if not category:
        return None, "Selected category was not found."
    if category.type != transaction_type:
        return None, "Category type must match the transaction type."

    subcategory = None
    if subcategory_id is not None:
        subcategory = Subcategory.query.filter_by(subcategory_id=subcategory_id).first()
        if not subcategory or subcategory.category_id != category.category_id:
            return None, "Selected subcategory does not belong to the selected category."

    return {
        "type": transaction_type,
        "account": account,
        "category": category,
        "subcategory": subcategory,
        "amount": amount,
        "date": transaction_date,
        "description": description,
    }, None


def get_user_transaction_or_404(transaction_id: int) -> Transaction:
    transaction = Transaction.query.filter_by(
        transaction_id=transaction_id,
        user_id=g.current_user.user_id,
    ).first()
    if not transaction:
        raise NotFoundError()
    return transaction


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
        return None, "Date is required."
    return parse_optional_date(value, "Date is invalid.")


def parse_optional_date(value, error_message: str):
    if not value:
        return None, None
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date(), None
    except ValueError:
        return None, error_message


class NotFoundError(Exception):
    pass


@transaction_bp.errorhandler(NotFoundError)
def handle_not_found(_error):
    return auth_error("Transaction not found.", 404)
