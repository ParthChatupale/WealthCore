import re

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.auth import (
    auth_error,
    clear_auth_cookie,
    create_access_token,
    get_authenticated_user,
    login_required,
    set_auth_cookie,
)
from app.extensions import db
from app.models import Category, User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DEFAULT_CATEGORIES = {
    "expense": [
        "Food",
        "Travel",
        "Bills",
        "Shopping",
        "Entertainment",
        "Health",
        "Other",
    ],
    "income": [
        "Salary",
        "Freelance",
        "Investment",
        "Other",
    ],
}


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    country = (payload.get("country") or "").strip()
    currency = (payload.get("currency") or "").strip()

    validation_error = validate_registration_input(name, email, password, country, currency)
    if validation_error:
        return auth_error(validation_error, 400)

    if User.query.filter_by(email=email).first():
        return auth_error("An account with this email already exists.", 409)

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        country=country,
        currency=currency,
    )
    db.session.add(user)
    db.session.flush()
    seed_default_categories(user.user_id)
    db.session.commit()

    response = jsonify({"user": user.to_dict()})
    response.status_code = 201
    set_auth_cookie(response, create_access_token(user))
    return response


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return auth_error("Email and password are required.", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return auth_error("Invalid email or password.", 401)

    response = jsonify({"user": user.to_dict()})
    set_auth_cookie(response, create_access_token(user))
    return response


@auth_bp.post("/logout")
def logout():
    response = jsonify({"message": "Logged out"})
    clear_auth_cookie(response)
    return response


@auth_bp.get("/me")
@login_required
def me():
    user = get_authenticated_user()
    return jsonify({"user": user.to_dict()})


def validate_registration_input(
    name: str,
    email: str,
    password: str,
    country: str,
    currency: str,
) -> str | None:
    if not name:
        return "Name is required."
    if not email:
        return "Email is required."
    if not EMAIL_PATTERN.match(email):
        return "Please enter a valid email address."
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not country:
        return "Country is required."
    if not currency:
        return "Currency is required."
    return None


def seed_default_categories(user_id: int) -> None:
    for category_type, names in DEFAULT_CATEGORIES.items():
        for name in names:
            db.session.add(
                Category(
                    user_id=user_id,
                    name=name,
                    type=category_type,
                    is_default=True,
                )
            )
