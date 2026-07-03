"""initial sqlalchemy store

Revision ID: 20260703_0001
Revises:
Create Date: 2026-07-03
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "json_records",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("record_type", sa.String(length=60), nullable=False),
        sa.Column("stock_code", sa.String(length=20), nullable=True),
        sa.Column("task_id", sa.String(length=80), nullable=True),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_json_records_record_type", "json_records", ["record_type"])
    op.create_index("ix_json_records_stock_code", "json_records", ["stock_code"])
    op.create_index("ix_json_records_task_id", "json_records", ["task_id"])
    op.create_table(
        "document_chunks",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("document_id", sa.String(length=80), nullable=False),
        sa.Column("stock_code", sa.String(length=20), nullable=True),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_document_chunks_document_id", "document_chunks", ["document_id"])
    op.create_index("ix_document_chunks_stock_code", "document_chunks", ["stock_code"])
    op.create_table(
        "market_snapshots",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("stock_code", sa.String(length=20), nullable=False),
        sa.Column("trade_date", sa.String(length=20), nullable=False),
        sa.Column("close", sa.Float(), nullable=False),
        sa.Column("volume", sa.Float(), nullable=False),
        sa.Column("open", sa.Float(), nullable=True),
        sa.Column("high", sa.Float(), nullable=True),
        sa.Column("low", sa.Float(), nullable=True),
        sa.Column("fund_flow", sa.Float(), nullable=True),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_market_snapshots_stock_code", "market_snapshots", ["stock_code"])
    op.create_index("ix_market_snapshots_trade_date", "market_snapshots", ["trade_date"])


def downgrade() -> None:
    op.drop_table("market_snapshots")
    op.drop_table("document_chunks")
    op.drop_table("json_records")

