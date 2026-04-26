import hashlib
import os

from dotenv import load_dotenv


load_dotenv()


def _bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/finance_manager",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        hashlib.sha256(SECRET_KEY.encode("utf-8")).hexdigest(),
    )
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_DAYS = int(os.getenv("JWT_EXPIRATION_DAYS", "7"))
    AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "finance_manager_auth")
    AUTH_COOKIE_HTTPONLY = True
    AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "Lax")
    AUTH_COOKIE_SECURE = _bool_env("AUTH_COOKIE_SECURE", False)
    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://127.0.0.1:5173,http://localhost:5173",
        ).split(",")
        if origin.strip()
    ]
