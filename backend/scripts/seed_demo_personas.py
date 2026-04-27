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
from app.taxonomy_defaults import ensure_default_taxonomy


COMMON_PASSWORD = "PersonaDemo123!"

PERSONAS = [
    {
        "name": "Rahul Sharma",
        "email": "rahul.hosteller@financemanager.local",
        "country": "India",
        "currency": "INR (₹)",
        "accounts": [
            ("SBI Savings", "Bank", Decimal("12000.00")),
            ("UPI Wallet", "Wallet", Decimal("1500.00")),
            ("Cash Wallet", "Cash", Decimal("800.00")),
        ],
        "transactions": [
            ("income", "Other", "Gift", "SBI Savings", Decimal("8000.00"), date(2026, 3, 3), "Monthly allowance from parents"),
            ("income", "Freelance", "Client Work", "SBI Savings", Decimal("2500.00"), date(2026, 3, 18), "Tutoring junior students"),
            ("expense", "Other", "Fees", "SBI Savings", Decimal("4500.00"), date(2026, 3, 5), "Hostel semester maintenance"),
            ("expense", "Food", "Groceries", "UPI Wallet", Decimal("1800.00"), date(2026, 3, 7), "Monthly mess top-up and snacks"),
            ("expense", "Travel", "Bus", "UPI Wallet", Decimal("650.00"), date(2026, 3, 10), "College and coaching bus travel"),
            ("expense", "Bills", "Mobile", "UPI Wallet", Decimal("299.00"), date(2026, 3, 12), "Mobile recharge"),
            ("expense", "Shopping", "Clothing", "Cash Wallet", Decimal("950.00"), date(2026, 3, 20), "Summer clothes"),
            ("expense", "Entertainment", "Movies", "UPI Wallet", Decimal("350.00"), date(2026, 3, 25), "Weekend movie with friends"),
            ("income", "Other", "Gift", "SBI Savings", Decimal("8000.00"), date(2026, 4, 3), "Monthly allowance from parents"),
            ("income", "Freelance", "Client Work", "SBI Savings", Decimal("3000.00"), date(2026, 4, 16), "Exam prep tutoring"),
            ("expense", "Food", "Dining Out", "UPI Wallet", Decimal("950.00"), date(2026, 4, 6), "Canteen and outside meals"),
            ("expense", "Food", "Groceries", "UPI Wallet", Decimal("1650.00"), date(2026, 4, 8), "Snacks and essentials"),
            ("expense", "Travel", "Train", "SBI Savings", Decimal("1200.00"), date(2026, 4, 12), "Home visit train ticket"),
            ("expense", "Bills", "Mobile", "UPI Wallet", Decimal("299.00"), date(2026, 4, 14), "Mobile recharge"),
            ("expense", "Health", "Medicine", "Cash Wallet", Decimal("420.00"), date(2026, 4, 19), "Seasonal medicines"),
            ("expense", "Other", "Fees", "SBI Savings", Decimal("1100.00"), date(2026, 4, 23), "Lab record and exam form"),
        ],
        "budgets": [
            ("Food", Decimal("3500.00")),
            ("Travel", Decimal("1500.00")),
            ("Bills", Decimal("1200.00")),
            ("Other", Decimal("1500.00")),
        ],
        "recurring": ("expense", "Bills", "Mobile", "UPI Wallet", Decimal("299.00"), "monthly", date(2026, 5, 14), "Monthly mobile recharge"),
    },
    {
        "name": "Arjun Mehta",
        "email": "arjun.corporate@financemanager.local",
        "country": "India",
        "currency": "INR (₹)",
        "accounts": [
            ("HDFC Salary Account", "Bank", Decimal("68000.00")),
            ("Daily UPI Wallet", "Wallet", Decimal("3500.00")),
            ("Emergency Cash", "Cash", Decimal("2500.00")),
        ],
        "transactions": [
            ("income", "Salary", "Primary Salary", "HDFC Salary Account", Decimal("78000.00"), date(2026, 3, 1), "March salary credit"),
            ("income", "Investment", "Interest", "HDFC Salary Account", Decimal("1600.00"), date(2026, 3, 28), "Savings account interest"),
            ("expense", "Bills", "Rent", "HDFC Salary Account", Decimal("22000.00"), date(2026, 3, 2), "Apartment rent"),
            ("expense", "Bills", "Internet", "HDFC Salary Account", Decimal("999.00"), date(2026, 3, 4), "Fiber broadband"),
            ("expense", "Bills", "Electricity", "HDFC Salary Account", Decimal("1850.00"), date(2026, 3, 9), "Electricity bill"),
            ("expense", "Food", "Groceries", "Daily UPI Wallet", Decimal("4200.00"), date(2026, 3, 11), "Monthly groceries"),
            ("expense", "Travel", "Cab", "Daily UPI Wallet", Decimal("1450.00"), date(2026, 3, 15), "Late-night office commute"),
            ("expense", "Health", "Fitness", "HDFC Salary Account", Decimal("1800.00"), date(2026, 3, 21), "Gym membership"),
            ("income", "Salary", "Primary Salary", "HDFC Salary Account", Decimal("78000.00"), date(2026, 4, 1), "April salary credit"),
            ("income", "Salary", "Bonus", "HDFC Salary Account", Decimal("5000.00"), date(2026, 4, 18), "Performance bonus"),
            ("expense", "Bills", "Rent", "HDFC Salary Account", Decimal("22000.00"), date(2026, 4, 2), "Apartment rent"),
            ("expense", "Bills", "Internet", "HDFC Salary Account", Decimal("999.00"), date(2026, 4, 4), "Fiber broadband"),
            ("expense", "Bills", "Electricity", "HDFC Salary Account", Decimal("1720.00"), date(2026, 4, 8), "Electricity bill"),
            ("expense", "Food", "Groceries", "Daily UPI Wallet", Decimal("4600.00"), date(2026, 4, 10), "Monthly groceries"),
            ("expense", "Travel", "Bus", "Daily UPI Wallet", Decimal("1200.00"), date(2026, 4, 13), "Office bus pass"),
            ("expense", "Shopping", "Home", "HDFC Salary Account", Decimal("3200.00"), date(2026, 4, 20), "Kitchen appliances"),
            ("expense", "Entertainment", "Streaming", "Daily UPI Wallet", Decimal("699.00"), date(2026, 4, 24), "Streaming subscriptions"),
        ],
        "budgets": [
            ("Bills", Decimal("26000.00")),
            ("Food", Decimal("5500.00")),
            ("Travel", Decimal("2500.00")),
            ("Shopping", Decimal("4000.00")),
        ],
        "recurring": ("expense", "Bills", "Internet", "HDFC Salary Account", Decimal("999.00"), "monthly", date(2026, 5, 4), "Monthly broadband bill"),
    },
]


def month_key_for(day: date) -> str:
    return day.strftime("%Y-%m")


def main() -> None:
    app = create_app()

    with app.app_context():
        for persona in PERSONAS:
            seed_persona(persona)

        db.session.commit()

        print("Seeded relatable demo personas:")
        for persona in PERSONAS:
            print(f"- {persona['name']} ({persona['email']}) / Password: {COMMON_PASSWORD}")


def seed_persona(persona: dict) -> None:
    user = User.query.filter_by(email=persona["email"]).first()
    if user is None:
        user = User(
            name=persona["name"],
            email=persona["email"],
            password_hash=generate_password_hash(COMMON_PASSWORD),
            country=persona["country"],
            currency=persona["currency"],
        )
        db.session.add(user)
        db.session.flush()
    else:
        Transaction.query.filter_by(user_id=user.user_id).delete()
        Budget.query.filter_by(user_id=user.user_id).delete()
        RecurringTransaction.query.filter_by(user_id=user.user_id).delete()
        Account.query.filter_by(user_id=user.user_id).delete()
        user.name = persona["name"]
        user.password_hash = generate_password_hash(COMMON_PASSWORD)
        user.country = persona["country"]
        user.currency = persona["currency"]

    ensure_default_taxonomy(user.user_id)
    db.session.flush()

    categories = {
        (category.type, category.name): category
        for category in Category.query.filter_by(user_id=user.user_id).all()
    }

    accounts = []
    for name, account_type, initial_balance in persona["accounts"]:
        account = Account(
            user_id=user.user_id,
            name=name,
            type=account_type,
            initial_balance=initial_balance,
        )
        db.session.add(account)
        accounts.append(account)

    db.session.flush()

    account_map = {account.name: account for account in accounts}

    def category(category_type: str, name: str) -> Category:
        return categories[(category_type, name)]

    def subcategory(category_type: str, category_name: str, subcategory_name: str):
        parent = category(category_type, category_name)
        for item in parent.subcategories:
            if item.name == subcategory_name:
                return item
        raise ValueError(
            f"Missing subcategory '{subcategory_name}' under {category_type}:{category_name} for persona seed."
        )

    for transaction_type, category_name, subcategory_name, account_name, amount, day, description in persona["transactions"]:
        db.session.add(
            Transaction(
                user_id=user.user_id,
                account_id=account_map[account_name].account_id,
                category_id=category(transaction_type, category_name).category_id,
                subcategory_id=subcategory(transaction_type, category_name, subcategory_name).subcategory_id,
                amount=amount,
                type=transaction_type,
                date=day,
                description=description,
            )
        )

    budget_month = month_key_for(date(2026, 4, 1))
    for category_name, limit_amount in persona["budgets"]:
        db.session.add(
            Budget(
                user_id=user.user_id,
                category_id=category("expense", category_name).category_id,
                month=budget_month,
                limit_amount=limit_amount,
            )
        )

    recurring_type, category_name, subcategory_name, account_name, amount, frequency, next_run_date, description = persona["recurring"]
    db.session.add(
        RecurringTransaction(
            user_id=user.user_id,
            account_id=account_map[account_name].account_id,
            category_id=category(recurring_type, category_name).category_id,
            subcategory_id=subcategory(recurring_type, category_name, subcategory_name).subcategory_id,
            amount=amount,
            type=recurring_type,
            description=description,
            frequency=frequency,
            next_run_date=next_run_date,
        )
    )


if __name__ == "__main__":
    main()
