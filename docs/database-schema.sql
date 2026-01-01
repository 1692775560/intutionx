-- Mora 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 项目表 - 存储用户的所有项目
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 项目类型: 'video-to-code' 或 'deep-research'
  type TEXT NOT NULL CHECK (type IN ('video-to-code', 'deep-research')),
  
  -- 项目标题
  title TEXT NOT NULL,
  
  -- 输入内容 (视频URL 或 关键词)
  input TEXT NOT NULL,
  
  -- 项目数据 (JSON格式存储详细内容)
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 用户ID (暂时用设备ID，后续可改为真实用户ID)
  user_id TEXT NOT NULL
);

-- 2. 为 user_id 创建索引，加速查询
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

-- 3. 自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 启用 Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 5. 创建策略：用户只能访问自己的项目
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (true);  -- 暂时允许所有读取，后续加用户认证后改为 auth.uid() = user_id

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (true);  -- 暂时允许所有插入

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (true);  -- 暂时允许所有更新

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (true);  -- 暂时允许所有删除
