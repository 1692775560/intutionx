# database.py
# Supabase 数据库服务

import os
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://lzuazgurngxmxtkpckxe.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dWF6Z3Vybmd4bXh0a3Bja3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMjcxMDAsImV4cCI6MjA4MjgwMzEwMH0.IP9ws2lNEcpJg_KpQAve8skpEWlB6kblFN4Y3Dq6SOw")

# 创建 Supabase 客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_device_id() -> str:
    """生成或获取设备ID（用于标识用户，后续可替换为真实用户认证）"""
    # 这里简单返回一个固定值，实际应该从前端传入
    return "default_user"


# ============ 项目 CRUD ============

def create_project(
    project_type: str,
    title: str,
    input_content: str,
    data: Dict[str, Any] = None,
    user_id: str = None
) -> Dict[str, Any]:
    """创建新项目"""
    if user_id is None:
        user_id = get_device_id()
    
    result = supabase.table("projects").insert({
        "type": project_type,
        "title": title,
        "input": input_content,
        "data": data or {},
        "user_id": user_id,
    }).execute()
    
    return result.data[0] if result.data else None


def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    """获取单个项目"""
    result = supabase.table("projects").select("*").eq("id", project_id).execute()
    return result.data[0] if result.data else None


def get_user_projects(user_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
    """获取用户的项目列表"""
    if user_id is None:
        user_id = get_device_id()
    
    result = supabase.table("projects") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("updated_at", desc=True) \
        .limit(limit) \
        .execute()
    
    return result.data or []


def get_recent_projects(limit: int = 10) -> List[Dict[str, Any]]:
    """获取最近的项目（所有用户）"""
    result = supabase.table("projects") \
        .select("*") \
        .order("updated_at", desc=True) \
        .limit(limit) \
        .execute()
    
    return result.data or []


def update_project(project_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """更新项目"""
    result = supabase.table("projects") \
        .update(updates) \
        .eq("id", project_id) \
        .execute()
    
    return result.data[0] if result.data else None


def delete_project(project_id: str) -> bool:
    """删除项目"""
    result = supabase.table("projects") \
        .delete() \
        .eq("id", project_id) \
        .execute()
    
    return len(result.data) > 0 if result.data else False


# ============ 便捷方法 ============

def save_video_to_code_project(
    video_url: str,
    title: str,
    code: str = None,
    execution_result: str = None,
    user_id: str = None
) -> Dict[str, Any]:
    """保存 Video to Code 项目"""
    return create_project(
        project_type="video-to-code",
        title=title,
        input_content=video_url,
        data={
            "video_url": video_url,
            "code": code,
            "execution_result": execution_result,
        },
        user_id=user_id,
    )


def save_deep_research_project(
    keyword: str,
    graph_data: Dict[str, Any] = None,
    user_id: str = None
) -> Dict[str, Any]:
    """保存 Deep Research 项目"""
    return create_project(
        project_type="deep-research",
        title=f"Research: {keyword}",
        input_content=keyword,
        data={
            "keyword": keyword,
            "graph": graph_data,
        },
        user_id=user_id,
    )
