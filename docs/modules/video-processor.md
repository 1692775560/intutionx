# Video Processor 模块文档

## 一、模块概述

### 1.1 模块职责
Video Processor 负责从视频 URL 提取结构化内容，包括：
- 视频元信息（标题、作者、时长、封面）
- 字幕/转录文本（带时间戳）
- 视频章节信息

### 1.2 技术方案
P0 阶段使用 **BibiGPT API** 作为视频解析服务，避免自建 ASR/OCR 基础设施。

---

## 二、BibiGPT API 集成

### 2.1 API 信息

| 属性 | 值 |
|------|-----|
| 端点（获取字幕） | `https://api.bibigpt.co/api/v1/getSubtitle` |
| 方法 | GET |
| 认证 | Header: `Authorization: Bearer <token>` |
| 文档 | https://docs.bibigpt.co/api-reference/open/only-returns-the-video-subtitles-array-in-detail |

### 2.2 请求格式

```bash
curl -X GET "https://api.bibigpt.co/api/v1/getSubtitle?url=https://www.bilibili.com/video/BV1GJ411x7h7" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 2.3 响应结构（关键字段）

```typescript
interface BibiGPTResponse {
  success: boolean;
  id: string;
  sourceUrl: string;
  summary: string;  // AI 生成的摘要
  detail: {
    id: string;
    url: string;
    type: "bilibili" | "youtube" | "podcast" | string;
    title: string;
    duration: number;  // 秒
    cover: string;     // 封面图 URL
    author: string;
    authorId: string;
    
    // 核心：字幕数据
    subtitlesArray: Array<{
      startTime: number;  // 开始时间（秒）
      end: number;        // 结束时间（秒）
      text: string;       // 字幕文本
      index: number;
    }>;
    
    // 完整文本
    contentText: string;
    
    // 章节信息
    chapters: Array<{
      from: number;
      to: number;
      content: string;
    }>;
    
    // 播放地址
    playUrl: string;
    audioUrl: string;
  };
}
```

### 2.4 支持的视频平台

根据 BibiGPT 文档，支持：
- YouTube
- Bilibili
- 播客（Podcast）
- 其他主流视频平台

---

## 三、模块接口设计

### 3.1 输入

```typescript
interface VideoProcessorInput {
  videoUrl: string;  // 用户提交的视频 URL
}
```

### 3.2 输出

```typescript
interface VideoProcessorOutput {
  success: boolean;
  error?: string;
  
  // 视频元信息
  metadata: {
    title: string;
    author: string;
    duration: number;
    cover: string;
    platform: string;
    playUrl: string;
  };
  
  // 转录内容
  transcript: {
    fullText: string;  // 完整文本，用于 LLM 分析
    segments: Array<{
      startTime: number;
      endTime: number;
      text: string;
    }>;
  };
  
  // 章节（如果有）
  chapters: Array<{
    from: number;
    to: number;
    title: string;
  }>;
}
```

---

## 四、实现代码

### 4.1 Python 实现

```python
# video_processor.py

import httpx
from dataclasses import dataclass
from typing import Optional, List

BIBIGPT_API_URL = "https://api.bibigpt.co/api/open/v1/summary"
BIBIGPT_API_KEY = "YOUR_API_KEY"  # 从环境变量读取


@dataclass
class TranscriptSegment:
    start_time: float
    end_time: float
    text: str


@dataclass
class Chapter:
    from_time: float
    to_time: float
    title: str


@dataclass
class VideoMetadata:
    title: str
    author: str
    duration: float
    cover: str
    platform: str
    play_url: str


@dataclass
class VideoProcessorResult:
    success: bool
    error: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    full_text: Optional[str] = None
    segments: Optional[List[TranscriptSegment]] = None
    chapters: Optional[List[Chapter]] = None


async def process_video(video_url: str) -> VideoProcessorResult:
    """
    调用 BibiGPT API 解析视频，提取转录文本和元信息
    """
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                BIBIGPT_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": BIBIGPT_API_KEY,
                },
                json={
                    "url": video_url,
                    "includeDetail": True,
                }
            )
            
            if response.status_code != 200:
                return VideoProcessorResult(
                    success=False,
                    error=f"BibiGPT API error: {response.status_code}"
                )
            
            data = response.json()
            
            if not data.get("success"):
                return VideoProcessorResult(
                    success=False,
                    error="BibiGPT returned unsuccessful response"
                )
            
            detail = data.get("detail", {})
            
            # 解析元信息
            metadata = VideoMetadata(
                title=detail.get("title", ""),
                author=detail.get("author", ""),
                duration=detail.get("duration", 0),
                cover=detail.get("cover", ""),
                platform=detail.get("type", "unknown"),
                play_url=detail.get("playUrl", ""),
            )
            
            # 解析字幕
            subtitles = detail.get("subtitlesArray", [])
            segments = [
                TranscriptSegment(
                    start_time=s.get("startTime", 0),
                    end_time=s.get("end", 0),
                    text=s.get("text", ""),
                )
                for s in subtitles
            ]
            
            # 完整文本
            full_text = detail.get("contentText", "")
            if not full_text and segments:
                full_text = " ".join([s.text for s in segments])
            
            # 解析章节
            chapters_data = detail.get("chapters", [])
            chapters = [
                Chapter(
                    from_time=c.get("from", 0),
                    to_time=c.get("to", 0),
                    title=c.get("content", ""),
                )
                for c in chapters_data
            ]
            
            return VideoProcessorResult(
                success=True,
                metadata=metadata,
                full_text=full_text,
                segments=segments,
                chapters=chapters,
            )
            
    except httpx.TimeoutException:
        return VideoProcessorResult(
            success=False,
            error="Request timeout - video may be too long"
        )
    except Exception as e:
        return VideoProcessorResult(
            success=False,
            error=str(e)
        )
```

### 4.2 测试脚本

```python
# test_video_processor.py

import asyncio
from video_processor import process_video

async def main():
    # 测试 Bilibili 视频
    test_url = "https://www.bilibili.com/video/BV1GJ411x7h7"
    
    print(f"Processing: {test_url}")
    result = await process_video(test_url)
    
    if result.success:
        print(f"✅ Success!")
        print(f"Title: {result.metadata.title}")
        print(f"Author: {result.metadata.author}")
        print(f"Duration: {result.metadata.duration}s")
        print(f"Segments: {len(result.segments)}")
        print(f"Full text length: {len(result.full_text)} chars")
        print(f"\nFirst 500 chars of transcript:")
        print(result.full_text[:500])
    else:
        print(f"❌ Failed: {result.error}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 五、验证步骤

### 5.1 快速验证（curl）✅ 已验证通过

```bash
curl -X GET "https://api.bibigpt.co/api/v1/getSubtitle?url=https://www.bilibili.com/video/BV1GJ411x7h7" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

返回示例：
- `title`: "【官方 MV】Never Gonna Give You Up - Rick Astley"
- `subtitlesArray`: 带时间戳的字幕数组
- `remainingTime`: API 剩余额度

### 5.2 Python 脚本验证

```bash
cd mora_hackathon_ui
pip install httpx
python test_video_processor.py
```

---

## 六、错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| API Key 无效 | 返回认证错误，提示检查配置 |
| 视频 URL 无效 | 返回解析错误 |
| 视频平台不支持 | 返回平台不支持错误 |
| 请求超时 | 返回超时错误，建议重试 |
| 视频无字幕 | 返回空 segments，full_text 可能为空 |

---

## 七、后续优化（P1+）

1. **缓存机制**：相同 URL 不重复调用 API
2. **降级方案**：BibiGPT 不可用时，自建 ASR 备选
3. **OCR 补充**：对于代码截图，补充 OCR 识别
4. **多语言支持**：处理非中文视频的翻译

---

*文档版本：v1.0*
*最后更新：2026-01-01*
