"""phase3 account initial balance

Revision ID: f01f70889d55
Revises: a706a92e1343
Create Date: 2026-04-26 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f01f70889d55"
down_revision = "a706a92e1343"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("accounts", schema=None) as batch_op:
        batch_op.alter_column(
            "balance",
            new_column_name="initial_balance",
            existing_type=sa.Numeric(precision=12, scale=2),
            existing_nullable=False,
        )
        batch_op.drop_constraint("ck_accounts_balance_non_negative", type_="check")
        batch_op.create_check_constraint(
            "ck_accounts_initial_balance_non_negative",
            "initial_balance >= 0",
        )
        batch_op.create_check_constraint(
            "ck_accounts_type_allowed",
            "type IN ('Cash', 'Bank', 'Wallet')",
        )


def downgrade():
    with op.batch_alter_table("accounts", schema=None) as batch_op:
        batch_op.drop_constraint("ck_accounts_type_allowed", type_="check")
        batch_op.drop_constraint("ck_accounts_initial_balance_non_negative", type_="check")
        batch_op.alter_column(
            "initial_balance",
            new_column_name="balance",
            existing_type=sa.Numeric(precision=12, scale=2),
            existing_nullable=False,
        )
        batch_op.create_check_constraint(
            "ck_accounts_balance_non_negative",
            "balance >= 0",
        )
