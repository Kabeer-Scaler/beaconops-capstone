"""Create incidents table.

Revision ID: 0001_create_incidents
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_create_incidents"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), server_default="", nullable=False),
        sa.Column("severity", sa.String(length=10), server_default="SEV3", nullable=False),
        sa.Column("status", sa.String(length=30), server_default="DETECTED", nullable=False),
        sa.Column("service", sa.String(length=120), nullable=False),
        sa.Column("commander", sa.String(length=120), server_default="Unassigned", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_incidents_title", "incidents", ["title"])
    op.create_index("ix_incidents_severity", "incidents", ["severity"])
    op.create_index("ix_incidents_status", "incidents", ["status"])


def downgrade() -> None:
    op.drop_index("ix_incidents_status", table_name="incidents")
    op.drop_index("ix_incidents_severity", table_name="incidents")
    op.drop_index("ix_incidents_title", table_name="incidents")
    op.drop_table("incidents")
