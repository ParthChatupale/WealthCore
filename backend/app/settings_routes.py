import re

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.auth import auth_error, create_access_token, login_required, set_auth_cookie
from app.extensions import db
from app.models import User


settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


@settings_bp.get("")
@login_required
def get_settings():
    return jsonify({"user": g.current_user.to_dict()})


@settings_bp.patch("/profile")
@login_required
def update_profile():
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    country = (payload.get("country") or "").strip()
    currency = (payload.get("currency") or "").strip()

    error = validate_profile_input(name, email, country, currency)
    if error:
        return auth_error(error, 400)

    existing_user = User.query.filter_by(email=email).first()
    if existing_user and existing_user.user_id != g.current_user.user_id:
        return auth_error("An account with this email already exists.", 409)

    g.current_user.name = name
    g.current_user.email = email
    g.current_user.country = country
    g.current_user.currency = currency
    db.session.commit()

    response = jsonify({"user": g.current_user.to_dict()})
    set_auth_cookie(response, create_access_token(g.current_user))
    return response


@settings_bp.patch("/password")
@login_required
def update_password():
    payload = request.get_json(silent=True) or {}

    current_password = payload.get("current_password") or ""
    new_password = payload.get("new_password") or ""

    if not current_password:
        return auth_error("Current password is required.", 400)
    if not new_password:
        return auth_error("New password is required.", 400)
    if len(new_password) < MIN_PASSWORD_LENGTH:
        return auth_error("Password must be at least 8 characters long.", 400)
    if not check_password_hash(g.current_user.password_hash, current_password):
        return auth_error("Current password is incorrect.", 400)
    if check_password_hash(g.current_user.password_hash, new_password):
        return auth_error("New password must be different from your current password.", 400)

    g.current_user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    response = jsonify({"message": "Password updated successfully."})
    set_auth_cookie(response, create_access_token(g.current_user))
    return response


def validate_profile_input(name: str, email: str, country: str, currency: str) -> str | None:
    if not name:
        return "Name is required."
    if not email:
        return "Email is required."
    if not EMAIL_PATTERN.match(email):
        return "Please enter a valid email address."
    if not country:
        return "Country is required."
    if not currency:
        return "Currency is required."
    return None
