"""add reporting views

Revision ID: 8c9d4b7e1a2f
Revises: 4f5a0b6b6cbf
Create Date: 2026-04-27 08:10:00
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "8c9d4b7e1a2f"
down_revision = "4f5a0b6b6cbf"
branch_labels = None
depends_on = None


MONTHLY_TOTALS_VIEW_SQL = """
CREATE VIEW report_monthly_totals_v AS
SELECT
    t.user_id,
    to_char(t.date, 'YYYY-MM') AS month,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric(12, 2) AS income_total,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric(12, 2) AS expense_total,
    (
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
    )::numeric(12, 2) AS savings_total
FROM transactions t
GROUP BY
    t.user_id,
    to_char(t.date, 'YYYY-MM');
"""


CATEGORY_EXPENSE_VIEW_SQL = """
CREATE VIEW report_category_expense_v AS
SELECT
    t.user_id,
    to_char(t.date, 'YYYY-MM') AS month,
    c.category_id,
    c.name AS category_name,
    c.icon_name,
    COALESCE(SUM(t.amount), 0)::numeric(12, 2) AS spent_amount
FROM transactions t
JOIN categories c ON c.category_id = t.category_id
WHERE t.type = 'expense'
GROUP BY
    t.user_id,
    to_char(t.date, 'YYYY-MM'),
    c.category_id,
    c.name,
    c.icon_name;
"""


BUDGET_ACTUAL_VIEW_SQL = """
CREATE VIEW report_budget_actual_v AS
WITH expense_totals AS (
    SELECT
        t.user_id,
        to_char(t.date, 'YYYY-MM') AS month,
        t.category_id,
        COALESCE(SUM(t.amount), 0)::numeric(12, 2) AS spent_amount
    FROM transactions t
    WHERE t.type = 'expense'
    GROUP BY
        t.user_id,
        to_char(t.date, 'YYYY-MM'),
        t.category_id
)
SELECT
    b.user_id,
    b.month,
    b.budget_id,
    b.category_id,
    c.name AS category_name,
    c.icon_name,
    b.limit_amount,
    COALESCE(e.spent_amount, 0)::numeric(12, 2) AS spent_amount,
    (b.limit_amount - COALESCE(e.spent_amount, 0))::numeric(12, 2) AS remaining_amount,
    CASE
        WHEN b.limit_amount - COALESCE(e.spent_amount, 0) < 0
            THEN ABS(b.limit_amount - COALESCE(e.spent_amount, 0))::numeric(12, 2)
        ELSE 0::numeric(12, 2)
    END AS over_budget_amount
FROM budgets b
JOIN categories c
    ON c.category_id = b.category_id
LEFT JOIN expense_totals e
    ON e.user_id = b.user_id
    AND e.month = b.month
    AND e.category_id = b.category_id
WHERE c.type = 'expense';
"""


def upgrade():
    op.execute(MONTHLY_TOTALS_VIEW_SQL)
    op.execute(CATEGORY_EXPENSE_VIEW_SQL)
    op.execute(BUDGET_ACTUAL_VIEW_SQL)


def downgrade():
    op.execute("DROP VIEW IF EXISTS report_budget_actual_v")
    op.execute("DROP VIEW IF EXISTS report_category_expense_v")
    op.execute("DROP VIEW IF EXISTS report_monthly_totals_v")
