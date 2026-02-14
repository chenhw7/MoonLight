-- 手动修复 ai_configs 表结构以支持多配置

-- 1. 移除 user_id 的唯一约束（如果不存在则忽略错误）
DO $$
BEGIN
    -- 删除唯一约束
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ai_configs_user_id_key' 
        AND conrelid = 'ai_configs'::regclass
    ) THEN
        ALTER TABLE ai_configs DROP CONSTRAINT ai_configs_user_id_key;
    END IF;
    
    -- 删除唯一索引
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_ai_configs_user_id' 
        AND tablename = 'ai_configs'
    ) THEN
        DROP INDEX idx_ai_configs_user_id;
    END IF;
END $$;

-- 2. 添加 name 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'name'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT '未命名配置';
    END IF;
END $$;

-- 3. 添加 is_active 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_configs' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE ai_configs ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 4. 创建新的索引（非唯一）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_ai_configs_user_id'
    ) THEN
        CREATE INDEX idx_ai_configs_user_id ON ai_configs(user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_ai_configs_user_active'
    ) THEN
        CREATE INDEX idx_ai_configs_user_active ON ai_configs(user_id, is_active);
    END IF;
END $$;

-- 5. 将现有配置的 is_active 设为 true
UPDATE ai_configs SET is_active = true WHERE is_active = false;

-- 验证修改
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_configs' 
ORDER BY ordinal_position;
