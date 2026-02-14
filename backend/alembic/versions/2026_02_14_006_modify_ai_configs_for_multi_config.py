"""modify ai_configs for multi config support

Revision ID: 006
Revises: 005
Create Date: 2026-02-14 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = 'add_interview_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 移除 user_id 的唯一约束
    op.drop_constraint('ai_configs_user_id_key', 'ai_configs', type_='unique')
    op.drop_index('idx_ai_configs_user_id', table_name='ai_configs')
    
    # 2. 添加 name 字段
    op.add_column('ai_configs', sa.Column('name', sa.String(length=100), nullable=False, server_default='未命名配置'))
    
    # 3. 添加 is_active 字段
    op.add_column('ai_configs', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'))
    
    # 4. 创建新的索引（非唯一）
    op.create_index('idx_ai_configs_user_id', 'ai_configs', ['user_id'])
    op.create_index('idx_ai_configs_user_active', 'ai_configs', ['user_id', 'is_active'])
    
    # 5. 将现有配置的 is_active 设为 true
    op.execute("UPDATE ai_configs SET is_active = true")


def downgrade() -> None:
    # 1. 删除索引
    op.drop_index('idx_ai_configs_user_active', table_name='ai_configs')
    op.drop_index('idx_ai_configs_user_id', table_name='ai_configs')
    
    # 2. 删除字段
    op.drop_column('ai_configs', 'is_active')
    op.drop_column('ai_configs', 'name')
    
    # 3. 恢复唯一约束
    op.create_index('idx_ai_configs_user_id', 'ai_configs', ['user_id'], unique=True)
    op.create_unique_constraint('ai_configs_user_id_key', 'ai_configs', ['user_id'])
