from __future__ import annotations

from app.category_icons import default_icon_for_category
from app.extensions import db
from app.models import Category, Subcategory


DEFAULT_TAXONOMY = {
    "expense": {
        "Food": ["Groceries", "Dining Out", "Snacks", "Coffee"],
        "Travel": ["Fuel", "Cab", "Bus", "Train", "Flights"],
        "Bills": ["Rent", "Electricity", "Water", "Internet", "Mobile"],
        "Shopping": ["Clothing", "Electronics", "Home", "Gifts"],
        "Entertainment": ["Movies", "Streaming", "Games", "Events"],
        "Health": ["Medicine", "Doctor", "Fitness", "Insurance"],
        "Other": ["Miscellaneous", "Emergency", "Fees"],
    },
    "income": {
        "Salary": ["Primary Salary", "Bonus", "Overtime"],
        "Freelance": ["Client Work", "Project Payment", "Consulting"],
        "Investment": ["Interest", "Dividends", "Capital Gains"],
        "Other": ["Refund", "Gift", "Cashback"],
    },
}


def ensure_default_taxonomy(user_id: int) -> bool:
    changed = False

    existing_categories = {
        (category.type, category.name): category
        for category in Category.query.filter_by(user_id=user_id).all()
    }

    for category_type, category_map in DEFAULT_TAXONOMY.items():
        for category_name, subcategory_names in category_map.items():
            category = existing_categories.get((category_type, category_name))
            if category is None:
                category = Category(
                    user_id=user_id,
                    name=category_name,
                    type=category_type,
                    is_default=True,
                    icon_name=default_icon_for_category(category_type, category_name),
                )
                db.session.add(category)
                db.session.flush()
                existing_categories[(category_type, category_name)] = category
                changed = True
            elif not category.icon_name:
                category.icon_name = default_icon_for_category(category_type, category_name)
                changed = True

            existing_subcategories = {
                subcategory.name
                for subcategory in Subcategory.query.filter_by(category_id=category.category_id).all()
            }
            for subcategory_name in subcategory_names:
                if subcategory_name in existing_subcategories:
                    continue
                db.session.add(
                    Subcategory(
                        category_id=category.category_id,
                        name=subcategory_name,
                    )
                )
                changed = True

    return changed
