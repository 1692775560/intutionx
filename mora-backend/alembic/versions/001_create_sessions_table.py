"""create sessions table

Revision ID: 001
Revises: 
Create Date: 2026-01-01 06:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'sessions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('video_url', sa.Text(), nullable=False),
        sa.Column('language', sa.String(20), server_default='python'),
        sa.Column('status', sa.Enum('created', 'processing', 'completed', 'error', name='sessionstatus'), nullable=False, server_default='created'),
        sa.Column('video_info', JSONB, nullable=True),
        sa.Column('subtitles', JSONB, nullable=True),
        sa.Column('timeline', JSONB, nullable=True),
        sa.Column('generated_code', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    
    op.create_index('ix_sessions_video_url', 'sessions', ['video_url'])
    op.create_index('ix_sessions_status', 'sessions', ['status'])
    op.create_index('ix_sessions_created_at', 'sessions', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_sessions_created_at', table_name='sessions')
    op.drop_index('ix_sessions_status', table_name='sessions')
    op.drop_index('ix_sessions_video_url', table_name='sessions')
    op.drop_table('sessions')
    sa.Enum(name='sessionstatus').drop(op.get_bind())
