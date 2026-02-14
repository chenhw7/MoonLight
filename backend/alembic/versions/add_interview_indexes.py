"""添加面试相关表索引

Revision ID: add_interview_indexes
Revises: add_interview_tables
Create Date: 2024-01-01 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_interview_indexes'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """添加性能优化索引。"""
    # 面试会话表索引
    op.create_index(
        'ix_interview_sessions_user_id_status',
        'interview_sessions',
        ['user_id', 'status']
    )
    op.create_index(
        'ix_interview_sessions_user_id_created_at',
        'interview_sessions',
        ['user_id', 'created_at']
    )
    op.create_index(
        'ix_interview_sessions_status',
        'interview_sessions',
        ['status']
    )

    # 面试消息表索引
    op.create_index(
        'ix_interview_messages_session_id_created_at',
        'interview_messages',
        ['session_id', 'created_at']
    )
    op.create_index(
        'ix_interview_messages_session_id_round',
        'interview_messages',
        ['session_id', 'round']
    )

    # 面试评价表索引
    op.create_index(
        'ix_interview_evaluations_session_id',
        'interview_evaluations',
        ['session_id'],
        unique=True
    )
    op.create_index(
        'ix_interview_evaluations_overall_score',
        'interview_evaluations',
        ['overall_score']
    )


def downgrade() -> None:
    """删除索引。"""
    # 删除面试评价表索引
    op.drop_index('ix_interview_evaluations_overall_score', table_name='interview_evaluations')
    op.drop_index('ix_interview_evaluations_session_id', table_name='interview_evaluations')

    # 删除面试消息表索引
    op.drop_index('ix_interview_messages_session_id_round', table_name='interview_messages')
    op.drop_index('ix_interview_messages_session_id_created_at', table_name='interview_messages')

    # 删除面试会话表索引
    op.drop_index('ix_interview_sessions_status', table_name='interview_sessions')
    op.drop_index('ix_interview_sessions_user_id_created_at', table_name='interview_sessions')
    op.drop_index('ix_interview_sessions_user_id_status', table_name='interview_sessions')
