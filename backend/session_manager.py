# session_manager.py
# Session 管理模块 - 管理任务状态和生命周期

import uuid
import asyncio
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class SessionStatus(str, Enum):
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass
class VideoInfo:
    title: str = ""
    author: str = ""
    duration: float = 0
    cover: str = ""


@dataclass
class ExecutionInfo:
    status: str = ""  # success, error, timeout
    output: str = ""
    error: str = ""


@dataclass
class Session:
    id: str
    video_url: str
    status: SessionStatus = SessionStatus.CREATED
    created_at: datetime = field(default_factory=datetime.now)
    
    # 处理结果
    video: Optional[VideoInfo] = None
    transcript: str = ""
    code: str = ""
    language: str = ""
    execution: Optional[ExecutionInfo] = None
    error: Optional[str] = None
    
    # SSE 事件队列
    events: List[Dict[str, Any]] = field(default_factory=list)
    event_queue: asyncio.Queue = field(default_factory=asyncio.Queue)
    
    def add_event(self, event_type: str, data: Dict[str, Any]):
        """添加事件到队列"""
        event = {"type": event_type, "data": data}
        self.events.append(event)
        # 非阻塞地放入队列
        try:
            self.event_queue.put_nowait(event)
        except asyncio.QueueFull:
            pass
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        result = {
            "sessionId": self.id,
            "status": self.status.value,
            "videoUrl": self.video_url,
            "createdAt": self.created_at.isoformat(),
        }
        
        if self.video:
            result["video"] = {
                "title": self.video.title,
                "author": self.video.author,
                "duration": self.video.duration,
                "cover": self.video.cover,
            }
        
        if self.code:
            result["code"] = self.code
            result["language"] = self.language
        
        if self.execution:
            result["execution"] = {
                "status": self.execution.status,
                "output": self.execution.output,
                "error": self.execution.error,
            }
        
        if self.error:
            result["error"] = self.error
        
        return result


class SessionManager:
    """Session 管理器 - 内存存储"""
    
    def __init__(self):
        self._sessions: Dict[str, Session] = {}
    
    def create(self, video_url: str) -> Session:
        """创建新 Session"""
        session_id = str(uuid.uuid4())[:8]
        session = Session(id=session_id, video_url=video_url)
        self._sessions[session_id] = session
        return session
    
    def get(self, session_id: str) -> Optional[Session]:
        """获取 Session"""
        return self._sessions.get(session_id)
    
    def delete(self, session_id: str) -> bool:
        """删除 Session"""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    def list_all(self) -> List[Session]:
        """列出所有 Session"""
        return list(self._sessions.values())


# 全局 Session 管理器实例
session_manager = SessionManager()
