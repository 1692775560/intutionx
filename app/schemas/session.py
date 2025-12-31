from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    """会话状态"""
    created = "created"
    processing = "processing"
    completed = "completed"
    error = "error"

class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    videoUrl: HttpUrl = Field(..., description="视频URL")
    language: Optional[str] = Field("python", description="编程语言")

class SessionResponse(BaseModel):
    """会话响应（简化版）"""
    sessionId: str
    videoUrl: str
    status: SessionStatus
    createdAt: datetime

class VideoInfo(BaseModel):
    """视频信息"""
    title: str
    duration: int
    thumbnail: str
    author: Optional[str] = None

class SessionDetailResponse(BaseModel):
    """会话详细响应"""
    sessionId: str
    videoUrl: str
    status: SessionStatus
    videoInfo: Optional[VideoInfo] = None
    generatedCode: Optional[str] = None
    timeline: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
