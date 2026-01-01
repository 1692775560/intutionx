#!/usr/bin/env python3
# 更新所有项目的封面图片

import asyncio
import os
import sys
from pathlib import Path

# 添加 backend 目录到 Python 路径
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from database import get_recent_projects, update_project
from image_service import generate_project_image

async def update_all_project_images():
    """更新所有项目的封面图片"""
    print("获取项目列表...")
    projects = get_recent_projects(limit=20)
    
    print(f"找到 {len(projects)} 个项目")
    
    for project in projects:
        project_id = project.get("id")
        project_type = project.get("type", "deep-research")
        data = project.get("data", {}) or {}
        keyword = data.get("keyword", "") or project.get("input", "")
        
        print(f"\n处理项目: {project.get('title')} (keyword: {keyword})")
        
        # 生成新图片
        print(f"  正在生成图片...")
        new_image = await generate_project_image(keyword, project_type)
        
        if new_image:
            print(f"  图片生成成功")
            
            # 更新项目数据
            data["cover_image"] = new_image
            try:
                result = update_project(project_id, {"data": data})
                if result:
                    print(f"  项目已更新")
                else:
                    print(f"  更新失败")
            except Exception as e:
                print(f"  更新出错: {e}")
        else:
            print(f"  图片生成失败，使用默认图片")

if __name__ == "__main__":
    asyncio.run(update_all_project_images())
    print("\n完成!")
