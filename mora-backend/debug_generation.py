import asyncio
import sys
sys.path.insert(0, '/Users/Zhuanz/Desktop/Mora/mora-backend')

from app.services.bibigpt_service import bibigpt_service
from app.services.code_planner import code_planner
from app.services.deepseek_service import deepseek_service

async def debug_generation():
    """调试代码生成流程"""
    video_url = "https://www.bilibili.com/video/BV1qW4y1a7fU?p=25"
    
    print("=" * 80)
    print("Step 1: 提取字幕")
    print("=" * 80)
    subtitle_data = await bibigpt_service.get_subtitle(video_url)
    print(f"标题: {subtitle_data.get('title')}")
    print(f"字幕数: {len(subtitle_data.get('subtitles', []))}")
    
    print("\n" + "=" * 80)
    print("Step 2: 分析字幕（让大模型总结）")
    print("=" * 80)
    segments = await code_planner.summarize_subtitles(subtitle_data)
    
    for i, seg in enumerate(segments, 1):
        print(f"\n段落 {i}:")
        print(f"  时间: {seg['startTime']}s - {seg['endTime']}s")
        print(f"  总结: {seg['summary']}")
        print(f"  任务: {seg['codeTask']}")
    
    print("\n" + "=" * 80)
    print("Step 3: 生成第一段代码")
    print("=" * 80)
    
    if segments:
        first_segment = segments[0]
        print(f"正在生成: {first_segment['summary']}")
        print(f"代码任务: {first_segment['codeTask']}\n")
        
        full_output = ""
        async for chunk in deepseek_service.generate_segment_code_stream(subtitle_data, first_segment):
            full_output += chunk
            # print(chunk, end='', flush=True)
        
        print("\n" + "-" * 80)
        print("原始输出:")
        print("-" * 80)
        print(full_output[:500])  # 只显示前500字符
        
        # 检查是否包含<code>标记
        if '<code>' in full_output:
            print("\n✅ 包含<code>标记")
        else:
            print("\n❌ 缺少<code>标记")
        
        # 检查是否是Python代码
        if 'def ' in full_output or 'import ' in full_output or 'print(' in full_output:
            print("✅ 可能包含Python代码")
        else:
            print("❌ 不像Python代码")

if __name__ == "__main__":
    asyncio.run(debug_generation())
