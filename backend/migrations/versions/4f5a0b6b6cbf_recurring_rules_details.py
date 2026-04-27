"""recurring rules details

Revision ID: 4f5a0b6b6cbf
Revises: 6f2b76a9f4c1
Create Date: 2026-04-27 03:10:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "4f5a0b6b6cbf"
down_revision = "6f2b76a9f4c1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("recurring_transactions", sa.Column("subcategory_id", sa.Integer(), nullable=True))
    op.add_column("recurring_transactions", sa.Column("description", sa.String(length=255), nullable=True))
    op.add_column(
        "recurring_transactions",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index(
        op.f("ix_recurring_transactions_subcategory_id"),
        "recurring_transactions",
        ["subcategory_id"],
        unique=False,
    )
    op.create_foreign_key(
        None,
        "recurring_transactions",
        "subcategories",
        ["subcategory_id"],
        ["subcategory_id"],
    )


def downgrade():
    op.drop_constraint(None, "recurring_transactions", type_="foreignkey")
    op.drop_index(op.f("ix_recurring_transactions_subcategory_id"), table_name="recurring_transactions")
    op.drop_column("recurring_transactions", "created_at")
    op.drop_column("recurring_transactions", "description")
    op.drop_column("recurring_transactions", "subcategory_id")
