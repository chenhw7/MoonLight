"""add interview tables for AI interviewer feature

Revision ID: 005
Revises: 004
Create Date: 2026-02-12 14:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ========== 面试会话表 ==========
    op.create_table(
        'interview_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(length=100), nullable=False),
        sa.Column('position_name', sa.String(length=100), nullable=False),
        sa.Column('job_description', sa.Text(), nullable=False),
        sa.Column('recruitment_type', sa.String(length=20), nullable=False, comment='campus/social'),
        sa.Column('interview_mode', sa.String(length=50), nullable=False),
        sa.Column('interviewer_style', sa.String(length=20), nullable=False, comment='strict/gentle/pressure'),
        sa.Column('model_config', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='ongoing', comment='ongoing/completed/aborted'),
        sa.Column('current_round', sa.String(length=30), nullable=False, server_default='opening', comment='opening/self_intro/qa/reverse_qa/closing'),
        sa.Column('start_time', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 面试会话表索引
    op.create_index('idx_interview_sessions_user_id', 'interview_sessions', ['user_id'])
    op.create_index('idx_interview_sessions_status', 'interview_sessions', ['status'])
    op.create_index('idx_interview_sessions_created_at', 'interview_sessions', ['created_at'])
    
    # ========== 面试消息表 ==========
    op.create_table(
        'interview_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, comment='ai/user'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('round', sa.String(length=30), nullable=False, comment='opening/self_intro/qa/reverse_qa/closing'),
        sa.Column('meta_info', postgresql.JSON(astext_type=sa.Text()), nullable=True, comment='元数据'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 面试消息表索引
    op.create_index('idx_interview_messages_session_id', 'interview_messages', ['session_id'])
    op.create_index('idx_interview_messages_round', 'interview_messages', ['round'])
    
    # ========== 面试评价表 ==========
    op.create_table(
        'interview_evaluations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=False, comment='0-100'),
        sa.Column('dimension_scores', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('dimension_details', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('suggestions', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('recommended_questions', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id')
    )
    
    # ========== AI 配置表 ==========
    op.create_table(
        'ai_configs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='openai-compatible'),
        sa.Column('base_url', sa.String(length=500), nullable=False),
        sa.Column('api_key', sa.String(length=500), nullable=False),
        sa.Column('chat_model', sa.String(length=100), nullable=False, server_default='gpt-4'),
        sa.Column('reasoning_model', sa.String(length=100), nullable=True),
        sa.Column('vision_model', sa.String(length=100), nullable=True),
        sa.Column('voice_model', sa.String(length=100), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('max_tokens', sa.Integer(), nullable=False, server_default='4096'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # AI 配置表索引
    op.create_index('idx_ai_configs_user_id', 'ai_configs', ['user_id'], unique=True)


def downgrade() -> None:
    # 删除表（按依赖关系倒序）
    op.drop_index('idx_ai_configs_user_id', table_name='ai_configs')
    op.drop_table('ai_configs')
    
    op.drop_table('interview_evaluations')
    
    op.drop_index('idx_interview_messages_round', table_name='interview_messages')
    op.drop_index('idx_interview_messages_session_id', table_name='interview_messages')
    op.drop_table('interview_messages')
    
    op.drop_index('idx_interview_sessions_created_at', table_name='interview_sessions')
    op.drop_index('idx_interview_sessions_status', table_name='interview_sessions')
    op.drop_index('idx_interview_sessions_user_id', table_name='interview_sessions')
    op.drop_table('interview_sessions')
