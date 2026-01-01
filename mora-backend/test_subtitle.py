import asyncio
import sys
sys.path.insert(0, '/Users/Zhuanz/Desktop/Mora/mora-backend')

from app.services.bibigpt_service import bibigpt_service

async def test_subtitle():
    """测试字幕提取质量"""
    video_url = "https://www.bilibili.com/video/BV1qW4y1a7fU?p=25"
    
    print("正在提取字幕...")
    try:
        subtitle_data = await bibigpt_service.get_subtitle(video_url)
        
        print(f"\n标题: {subtitle_data.get('title')}")
        print(f"时长: {subtitle_data.get('duration')}秒")
        print(f"字幕数量: {len(subtitle_data.get('subtitles', []))}\n")
        
        print("=" * 80)
        print("前20条字幕样本：")
        print("=" * 80)
        
        subtitles = subtitle_data.get('subtitles', [])
        for i, sub in enumerate(subtitles[:20]):
            start = sub.get('startTime', 0)
            text = sub.get('text', '')
            print(f"[{start:6.1f}s] {text}")
        
        print("\n" + "=" * 80)
        print("字幕质量评估：")
        print("=" * 80)
        
        # 统计字幕质量
        total = len(subtitles)
        chinese_count = sum(1 for s in subtitles if any('\u4e00' <= c <= '\u9fff' for c in s.get('text', '')))
        empty_count = sum(1 for s in subtitles if not s.get('text', '').strip())
        
        print(f"总字幕数: {total}")
        print(f"包含中文: {chinese_count} ({chinese_count/total*100:.1f}%)")
        print(f"空字幕: {empty_count}")
        print(f"平均长度: {sum(len(s.get('text', '')) for s in subtitles) / total:.1f} 字符/条")
        
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    asyncio.run(test_subtitle())
