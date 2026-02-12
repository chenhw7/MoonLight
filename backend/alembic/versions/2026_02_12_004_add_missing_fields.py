"""add missing fields to resume and sub-tables

Revision ID: 004
Revises: 003
Create Date: 2026-02-12 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ========== resumes 表新增字段 ==========
    # 求职意向字段
    op.add_column('resumes', sa.Column('target_position', sa.String(length=100), nullable=True))
    op.add_column('resumes', sa.Column('target_city', sa.String(length=50), nullable=True))
    op.add_column('resumes', sa.Column('start_work_date', sa.String(length=50), nullable=True))
    
    # 内部管理字段
    op.add_column('resumes', sa.Column('salary_expectation', sa.String(length=50), nullable=True))
    op.add_column('resumes', sa.Column('application_status', sa.String(length=20), nullable=True))
    op.add_column('resumes', sa.Column('target_companies', sa.Text(), nullable=True))
    op.add_column('resumes', sa.Column('private_notes', sa.Text(), nullable=True))
    
    # ========== educations 表新增字段 ==========
    op.add_column('educations', sa.Column('ranking', sa.String(length=50), nullable=True))
    op.add_column('educations', sa.Column('is_current', sa.Boolean(), nullable=True, server_default='0'))
    
    # ========== work_experiences 表新增字段 ==========
    op.add_column('work_experiences', sa.Column('department', sa.String(length=100), nullable=True))
    op.add_column('work_experiences', sa.Column('achievements', sa.Text(), nullable=True))
    op.add_column('work_experiences', sa.Column('tech_stack', sa.String(length=500), nullable=True))
    op.add_column('work_experiences', sa.Column('is_current', sa.Boolean(), nullable=True, server_default='0'))
    
    # ========== projects 表新增字段 ==========
    op.add_column('projects', sa.Column('role_detail', sa.String(length=200), nullable=True))
    op.add_column('projects', sa.Column('tech_stack', sa.String(length=500), nullable=True))
    op.add_column('projects', sa.Column('is_current', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    # ========== 回滚 resumes 表字段 ==========
    op.drop_column('resumes', 'private_notes')
    op.drop_column('resumes', 'target_companies')
    op.drop_column('resumes', 'application_status')
    op.drop_column('resumes', 'salary_expectation')
    op.drop_column('resumes', 'start_work_date')
    op.drop_column('resumes', 'target_city')
    op.drop_column('resumes', 'target_position')
    
    # ========== 回滚 educations 表字段 ==========
    op.drop_column('educations', 'is_current')
    op.drop_column('educations', 'ranking')
    
    # ========== 回滚 work_experiences 表字段 ==========
    op.drop_column('work_experiences', 'is_current')
    op.drop_column('work_experiences', 'tech_stack')
    op.drop_column('work_experiences', 'achievements')
    op.drop_column('work_experiences', 'department')
    
    # ========== 回滚 projects 表字段 ==========
    op.drop_column('projects', 'is_current')
    op.drop_column('projects', 'tech_stack')
    op.drop_column('projects', 'role_detail')
