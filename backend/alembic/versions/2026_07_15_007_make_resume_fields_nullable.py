"""make resume sub-table fields nullable for draft saving

Revision ID: 007
Revises: 006
Create Date: 2026-07-15 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Education: make school_name, degree, major, start_date nullable
    op.alter_column('educations', 'school_name', existing_type=sa.String(100), nullable=True)
    op.alter_column('educations', 'degree', existing_type=sa.String(20), nullable=True)
    op.alter_column('educations', 'major', existing_type=sa.String(100), nullable=True)
    op.alter_column('educations', 'start_date', existing_type=sa.Date(), nullable=True)

    # WorkExperience: make exp_type, company_name, position, start_date, description nullable
    op.alter_column('work_experiences', 'exp_type', existing_type=sa.String(20), nullable=True, server_default='work')
    op.alter_column('work_experiences', 'company_name', existing_type=sa.String(100), nullable=True)
    op.alter_column('work_experiences', 'position', existing_type=sa.String(100), nullable=True)
    op.alter_column('work_experiences', 'start_date', existing_type=sa.Date(), nullable=True)
    op.alter_column('work_experiences', 'description', existing_type=sa.Text(), nullable=True)

    # Project: make project_name, role, start_date, description nullable
    op.alter_column('projects', 'project_name', existing_type=sa.String(100), nullable=True)
    op.alter_column('projects', 'role', existing_type=sa.String(100), nullable=True)
    op.alter_column('projects', 'start_date', existing_type=sa.Date(), nullable=True)
    op.alter_column('projects', 'description', existing_type=sa.Text(), nullable=True)

    # Skill: make skill_name, proficiency nullable
    op.alter_column('skills', 'skill_name', existing_type=sa.String(50), nullable=True)
    op.alter_column('skills', 'proficiency', existing_type=sa.String(20), nullable=True)

    # Language: make language, proficiency nullable
    op.alter_column('languages', 'language', existing_type=sa.String(20), nullable=True)
    op.alter_column('languages', 'proficiency', existing_type=sa.String(50), nullable=True)

    # Award: make award_name nullable
    op.alter_column('awards', 'award_name', existing_type=sa.String(200), nullable=True)

    # Portfolio: make work_name nullable
    op.alter_column('portfolios', 'work_name', existing_type=sa.String(100), nullable=True)

    # SocialLink: make platform, url nullable
    op.alter_column('social_links', 'platform', existing_type=sa.String(50), nullable=True)
    op.alter_column('social_links', 'url', existing_type=sa.String(500), nullable=True)


def downgrade() -> None:
    # SocialLink
    op.alter_column('social_links', 'url', existing_type=sa.String(500), nullable=False)
    op.alter_column('social_links', 'platform', existing_type=sa.String(50), nullable=False)

    # Portfolio
    op.alter_column('portfolios', 'work_name', existing_type=sa.String(100), nullable=False)

    # Award
    op.alter_column('awards', 'award_name', existing_type=sa.String(200), nullable=False)

    # Language
    op.alter_column('languages', 'proficiency', existing_type=sa.String(50), nullable=False)
    op.alter_column('languages', 'language', existing_type=sa.String(20), nullable=False)

    # Skill
    op.alter_column('skills', 'proficiency', existing_type=sa.String(20), nullable=False)
    op.alter_column('skills', 'skill_name', existing_type=sa.String(50), nullable=False)

    # Project
    op.alter_column('projects', 'description', existing_type=sa.Text(), nullable=False)
    op.alter_column('projects', 'start_date', existing_type=sa.Date(), nullable=False)
    op.alter_column('projects', 'role', existing_type=sa.String(100), nullable=False)
    op.alter_column('projects', 'project_name', existing_type=sa.String(100), nullable=False)

    # WorkExperience
    op.alter_column('work_experiences', 'description', existing_type=sa.Text(), nullable=False)
    op.alter_column('work_experiences', 'start_date', existing_type=sa.Date(), nullable=False)
    op.alter_column('work_experiences', 'position', existing_type=sa.String(100), nullable=False)
    op.alter_column('work_experiences', 'company_name', existing_type=sa.String(100), nullable=False)
    op.alter_column('work_experiences', 'exp_type', existing_type=sa.String(20), nullable=False, server_default=None)

    # Education
    op.alter_column('educations', 'start_date', existing_type=sa.Date(), nullable=False)
    op.alter_column('educations', 'major', existing_type=sa.String(100), nullable=False)
    op.alter_column('educations', 'degree', existing_type=sa.String(20), nullable=False)
    op.alter_column('educations', 'school_name', existing_type=sa.String(100), nullable=False)
