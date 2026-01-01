# video_processor.py
# 视频处理模块 - 使用 BibiGPT API 获取视频字幕

import httpx
import os
from dataclasses import dataclass
from typing import Optional, List

BIBIGPT_API_KEY = os.getenv("BIBIGPT_API_KEY", "Yg8XSbFg9bjm")
BIBIGPT_API_URL = "https://api.bibigpt.co/api/v1/getSubtitle"


@dataclass
class TranscriptSegment:
    start_time: float
    end_time: float
    text: str


@dataclass
class VideoMetadata:
    title: str
    author: str
    duration: float
    cover: str
    platform: str


@dataclass
class VideoProcessorResult:
    success: bool
    error: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    full_text: Optional[str] = None
    segments: Optional[List[TranscriptSegment]] = None


async def process_video(video_url: str) -> VideoProcessorResult:
    """
    调用 BibiGPT API 解析视频，提取转录文本和元信息
    """
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(
                BIBIGPT_API_URL,
                params={"url": video_url},
                headers={"Authorization": f"Bearer {BIBIGPT_API_KEY}"},
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
                    error=data.get("message", "Unknown error")
                )
            
            detail = data.get("detail", {})
            
            # 解析元信息
            metadata = VideoMetadata(
                title=detail.get("title", ""),
                author=detail.get("author", ""),
                duration=detail.get("duration", 0),
                cover=detail.get("cover", ""),
                platform=detail.get("type", "unknown"),
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
            full_text = " ".join([s.text for s in segments])
            
            return VideoProcessorResult(
                success=True,
                metadata=metadata,
                full_text=full_text,
                segments=segments,
            )
            
    except httpx.TimeoutException:
        return VideoProcessorResult(
            success=False,
            error="Request timeout"
        )
    except Exception as e:
        return VideoProcessorResult(
            success=False,
            error=str(e)
        )
