"""Tables tasks et weekly_rewards

Revision ID: 0001
Revises:
Create Date: 2026-10-27
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

task_type = sa.Enum("urgent", "mandatory", "optional", "fixed", name="task_type")


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("start_time", sa.Time),
        sa.Column("end_time", sa.Time),
        sa.Column("task_type", task_type, nullable=False),
        sa.Column("weight", sa.Integer, nullable=False, server_default="1"),
        sa.Column("is_done", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("weight >= 1", name="ck_tasks_weight_positive"),
    )
    op.create_index("ix_tasks_date", "tasks", ["date"])

    op.create_table(
        "weekly_rewards",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("week_number", sa.Integer, nullable=False),
        sa.Column("reward_title", sa.String(255), nullable=False),
        sa.Column("is_claimed", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.UniqueConstraint("year", "week_number"),
        sa.CheckConstraint("week_number BETWEEN 1 AND 53", name="ck_weekly_rewards_week"),
    )


def downgrade() -> None:
    op.drop_table("weekly_rewards")
    op.drop_index("ix_tasks_date", table_name="tasks")
    op.drop_table("tasks")
    task_type.drop(op.get_bind(), checkfirst=True)
