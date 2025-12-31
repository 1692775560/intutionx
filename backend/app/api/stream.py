from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.services import bibigpt_service, deepseek_service, timeline_service
from app.services.video_processor import VideoProcessor
from app.utils.sse import sse_event
from app.utils.cache import Cache, CacheKeys
from app.utils.errors import ErrorCode, get_error_message
from app.config import get_settings
import uuid
import logging

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get(
    "/session/{session_id}/stream",
    summary="SSE流式推送",
    description="建立SSE连接，流式推送处理进度和结果"
)
async def stream_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """SSE流式推送端点"""
    
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    session = db.query(models.Session).filter(
        models.Session.id == session_uuid
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    async def event_generator():
        try:
            session.status = models.SessionStatus.PROCESSING
            db.commit()
            
            yield sse_event("thought", {"content": "正在验证视频URL..."})
            
            if not VideoProcessor.is_valid_url(session.video_url):
                raise Exception(get_error_message(ErrorCode.INVALID_VIDEO_URL))
            
            yield sse_event("thought", {"content": "正在提取字幕，请稍候..."})
            
            cache_key = CacheKeys.video_subtitle(session.video_url)
            subtitle_data = None
            
            if settings.ENABLE_CACHE:
                subtitle_data = Cache.get(cache_key)
                if subtitle_data:
                    logger.info(f"Using cached subtitle for {session.video_url}")
            
            if not subtitle_data:
                try:
                    subtitle_data = await bibigpt_service.get_subtitle(session.video_url)
                    
                    if settings.ENABLE_CACHE:
                        Cache.set(cache_key, subtitle_data, ttl=settings.VIDEO_CACHE_TTL)
                    
                except Exception as e:
                    logger.error(f"BibiGPT API error: {e}")
                    raise Exception(get_error_message(ErrorCode.BIBIGPT_API_ERROR))
            
            duration = subtitle_data.get("duration", 0)
            if not VideoProcessor.validate_duration(duration, settings.MAX_VIDEO_DURATION):
                raise Exception(get_error_message(ErrorCode.VIDEO_TOO_LONG))
            
            yield sse_event("subtitle", subtitle_data)
            
            session.subtitles = subtitle_data
            session.video_info = {
                "title": subtitle_data.get("title"),
                "duration": subtitle_data.get("duration"),
                "thumbnail": subtitle_data.get("thumbnail"),
                "author": subtitle_data.get("author")
            }
            db.commit()
            
            yield sse_event("thought", {"content": "正在分析视频内容并生成代码..."})
            
            full_code = ""
            try:
                async for code_chunk in deepseek_service.generate_code_stream(subtitle_data):
                    full_code += code_chunk
                    yield sse_event("code", {"content": code_chunk})
                
                if not full_code.strip():
                    raise Exception("Generated code is empty")
                    
            except Exception as e:
                logger.error(f"DeepSeek API error: {e}")
                raise Exception(get_error_message(ErrorCode.DEEPSEEK_API_ERROR))
            
            yield sse_event("code_done", {})
            
            session.generated_code = full_code
            db.commit()
            
            yield sse_event("thought", {"content": "正在生成时间轴映射..."})
            
            try:
                timeline = await timeline_service.generate_timeline(subtitle_data, full_code)
            except Exception as e:
                logger.warning(f"Timeline generation failed: {e}")
                timeline = {
                    "segments": [{
                        "startTime": 0,
                        "endTime": duration,
                        "description": "完整内容",
                        "codeLines": None
                    }]
                }
            
            yield sse_event("timeline", timeline)
            
            session.timeline = timeline
            db.commit()
            
            session.status = models.SessionStatus.COMPLETED
            db.commit()
            
            yield sse_event("done", {})
            
            logger.info(f"Session {session_id} completed successfully")
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Session {session_id} error: {error_message}")
            
            session.status = models.SessionStatus.ERROR
            session.error_message = error_message
            db.commit()
            
            yield sse_event("error", {
                "code": "PROCESSING_ERROR",
                "message": error_message
            })
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
