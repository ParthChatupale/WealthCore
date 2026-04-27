"""add category icons and taxonomy support

Revision ID: 6f2b76a9f4c1
Revises: f01f70889d55
Create Date: 2026-04-27 02:12:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6f2b76a9f4c1"
down_revision = "f01f70889d55"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("categories", sa.Column("icon_name", sa.String(length=80), nullable=True))

    updates = [
        ("expense", "Food", "UtensilsCrossed"),
        ("expense", "Travel", "Plane"),
        ("expense", "Bills", "ReceiptText"),
        ("expense", "Shopping", "ShoppingBag"),
        ("expense", "Entertainment", "Popcorn"),
        ("expense", "Health", "HeartPulse"),
        ("expense", "Other", "CircleHelp"),
        ("income", "Salary", "BriefcaseBusiness"),
        ("income", "Freelance", "Laptop"),
        ("income", "Investment", "Landmark"),
        ("income", "Other", "CircleHelp"),
    ]

    for category_type, name, icon_name in updates:
        op.execute(
            sa.text(
                """
                UPDATE categories
                SET icon_name = :icon_name
                WHERE type = :category_type AND name = :name
                """
            ).bindparams(
                icon_name=icon_name,
                category_type=category_type,
                name=name,
            )
        )


def downgrade():
    op.drop_column("categories", "icon_name")
