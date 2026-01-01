from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.services import bibigpt_service, deepseek_service, timeline_service, code_planner
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
            
            # ============ 三步法流程 ============
            
            # 步骤1：字幕分析和内容总结
            yield sse_event("thought", {"content": "步骤1/3：正在分析字幕内容，识别知识点..."})
            
            try:
                segments = await code_planner.summarize_subtitles(subtitle_data)
                logger.info(f"Step 1 complete: Identified {len(segments)} content segments")
                
                # 发送总结信息给前端
                yield sse_event("plan", {"segments": segments})
                
            except Exception as e:
                logger.error(f"Subtitle analysis error: {e}")
                raise Exception("字幕分析失败，请重试")
            
            # 步骤2：逐段生成代码
            yield sse_event("thought", {"content": f"步骤2/3：开始生成代码，共{len(segments)}个知识点..."})
            
            code_segments = []  # 存储每段代码的完整信息
            
            try:
                for i, segment in enumerate(segments, 1):
                    summary = segment.get("summary", "Unknown")
                    start_time = segment.get("startTime", 0)
                    end_time = segment.get("endTime", 0)
                    
                    # 通知前端正在生成哪个段落
                    time_range = f"{start_time//60}:{start_time%60:02d}-{end_time//60}:{end_time%60:02d}"
                    yield sse_event("thought", {
                        "content": f"正在生成第{i}/{len(segments)}段（{time_range} - {summary}）..."
                    })
                    
                    # 收集原始输出
                    raw_output = ""
                    async for code_chunk in deepseek_service.generate_segment_code_stream(subtitle_data, segment):
                        raw_output += code_chunk
                    
                    # 从<code>标记中提取实际代码
                    segment_code = VideoProcessor.extract_code_from_tags(raw_output)
                    
                    # 验证语法
                    is_valid, error_msg = VideoProcessor.validate_python_syntax(segment_code)
                    if not is_valid:
                        logger.warning(f"Segment {i} syntax error: {error_msg}")
                    
                    # 存储这段代码的完整信息
                    code_segment_data = {
                        "segmentIndex": i - 1,  # 0-based index
                        "startTime": start_time,
                        "endTime": end_time,
                        "summary": summary,
                        "code": segment_code.strip(),
                        "timeRange": time_range
                    }
                    
                    code_segments.append(code_segment_data)
                    
                    # 发送单独的代码段
                    logger.info(f"Sending code_segment {i}: {time_range} - {summary}")
                    yield sse_event("code_segment", code_segment_data)
                    logger.info(f"Code segment {i} sent successfully")
                
                if not code_segments:
                    raise Exception("No code segments generated")
                
                logger.info(f"All {len(code_segments)} code segments generated")
                    
            except Exception as e:
                logger.error(f"Code generation error: {e}")
                raise Exception(get_error_message(ErrorCode.DEEPSEEK_API_ERROR))
            
            yield sse_event("code_done", {})
            
            # 保存代码段信息到session
            session.generated_code = str(code_segments)  # 存储为JSON字符串
            db.commit()
            
            # 步骤3：发送所有代码段的汇总信息
            yield sse_event("thought", {"content": "步骤3/3：所有代码段生成完成..."})
            
            logger.info(f"Step 3: All {len(code_segments)} code segments ready")
            
            # 发送代码段汇总
            yield sse_event("segments_complete", {
                "totalSegments": len(code_segments),
                "segments": code_segments
            })
            
            session.timeline = {"segments": code_segments}
            db.commit()
            
            logger.info("Step 3 complete: All segments ready")
            
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
