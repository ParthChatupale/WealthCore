from flask import Blueprint, g, jsonify, request

from app.auth import auth_error, login_required
from app.category_icons import CURATED_CATEGORY_ICONS
from app.extensions import db
from app.models import Budget, Category, RecurringTransaction, Subcategory, Transaction


category_bp = Blueprint("categories", __name__, url_prefix="/api")
ALLOWED_CATEGORY_TYPES = {"income", "expense"}


@category_bp.get("/categories")
@login_required
def list_categories():
    category_type = (request.args.get("type") or "").strip().lower()
    query = Category.query.filter_by(user_id=g.current_user.user_id).order_by(
        Category.type.asc(),
        Category.name.asc(),
    )

    if category_type:
        if category_type not in ALLOWED_CATEGORY_TYPES:
            return auth_error("Category type must be income or expense.", 400)
        query = query.filter(Category.type == category_type)

    categories = query.all()
    return jsonify(
        {
            "categories": [category.to_dict(include_subcategories=True) for category in categories],
            "available_icons": CURATED_CATEGORY_ICONS,
        }
    )


@category_bp.post("/categories")
@login_required
def create_category():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    category_type = (payload.get("type") or "").strip().lower()
    icon_name = normalize_icon_name(payload.get("icon_name"))

    error = validate_category_payload(name, category_type, icon_name)
    if error:
        return auth_error(error, 400)

    if category_name_exists(g.current_user.user_id, name, category_type):
        return auth_error("A category with this name already exists for that type.", 409)

    category = Category(
        user_id=g.current_user.user_id,
        name=name,
        type=category_type,
        is_default=False,
        icon_name=icon_name,
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({"category": category.to_dict(include_subcategories=True)}), 201


@category_bp.patch("/categories/<int:category_id>")
@login_required
def update_category(category_id: int):
    category = get_user_category_or_404(category_id)
    payload = request.get_json(silent=True) or {}

    if "type" in payload and (payload.get("type") or "").strip().lower() != category.type:
        return auth_error("Category type cannot be changed after creation.", 400)

    name = (payload.get("name") or "").strip()
    icon_name = normalize_icon_name(payload.get("icon_name"))
    error = validate_category_payload(name, category.type, icon_name)
    if error:
        return auth_error(error, 400)

    if category_name_exists(g.current_user.user_id, name, category.type, exclude_id=category.category_id):
        return auth_error("A category with this name already exists for that type.", 409)

    category.name = name
    category.icon_name = icon_name
    db.session.commit()
    return jsonify({"category": category.to_dict(include_subcategories=True)})


@category_bp.delete("/categories/<int:category_id>")
@login_required
def delete_category(category_id: int):
    category = get_user_category_or_404(category_id)

    if Subcategory.query.filter_by(category_id=category.category_id).first():
        return auth_error("This category cannot be deleted because it still has subcategories.", 409)
    if Transaction.query.filter_by(category_id=category.category_id).first():
        return auth_error("This category cannot be deleted because it is used by transactions.", 409)
    if Budget.query.filter_by(category_id=category.category_id).first():
        return auth_error("This category cannot be deleted because it is used by budgets.", 409)
    if RecurringTransaction.query.filter_by(category_id=category.category_id).first():
        return auth_error(
            "This category cannot be deleted because it is used by recurring transactions.",
            409,
        )

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"})


@category_bp.post("/categories/<int:category_id>/subcategories")
@login_required
def create_subcategory(category_id: int):
    category = get_user_category_or_404(category_id)
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()

    error = validate_subcategory_name(name)
    if error:
        return auth_error(error, 400)
    if subcategory_name_exists(category.category_id, name):
        return auth_error("A subcategory with this name already exists in this category.", 409)

    subcategory = Subcategory(category_id=category.category_id, name=name)
    db.session.add(subcategory)
    db.session.commit()
    return jsonify({"subcategory": subcategory.to_dict()}), 201


@category_bp.patch("/subcategories/<int:subcategory_id>")
@login_required
def update_subcategory(subcategory_id: int):
    subcategory = get_user_subcategory_or_404(subcategory_id)
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()

    error = validate_subcategory_name(name)
    if error:
        return auth_error(error, 400)
    if subcategory_name_exists(subcategory.category_id, name, exclude_id=subcategory.subcategory_id):
        return auth_error("A subcategory with this name already exists in this category.", 409)

    subcategory.name = name
    db.session.commit()
    return jsonify({"subcategory": subcategory.to_dict()})


@category_bp.delete("/subcategories/<int:subcategory_id>")
@login_required
def delete_subcategory(subcategory_id: int):
    subcategory = get_user_subcategory_or_404(subcategory_id)

    if Transaction.query.filter_by(subcategory_id=subcategory.subcategory_id).first():
        return auth_error("This subcategory cannot be deleted because it is used by transactions.", 409)

    db.session.delete(subcategory)
    db.session.commit()
    return jsonify({"message": "Subcategory deleted"})


def normalize_icon_name(value) -> str:
    icon_name = (value or "").strip()
    return icon_name or "CircleHelp"


def validate_category_payload(name: str, category_type: str, icon_name: str) -> str | None:
    if not name:
        return "Category name is required."
    if category_type not in ALLOWED_CATEGORY_TYPES:
        return "Category type must be income or expense."
    if icon_name not in CURATED_CATEGORY_ICONS:
        return "Selected icon is not allowed."
    return None


def validate_subcategory_name(name: str) -> str | None:
    if not name:
        return "Subcategory name is required."
    return None


def category_name_exists(user_id: int, name: str, category_type: str, exclude_id: int | None = None) -> bool:
    query = Category.query.filter_by(user_id=user_id, name=name, type=category_type)
    if exclude_id is not None:
        query = query.filter(Category.category_id != exclude_id)
    return query.first() is not None


def subcategory_name_exists(category_id: int, name: str, exclude_id: int | None = None) -> bool:
    query = Subcategory.query.filter_by(category_id=category_id, name=name)
    if exclude_id is not None:
        query = query.filter(Subcategory.subcategory_id != exclude_id)
    return query.first() is not None


def get_user_category_or_404(category_id: int) -> Category:
    category = Category.query.filter_by(
        category_id=category_id,
        user_id=g.current_user.user_id,
    ).first()
    if not category:
        raise NotFoundError("Category not found.")
    return category


def get_user_subcategory_or_404(subcategory_id: int) -> Subcategory:
    subcategory = (
        Subcategory.query.join(Category)
        .filter(
            Subcategory.subcategory_id == subcategory_id,
            Category.user_id == g.current_user.user_id,
        )
        .first()
    )
    if not subcategory:
        raise NotFoundError("Subcategory not found.")
    return subcategory


class NotFoundError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


@category_bp.errorhandler(NotFoundError)
def handle_not_found(error: NotFoundError):
    return auth_error(error.message, 404)
