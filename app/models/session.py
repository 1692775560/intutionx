from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base
import uuid
from datetime import datetime
import enum

class SessionStatus(str, enum.Enum):
    """会话状态枚举"""
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class Session(Base):
    """会话模型"""
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_url = Column(Text, nullable=False, index=True)
    language = Column(String(20), default="python")
    status = Column(
        SQLEnum(SessionStatus, values_callable=lambda x: [e.value for e in x]), 
        nullable=False, 
        default=SessionStatus.CREATED.value,
        index=True
    )
    
    video_info = Column(JSONB, nullable=True)
    subtitles = Column(JSONB, nullable=True)
    timeline = Column(JSONB, nullable=True)
    
    generated_code = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Session {self.id} - {self.status}>"
