"""
{{resource_name}} 数据模型

定义 {{resource_name}} 的数据库表结构
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func

from app.core.database import Base


class {{ResourceName}}(Base):
    """{{resource_name}} 模型。
    
    表示数据库中的 {{table_name}} 表
    
    Attributes:
        id: 主键ID
        name: 名称
        description: 描述
        is_active: 是否激活
        created_at: 创建时间
        updated_at: 更新时间
    """
    
    __tablename__ = "{{table_name}}"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )
    
    def __repr__(self) -> str:
        """返回模型的字符串表示。"""
        return f"<{{ResourceName}}(id={self.id}, name='{self.name}')>"
    
    def to_dict(self) -> dict:
        """将模型转换为字典。
        
        Returns:
            dict: 模型数据的字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
