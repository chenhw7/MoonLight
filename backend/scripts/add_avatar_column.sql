-- 添加 avatar 字段到 resumes 表
-- 运行方式: psql -d your_database -f add_avatar_column.sql

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 添加注释
COMMENT ON COLUMN resumes.avatar IS 'Base64 编码的头像图片';
