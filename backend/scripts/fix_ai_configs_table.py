"""
修复 ai_configs 表结构以支持多配置

使用方法：
    cd backend
    python -m scripts.fix_ai_configs_table
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def fix_ai_configs_table():
    """修复 ai_configs 表结构"""
    async with AsyncSessionLocal() as session:
        try:
            # 1. 检查并添加 name 字段
            result = await session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'ai_configs' AND column_name = 'name'
            """))
            if not result.fetchone():
                print("添加 name 字段...")
                await session.execute(text("""
                    ALTER TABLE ai_configs 
                    ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT '未命名配置'
                """))
            else:
                print("name 字段已存在")

            # 2. 检查并添加 is_active 字段
            result = await session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'ai_configs' AND column_name = 'is_active'
            """))
            if not result.fetchone():
                print("添加 is_active 字段...")
                await session.execute(text("""
                    ALTER TABLE ai_configs 
                    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false
                """))
            else:
                print("is_active 字段已存在")

            # 3. 移除 user_id 的唯一约束
            result = await session.execute(text("""
                SELECT conname 
                FROM pg_constraint 
                WHERE conname = 'ai_configs_user_id_key' 
                AND conrelid = 'ai_configs'::regclass
            """))
            if result.fetchone():
                print("移除 user_id 唯一约束...")
                await session.execute(text("""
                    ALTER TABLE ai_configs DROP CONSTRAINT ai_configs_user_id_key
                """))
            else:
                print("user_id 唯一约束已移除或不存在")

            # 4. 删除旧的唯一索引
            result = await session.execute(text("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE indexname = 'idx_ai_configs_user_id' 
                AND tablename = 'ai_configs'
            """))
            if result.fetchone():
                print("删除旧的唯一索引...")
                await session.execute(text("""
                    DROP INDEX idx_ai_configs_user_id
                """))

            # 5. 创建新的非唯一索引
            result = await session.execute(text("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE indexname = 'idx_ai_configs_user_id' 
                AND tablename = 'ai_configs'
            """))
            if not result.fetchone():
                print("创建新的非唯一索引 idx_ai_configs_user_id...")
                await session.execute(text("""
                    CREATE INDEX idx_ai_configs_user_id ON ai_configs(user_id)
                """))
            else:
                print("索引 idx_ai_configs_user_id 已存在")

            result = await session.execute(text("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE indexname = 'idx_ai_configs_user_active' 
                AND tablename = 'ai_configs'
            """))
            if not result.fetchone():
                print("创建索引 idx_ai_configs_user_active...")
                await session.execute(text("""
                    CREATE INDEX idx_ai_configs_user_active ON ai_configs(user_id, is_active)
                """))
            else:
                print("索引 idx_ai_configs_user_active 已存在")

            # 6. 将现有配置的 is_active 设为 true
            print("更新现有配置的 is_active 状态...")
            await session.execute(text("""
                UPDATE ai_configs SET is_active = true WHERE is_active = false
            """))

            await session.commit()
            print("\n✅ 表结构修复完成！")

            # 验证结果
            print("\n当前表结构：")
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'ai_configs' 
                ORDER BY ordinal_position
            """))
            for row in result:
                print(f"  - {row.column_name}: {row.data_type} ({'nullable' if row.is_nullable == 'YES' else 'not null'})")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ 修复失败: {e}")
            raise


if __name__ == "__main__":
    # 设置环境变量
    import os
    os.environ.setdefault("APP_ENV", "development")

    asyncio.run(fix_ai_configs_table())
