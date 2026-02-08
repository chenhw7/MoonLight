"""add avatar_ratio to resume

Revision ID: 003
Revises: 002
Create Date: 2026-02-08 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 avatar_ratio 字段到 resumes 表
    op.add_column('resumes', sa.Column('avatar_ratio', sa.String(length=10), nullable=True, server_default='1.4'))


def downgrade() -> None:
    # 删除 avatar_ratio 字段
    op.drop_column('resumes', 'avatar_ratio')
