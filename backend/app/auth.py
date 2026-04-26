from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from app.models import User


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.user_id),
        "email": user.email,
        "iat": now,
        "exp": now + timedelta(days=current_app.config["JWT_EXPIRATION_DAYS"]),
    }
    return jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm=current_app.config["JWT_ALGORITHM"],
    )


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=[current_app.config["JWT_ALGORITHM"]],
        )
    except jwt.PyJWTError:
        return None


def get_token_from_request() -> str | None:
    return request.cookies.get(current_app.config["AUTH_COOKIE_NAME"])


def get_authenticated_user() -> User | None:
    token = get_token_from_request()
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    user = User.query.get(int(user_id))
    if not user:
        return None

    g.current_user = user
    return user


def set_auth_cookie(response, token: str) -> None:
    response.set_cookie(
        current_app.config["AUTH_COOKIE_NAME"],
        token,
        httponly=current_app.config["AUTH_COOKIE_HTTPONLY"],
        samesite=current_app.config["AUTH_COOKIE_SAMESITE"],
        secure=current_app.config["AUTH_COOKIE_SECURE"],
        max_age=current_app.config["JWT_EXPIRATION_DAYS"] * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookie(response) -> None:
    response.set_cookie(
        current_app.config["AUTH_COOKIE_NAME"],
        "",
        expires=0,
        max_age=0,
        httponly=current_app.config["AUTH_COOKIE_HTTPONLY"],
        samesite=current_app.config["AUTH_COOKIE_SAMESITE"],
        secure=current_app.config["AUTH_COOKIE_SECURE"],
        path="/",
    )


def auth_error(message: str, status_code: int):
    response = jsonify({"error": message})
    response.status_code = status_code
    return response


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = get_authenticated_user()
        if not user:
            return auth_error("Unauthorized", 401)
        return view(*args, **kwargs)

    return wrapped
