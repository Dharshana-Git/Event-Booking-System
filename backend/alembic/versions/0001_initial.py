"""Initial migration - create all tables

Revision ID: 0001_initial
Revises: 
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",              sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column("username",        sa.String(),     nullable=False, unique=True),
        sa.Column("email",           sa.String(),     nullable=False, unique=True),
        sa.Column("mobile_number",   sa.String(),     nullable=False),
        sa.Column("hashed_password", sa.String(),     nullable=False),
        sa.Column("role",            sa.String(),     nullable=False, server_default="user"),
        sa.Column("created_at",      sa.DateTime(),   nullable=True),
    )

    # ── events ─────────────────────────────────────────────────────────────────
    # Matches PDF schema exactly, including available_seats >= 0 CHECK constraint
    op.create_table(
        "events",
        sa.Column("id",              sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column("name",            sa.String(),     nullable=False),
        sa.Column("description",     sa.String(),     nullable=True),
        sa.Column("location",        sa.String(),     nullable=False),
        sa.Column("total_seats",     sa.Integer(),    nullable=False),
        sa.Column("available_seats", sa.Integer(),    nullable=False),
        sa.Column("date",            sa.DateTime(),   nullable=False),
        sa.Column("created_at",      sa.DateTime(),   nullable=True),
        sa.CheckConstraint("available_seats >= 0", name="ck_events_available_seats_non_negative"),
    )

    # ── seats ──────────────────────────────────────────────────────────────────
    op.create_table(
        "seats",
        sa.Column("id",          sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id",    sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seat_number", sa.String(),  nullable=False),
        sa.Column("status",      sa.String(),  nullable=False, server_default="AVAILABLE"),
    )

    # ── bookings ───────────────────────────────────────────────────────────────
    # Matches PDF schema: event_id FK with ON DELETE CASCADE, user_name as plain text
    op.create_table(
        "bookings",
        sa.Column("id",           sa.Integer(),  primary_key=True, autoincrement=True),
        sa.Column("event_id",     sa.Integer(),  sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seat_id",      sa.Integer(),  sa.ForeignKey("seats.id",  ondelete="CASCADE"), nullable=False),
        sa.Column("user_id",      sa.Integer(),  sa.ForeignKey("users.id",  ondelete="CASCADE"), nullable=False),
        sa.Column("user_name",    sa.String(),   nullable=False),   # kept for PDF compatibility
        sa.Column("booking_date", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("status",       sa.String(),   nullable=False, server_default="BOOKED"),
    )


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("seats")
    op.drop_table("events")
    op.drop_table("users")
