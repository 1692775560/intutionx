# API路由实现

> 完整的FastAPI路由实现代码

## 1. 会话管理API

### app/api/session.py

```python
# app/api/session.py
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
    """
    创建视频处理会话
    
    - **videoUrl**: 视频URL（YouTube/Bilibili/TikTok）
    - **language**: 编程语言（默认python）
    """
    # 1. 验证URL格式
    video_url = str(request.videoUrl)
    if not VideoProcessor.is_valid_url(video_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": ErrorCode.INVALID_VIDEO_URL,
                "message": get_error_message(ErrorCode.INVALID_VIDEO_URL)
            }
        )
    
    # 2. 识别视频平台
    platform = VideoProcessor.get_platform(video_url)
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": ErrorCode.UNSUPPORTED_PLATFORM,
                "message": get_error_message(ErrorCode.UNSUPPORTED_PLATFORM)
            }
        )
    
    # 3. 创建会话记录
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
    
    # 4. 返回响应
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
    """
    获取会话详情
    
    - **session_id**: 会话ID（UUID）
    """
    # 1. 查询会话
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
    
    # 2. 构建响应
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


@router.delete(
    "/session/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除会话",
    description="删除指定会话（可选功能）"
)
async def delete_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    删除会话
    
    - **session_id**: 会话ID
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_SESSION_ID", "message": "Invalid session ID"}
        )
    
    session = db.query(models.Session).filter(
        models.Session.id == session_uuid
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "SESSION_NOT_FOUND", "message": "Session not found"}
        )
    
    db.delete(session)
    db.commit()
    
    return None
```

## 2. SSE流式推送API

### app/api/stream.py

```python
# app/api/stream.py
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
    """
    SSE流式推送端点
    
    事件类型：
    - thought: AI思考过程
    - subtitle: 字幕提取完成
    - code: 代码片段（流式）
    - code_done: 代码生成完成
    - timeline: 时间轴映射
    - done: 全部完成
    - error: 错误信息
    """
    
    # 1. 验证会话ID
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    # 2. 查询会话
    session = db.query(models.Session).filter(
        models.Session.id == session_uuid
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 3. 定义事件生成器
    async def event_generator():
        try:
            # 更新状态为processing
            session.status = models.SessionStatus.PROCESSING
            db.commit()
            
            # === Step 1: 验证URL ===
            yield sse_event("thought", {"content": "正在验证视频URL..."})
            
            if not VideoProcessor.is_valid_url(session.video_url):
                raise Exception(get_error_message(ErrorCode.INVALID_VIDEO_URL))
            
            # === Step 2: 提取字幕 ===
            yield sse_event("thought", {"content": "正在提取字幕，请稍候..."})
            
            # 检查缓存
            cache_key = CacheKeys.video_subtitle(session.video_url)
            subtitle_data = None
            
            if settings.ENABLE_CACHE:
                subtitle_data = Cache.get(cache_key)
                if subtitle_data:
                    logger.info(f"Using cached subtitle for {session.video_url}")
            
            # 如果没有缓存，调用API
            if not subtitle_data:
                try:
                    subtitle_data = await bibigpt_service.get_subtitle(session.video_url)
                    
                    # 缓存字幕数据
                    if settings.ENABLE_CACHE:
                        Cache.set(cache_key, subtitle_data, ttl=settings.VIDEO_CACHE_TTL)
                    
                except Exception as e:
                    logger.error(f"BibiGPT API error: {e}")
                    raise Exception(get_error_message(ErrorCode.BIBIGPT_API_ERROR))
            
            # 验证视频时长
            duration = subtitle_data.get("duration", 0)
            if not VideoProcessor.validate_duration(duration, settings.MAX_VIDEO_DURATION):
                raise Exception(get_error_message(ErrorCode.VIDEO_TOO_LONG))
            
            # 推送字幕数据
            yield sse_event("subtitle", subtitle_data)
            
            # 保存字幕到数据库
            session.subtitles = subtitle_data
            session.video_info = {
                "title": subtitle_data.get("title"),
                "duration": subtitle_data.get("duration"),
                "thumbnail": subtitle_data.get("thumbnail"),
                "author": subtitle_data.get("author")
            }
            db.commit()
            
            # === Step 3: 生成代码（流式）===
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
            
            # 保存代码
            session.generated_code = full_code
            db.commit()
            
            # === Step 4: 生成时间轴映射 ===
            yield sse_event("thought", {"content": "正在生成时间轴映射..."})
            
            try:
                timeline = await timeline_service.generate_timeline(subtitle_data, full_code)
            except Exception as e:
                logger.warning(f"Timeline generation failed: {e}")
                # 使用默认时间轴
                timeline = {
                    "segments": [{
                        "startTime": 0,
                        "endTime": duration,
                        "description": "完整内容",
                        "codeLines": None
                    }]
                }
            
            yield sse_event("timeline", timeline)
            
            # 保存时间轴
            session.timeline = timeline
            db.commit()
            
            # === Step 5: 完成 ===
            session.status = models.SessionStatus.COMPLETED
            db.commit()
            
            yield sse_event("done", {})
            
            logger.info(f"Session {session_id} completed successfully")
            
        except Exception as e:
            # 错误处理
            error_message = str(e)
            logger.error(f"Session {session_id} error: {error_message}")
            
            # 更新数据库状态
            session.status = models.SessionStatus.ERROR
            session.error_message = error_message
            db.commit()
            
            # 推送错误事件
            yield sse_event("error", {
                "code": "PROCESSING_ERROR",
                "message": error_message
            })
    
    # 4. 返回SSE响应
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
            "Connection": "keep-alive",
        }
    )
```

## 3. FastAPI主应用

### app/main.py

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api import session, stream
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 获取配置
settings = get_settings()

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Mora Video-to-Code Backend API",
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,  # 生产环境关闭文档
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 注册路由
app.include_router(session.router, prefix="/api", tags=["Session"])
app.include_router(stream.router, prefix="/api", tags=["Stream"])


# 根路径
@app.get("/", tags=["Root"])
async def root():
    """API根路径"""
    return {
        "message": "Mora Backend API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "disabled"
    }


# 健康检查
@app.get("/health", tags=["Health"])
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "version": settings.VERSION
    }


# 启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时执行"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")


# 关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    logger.info("Shutting down application")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
```

## 4. API测试

### 测试用例

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    """测试根路径"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check():
    """测试健康检查"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_session_valid_url():
    """测试创建会话 - 有效URL"""
    response = client.post(
        "/api/session",
        json={
            "videoUrl": "https://www.youtube.com/watch?v=test123",
            "language": "python"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "sessionId" in data
    assert data["status"] == "created"


def test_create_session_invalid_url():
    """测试创建会话 - 无效URL"""
    response = client.post(
        "/api/session",
        json={
            "videoUrl": "https://invalid-platform.com/video",
            "language": "python"
        }
    )
    assert response.status_code == 400
    assert "error" in response.json()


def test_get_session_not_found():
    """测试获取不存在的会话"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/session/{fake_id}")
    assert response.status_code == 404


def test_get_session_invalid_id():
    """测试无效的会话ID"""
    response = client.get("/api/session/invalid-uuid")
    assert response.status_code == 400
```

### 手动测试

```bash
# 1. 创建会话
curl -X POST http://localhost:8000/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.youtube.com/watch?v=xxx",
    "language": "python"
  }'

# 2. 查询会话
curl http://localhost:8000/api/session/{sessionId}

# 3. SSE流式推送（浏览器或curl）
curl -N http://localhost:8000/api/session/{sessionId}/stream
```

## 5. API响应示例

### 创建会话成功

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "videoUrl": "https://www.youtube.com/watch?v=xxx",
  "status": "created",
  "createdAt": "2026-01-01T05:39:00.123456Z"
}
```

### 获取会话详情

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "videoUrl": "https://www.youtube.com/watch?v=xxx",
  "status": "completed",
  "videoInfo": {
    "title": "Python Tutorial for Beginners",
    "duration": 1234,
    "thumbnail": "https://img.youtube.com/vi/xxx/maxresdefault.jpg",
    "author": "TechChannel"
  },
  "generatedCode": "import requests\n\ndef main():\n    pass\n\nif __name__ == '__main__':\n    main()",
  "timeline": {
    "segments": [
      {
        "startTime": 0,
        "endTime": 30,
        "description": "课程介绍",
        "codeLines": null
      },
      {
        "startTime": 30,
        "endTime": 120,
        "description": "导入库",
        "codeLines": "1-5"
      }
    ]
  },
  "error": null,
  "createdAt": "2026-01-01T05:39:00Z",
  "updatedAt": "2026-01-01T05:42:15Z"
}
```

### SSE流事件示例

```
event: thought
data: {"content": "正在验证视频URL..."}

event: thought
data: {"content": "正在提取字幕..."}

event: subtitle
data: {"title": "Python Tutorial", "duration": 1234, "subtitles": [...]}

event: thought
data: {"content": "正在生成代码..."}

event: code
data: {"content": "import requests\n"}

event: code
data: {"content": "import json\n"}

event: code_done
data: {}

event: thought
data: {"content": "正在生成时间轴映射..."}

event: timeline
data: {"segments": [...]}

event: done
data: {}
```

### 错误响应

```json
{
  "error": "INVALID_VIDEO_URL",
  "message": "视频URL不支持，请使用YouTube/Bilibili/TikTok链接"
}
```

## 6. 性能优化

### 6.1 添加请求限流

```python
# 安装
pip install slowapi

# app/main.py 中添加
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 在路由中使用
@router.post("/session")
@limiter.limit("10/minute")
async def create_session(...):
    ...
```

### 6.2 添加响应缓存

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

# 初始化
@app.on_event("startup")
async def startup():
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")

# 使用
@router.get("/session/{session_id}")
@cache(expire=60)
async def get_session(...):
    ...
```

## 7. 监控和日志

### 7.1 添加请求日志中间件

```python
# app/main.py
import time
from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.2f}s "
        f"with status {response.status_code}"
    )
    
    return response
```

### 7.2 集成Sentry（可选）

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    environment="production"
)
```
