from datetime import datetime, timezone

from app.extensions import db


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(80), nullable=True)
    currency = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    accounts = db.relationship("Account", back_populates="user", cascade="all, delete-orphan")
    categories = db.relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = db.relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = db.relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    recurring_transactions = db.relationship(
        "RecurringTransaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    report_snapshots = db.relationship(
        "ReportSnapshot",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "country": self.country,
            "currency": self.currency,
            "created_at": self.created_at.isoformat(),
        }


class Account(db.Model):
    __tablename__ = "accounts"
    __table_args__ = (
        db.CheckConstraint("initial_balance >= 0", name="ck_accounts_initial_balance_non_negative"),
        db.CheckConstraint("type IN ('Cash', 'Bank', 'Wallet')", name="ck_accounts_type_allowed"),
        db.UniqueConstraint("user_id", "name", name="uq_accounts_user_name"),
    )

    account_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(30), nullable=False)
    initial_balance = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    user = db.relationship("User", back_populates="accounts")
    transactions = db.relationship("Transaction", back_populates="account")
    recurring_transactions = db.relationship("RecurringTransaction", back_populates="account")

    def to_dict(self):
        return {
            "account_id": self.account_id,
            "name": self.name,
            "type": self.type,
            "initial_balance": float(self.initial_balance),
            "created_at": self.created_at.isoformat(),
        }


class Category(db.Model):
    __tablename__ = "categories"
    __table_args__ = (
        db.CheckConstraint("type IN ('income', 'expense')", name="ck_categories_type"),
        db.UniqueConstraint("user_id", "name", "type", name="uq_categories_user_name_type"),
    )

    category_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    is_default = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship("User", back_populates="categories")
    subcategories = db.relationship("Subcategory", back_populates="category", cascade="all, delete-orphan")
    transactions = db.relationship("Transaction", back_populates="category")
    budgets = db.relationship("Budget", back_populates="category")
    recurring_transactions = db.relationship("RecurringTransaction", back_populates="category")


class Subcategory(db.Model):
    __tablename__ = "subcategories"
    __table_args__ = (
        db.UniqueConstraint("category_id", "name", name="uq_subcategories_category_name"),
    )

    subcategory_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)

    category = db.relationship("Category", back_populates="subcategories")
    transactions = db.relationship("Transaction", back_populates="subcategory")


class Transaction(db.Model):
    __tablename__ = "transactions"
    __table_args__ = (
        db.CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        db.CheckConstraint("type IN ('income', 'expense')", name="ck_transactions_type"),
    )

    transaction_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.account_id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id"), nullable=False, index=True)
    subcategory_id = db.Column(db.Integer, db.ForeignKey("subcategories.subcategory_id"), nullable=True)
    recurring_id = db.Column(
        db.Integer,
        db.ForeignKey("recurring_transactions.recurring_id"),
        nullable=True,
    )
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    user = db.relationship("User", back_populates="transactions")
    account = db.relationship("Account", back_populates="transactions")
    category = db.relationship("Category", back_populates="transactions")
    subcategory = db.relationship("Subcategory", back_populates="transactions")
    recurring_transaction = db.relationship("RecurringTransaction", back_populates="transactions")


class Budget(db.Model):
    __tablename__ = "budgets"
    __table_args__ = (
        db.CheckConstraint("limit_amount >= 0", name="ck_budgets_limit_non_negative"),
        db.UniqueConstraint("user_id", "category_id", "month", name="uq_budgets_user_category_month"),
    )

    budget_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id"), nullable=False, index=True)
    month = db.Column(db.String(7), nullable=False)
    limit_amount = db.Column(db.Numeric(12, 2), nullable=False)

    user = db.relationship("User", back_populates="budgets")
    category = db.relationship("Category", back_populates="budgets")


class RecurringTransaction(db.Model):
    __tablename__ = "recurring_transactions"
    __table_args__ = (
        db.CheckConstraint("amount > 0", name="ck_recurring_transactions_amount_positive"),
        db.CheckConstraint("type IN ('income', 'expense')", name="ck_recurring_transactions_type"),
        db.CheckConstraint(
            "frequency IN ('daily', 'weekly', 'monthly', 'yearly')",
            name="ck_recurring_transactions_frequency",
        ),
    )

    recurring_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.account_id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    frequency = db.Column(db.String(20), nullable=False)
    next_run_date = db.Column(db.Date, nullable=False)

    user = db.relationship("User", back_populates="recurring_transactions")
    account = db.relationship("Account", back_populates="recurring_transactions")
    category = db.relationship("Category", back_populates="recurring_transactions")
    transactions = db.relationship("Transaction", back_populates="recurring_transaction")


class ReportSnapshot(db.Model):
    __tablename__ = "report_snapshots"

    report_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    month = db.Column(db.String(7), nullable=False)
    total_income = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    total_expense = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    savings = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    generated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    user = db.relationship("User", back_populates="report_snapshots")
