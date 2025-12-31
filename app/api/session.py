from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, models
from app.database import get_db
from app.services.video_processor import VideoProcessor
from app.config import get_settings
from app.utils.errors import ErrorCode, get_error_message
import uuid
from datetime import datetime

router = APIRouter()
settings = get_settings()

@router.post(
    "/session",
    response_model=schemas.SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建新会话",
    description="提交视频URL创建处理会话"
)
async def create_session(
    request: schemas.CreateSessionRequest,
    db: Session = Depends(get_db)
):
    """创建视频处理会话"""
    video_url = str(request.videoUrl)
    if not VideoProcessor.is_valid_url(video_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": ErrorCode.INVALID_VIDEO_URL,
                "message": get_error_message(ErrorCode.INVALID_VIDEO_URL)
            }
        )
    
    platform = VideoProcessor.get_platform(video_url)
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": ErrorCode.UNSUPPORTED_PLATFORM,
                "message": get_error_message(ErrorCode.UNSUPPORTED_PLATFORM)
            }
        )
    
    session = models.Session(
        id=uuid.uuid4(),
        video_url=video_url,
        language=request.language or "python",
        status=models.SessionStatus.CREATED,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    try:
        db.add(session)
        db.commit()
        db.refresh(session)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": ErrorCode.DATABASE_ERROR,
                "message": "Failed to create session"
            }
        )
    
    return schemas.SessionResponse(
        sessionId=str(session.id),
        videoUrl=session.video_url,
        status=session.status.value,
        createdAt=session.created_at
    )


@router.get(
    "/session/{session_id}",
    response_model=schemas.SessionDetailResponse,
    summary="获取会话详情",
    description="查询会话的当前状态和生成结果"
)
async def get_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """获取会话详情"""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_SESSION_ID", "message": "Invalid session ID format"}
        )
    
    session = db.query(models.Session).filter(
        models.Session.id == session_uuid
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "SESSION_NOT_FOUND",
                "message": "Session not found"
            }
        )
    
    video_info = None
    if session.video_info:
        video_info = schemas.VideoInfo(**session.video_info)
    
    return schemas.SessionDetailResponse(
        sessionId=str(session.id),
        videoUrl=session.video_url,
        status=session.status.value,
        videoInfo=video_info,
        generatedCode=session.generated_code,
        timeline=session.timeline,
        error=session.error_message,
        createdAt=session.created_at,
        updatedAt=session.updated_at
    )
