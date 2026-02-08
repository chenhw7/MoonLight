"""add avatar to resume

Revision ID: 002
Revises: 001
Create Date: 2026-02-08 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 avatar 字段到 resumes 表
    op.add_column('resumes', sa.Column('avatar', sa.Text(), nullable=True))


def downgrade() -> None:
    # 删除 avatar 字段
    op.drop_column('resumes', 'avatar')
