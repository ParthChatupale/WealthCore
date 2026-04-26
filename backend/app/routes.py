from flask import Blueprint, jsonify


main_bp = Blueprint("main", __name__)


@main_bp.get("/")
def index():
    return jsonify(
        {
            "app": "Finance Manager API",
            "status": "running",
        }
    )


@main_bp.get("/api/health")
def health():
    return jsonify({"status": "ok"})
