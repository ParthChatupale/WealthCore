from __future__ import annotations

import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

from werkzeug.security import generate_password_hash

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app
from app.extensions import db
from app.models import Account, Budget, Category, RecurringTransaction, Transaction, User
from app.recurring_service import advance_run_date
from app.taxonomy_defaults import ensure_default_taxonomy


DEMO_EMAIL = "demo@financemanager.local"
DEMO_PASSWORD = "DemoPass123!"


def first_of_month(year: int, month: int) -> date:
    return date(year, month, 1)


def month_key_for(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def main() -> None:
    app = create_app()

    with app.app_context():
        user = User.query.filter_by(email=DEMO_EMAIL).first()
        if user is None:
            user = User(
                name="Demo User",
                email=DEMO_EMAIL,
                password_hash=generate_password_hash(DEMO_PASSWORD),
                country="India",
                currency="INR (₹)",
            )
            db.session.add(user)
            db.session.flush()
        else:
            Transaction.query.filter_by(user_id=user.user_id).delete()
            Budget.query.filter_by(user_id=user.user_id).delete()
            RecurringTransaction.query.filter_by(user_id=user.user_id).delete()
            Account.query.filter_by(user_id=user.user_id).delete()
            user.name = "Demo User"
            user.password_hash = generate_password_hash(DEMO_PASSWORD)
            user.country = "India"
            user.currency = "INR (₹)"

        ensure_default_taxonomy(user.user_id)
        db.session.flush()

        accounts = [
            Account(user_id=user.user_id, name="HDFC Savings", type="Bank", initial_balance=Decimal("85000.00")),
            Account(user_id=user.user_id, name="Cash Wallet", type="Cash", initial_balance=Decimal("5000.00")),
            Account(user_id=user.user_id, name="UPI Wallet", type="Wallet", initial_balance=Decimal("2500.00")),
        ]
        db.session.add_all(accounts)
        db.session.flush()

        categories = {
            (category.type, category.name): category
            for category in Category.query.filter_by(user_id=user.user_id).all()
        }

        def category(category_type: str, name: str) -> Category:
            return categories[(category_type, name)]

        def subcategory(category_type: str, category_name: str, subcategory_name: str):
            parent = category(category_type, category_name)
            return next(item for item in parent.subcategories if item.name == subcategory_name)

        transactions = [
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("income", "Salary").category_id,
                subcategory_id=subcategory("income", "Salary", "Primary Salary").subcategory_id,
                amount=Decimal("72000.00"),
                type="income",
                date=date(2026, 1, 1),
                description="January salary",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("expense", "Bills").category_id,
                subcategory_id=subcategory("expense", "Bills", "Rent").subcategory_id,
                amount=Decimal("18000.00"),
                type="expense",
                date=date(2026, 1, 3),
                description="Apartment rent",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[2].account_id,
                category_id=category("expense", "Food").category_id,
                subcategory_id=subcategory("expense", "Food", "Dining Out").subcategory_id,
                amount=Decimal("2200.00"),
                type="expense",
                date=date(2026, 1, 7),
                description="Team dinner",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("income", "Salary").category_id,
                subcategory_id=subcategory("income", "Salary", "Primary Salary").subcategory_id,
                amount=Decimal("72000.00"),
                type="income",
                date=date(2026, 2, 1),
                description="February salary",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[2].account_id,
                category_id=category("expense", "Travel").category_id,
                subcategory_id=subcategory("expense", "Travel", "Cab").subcategory_id,
                amount=Decimal("1450.00"),
                type="expense",
                date=date(2026, 2, 9),
                description="Airport cabs",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[1].account_id,
                category_id=category("expense", "Shopping").category_id,
                subcategory_id=subcategory("expense", "Shopping", "Clothing").subcategory_id,
                amount=Decimal("3800.00"),
                type="expense",
                date=date(2026, 2, 14),
                description="Festival shopping",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("income", "Freelance").category_id,
                subcategory_id=subcategory("income", "Freelance", "Consulting").subcategory_id,
                amount=Decimal("12000.00"),
                type="income",
                date=date(2026, 3, 12),
                description="Freelance consulting payment",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("expense", "Health").category_id,
                subcategory_id=subcategory("expense", "Health", "Fitness").subcategory_id,
                amount=Decimal("2500.00"),
                type="expense",
                date=date(2026, 3, 18),
                description="Quarterly gym package",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("income", "Salary").category_id,
                subcategory_id=subcategory("income", "Salary", "Primary Salary").subcategory_id,
                amount=Decimal("75000.00"),
                type="income",
                date=date(2026, 4, 1),
                description="April salary",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("expense", "Bills").category_id,
                subcategory_id=subcategory("expense", "Bills", "Rent").subcategory_id,
                amount=Decimal("18000.00"),
                type="expense",
                date=date(2026, 4, 2),
                description="Apartment rent",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[2].account_id,
                category_id=category("expense", "Food").category_id,
                subcategory_id=subcategory("expense", "Food", "Groceries").subcategory_id,
                amount=Decimal("5200.00"),
                type="expense",
                date=date(2026, 4, 6),
                description="Monthly groceries",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[2].account_id,
                category_id=category("expense", "Entertainment").category_id,
                subcategory_id=subcategory("expense", "Entertainment", "Streaming").subcategory_id,
                amount=Decimal("799.00"),
                type="expense",
                date=date(2026, 4, 10),
                description="Streaming subscription",
            ),
            Transaction(
                user_id=user.user_id,
                account_id=accounts[0].account_id,
                category_id=category("income", "Investment").category_id,
                subcategory_id=subcategory("income", "Investment", "Interest").subcategory_id,
                amount=Decimal("1800.00"),
                type="income",
                date=date(2026, 4, 15),
                description="Savings interest",
            ),
        ]
        db.session.add_all(transactions)

        budgets = [
            Budget(user_id=user.user_id, category_id=category("expense", "Food").category_id, month=month_key_for(2026, 4), limit_amount=Decimal("6000.00")),
            Budget(user_id=user.user_id, category_id=category("expense", "Bills").category_id, month=month_key_for(2026, 4), limit_amount=Decimal("22000.00")),
            Budget(user_id=user.user_id, category_id=category("expense", "Travel").category_id, month=month_key_for(2026, 4), limit_amount=Decimal("3000.00")),
            Budget(user_id=user.user_id, category_id=category("expense", "Entertainment").category_id, month=month_key_for(2026, 4), limit_amount=Decimal("1500.00")),
        ]
        db.session.add_all(budgets)

        recurring_rule = RecurringTransaction(
            user_id=user.user_id,
            account_id=accounts[0].account_id,
            category_id=category("expense", "Bills").category_id,
            subcategory_id=subcategory("expense", "Bills", "Internet").subcategory_id,
            amount=Decimal("999.00"),
            type="expense",
            description="Home internet bill",
            frequency="monthly",
            next_run_date=advance_run_date(first_of_month(2026, 4), 1),
        )
        db.session.add(recurring_rule)

        db.session.commit()

        print(f"Seeded demo data for {DEMO_EMAIL}")
        print(f"Password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
