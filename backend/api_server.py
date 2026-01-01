# api_server.py
# FastAPI 服务 - 提供 HTTP API 和 SSE 流式推送

import os
import asyncio
import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

import sys
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# 添加 backend 目录到 Python 路径
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from session_manager import session_manager, SessionStatus, VideoInfo, ExecutionInfo
from video_processor import process_video
from code_generator import generate_code
from sandbox_executor import execute_code

# 加载环境变量
load_dotenv()

# 创建 FastAPI 应用
app = FastAPI(
    title="Mora API",
    description="Video to Code API Service",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需要限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 请求模型
class CreateSessionRequest(BaseModel):
    videoUrl: str


# 响应模型
class CreateSessionResponse(BaseModel):
    sessionId: str
    status: str
    videoUrl: str


@app.get("/")
async def root():
    """健康检查"""
    return {"status": "ok", "service": "Mora API"}


@app.post("/api/session", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """创建任务"""
    session = session_manager.create(request.videoUrl)
    logger.info(f"========== 新任务创建 ==========")
    logger.info(f"Session ID: {session.id}")
    logger.info(f"Video URL: {request.videoUrl}")
    
    # 启动后台处理任务
    asyncio.create_task(process_session(session.id))
    
    return CreateSessionResponse(
        sessionId=session.id,
        status=session.status.value,
        videoUrl=session.video_url
    )


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """获取任务状态"""
    session = session_manager.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session.to_dict()


@app.get("/api/session/{session_id}/stream")
async def stream_session(session_id: str):
    """SSE 流式推送"""
    session = session_manager.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    async def event_generator():
        # 先发送已有的事件
        for event in session.events:
            yield f"event: {event['type']}\ndata: {json.dumps(event['data'], ensure_ascii=False)}\n\n"
        
        # 如果已完成，直接返回
        if session.status in [SessionStatus.COMPLETED, SessionStatus.ERROR]:
            return
        
        # 等待新事件
        while True:
            try:
                event = await asyncio.wait_for(session.event_queue.get(), timeout=60)
                yield f"event: {event['type']}\ndata: {json.dumps(event['data'], ensure_ascii=False)}\n\n"
                
                if event['type'] == 'done' or event['type'] == 'error':
                    break
            except asyncio.TimeoutError:
                # 发送心跳
                yield f": heartbeat\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


async def process_session(session_id: str):
    """后台处理任务"""
    session = session_manager.get(session_id)
    if not session:
        return
    
    session.status = SessionStatus.PROCESSING
    logger.info(f"[{session_id}] 开始处理任务...")
    
    try:
        # Step 1: 处理视频
        logger.info(f"[{session_id}] Step 1: 视频处理")
        logger.info(f"[{session_id}]   → 调用 BibiGPT API 获取字幕...")
        session.add_event("thought", {"content": "正在获取视频信息..."})
        
        video_result = await process_video(session.video_url)
        
        if not video_result.success:
            logger.error(f"[{session_id}]   ✗ 视频处理失败: {video_result.error}")
            raise Exception(f"视频处理失败: {video_result.error}")
        
        session.video = VideoInfo(
            title=video_result.metadata.title,
            author=video_result.metadata.author,
            duration=video_result.metadata.duration,
            cover=video_result.metadata.cover,
        )
        session.transcript = video_result.full_text
        
        logger.info(f"[{session_id}]   ✓ 视频标题: {session.video.title}")
        logger.info(f"[{session_id}]   ✓ 视频作者: {session.video.author}")
        logger.info(f"[{session_id}]   ✓ 字幕长度: {len(session.transcript)} 字符")
        
        session.add_event("thought", {"content": f"视频信息获取成功: {session.video.title}"})
        session.add_event("video", {
            "title": session.video.title,
            "author": session.video.author,
            "duration": session.video.duration,
        })
        session.add_event("thought", {"content": f"字幕提取成功，共 {len(session.transcript)} 字符"})
        
        # Step 2: 生成代码
        logger.info(f"[{session_id}] Step 2: 代码生成")
        logger.info(f"[{session_id}]   → 调用智谱 GLM API 生成代码...")
        session.add_event("thought", {"content": "正在分析视频内容，生成代码..."})
        
        code_result = await generate_code(
            title=session.video.title,
            author=session.video.author,
            transcript=session.transcript
        )
        
        if not code_result.success:
            logger.error(f"[{session_id}]   ✗ 代码生成失败: {code_result.error}")
            raise Exception(f"代码生成失败: {code_result.error}")
        
        session.code = code_result.code
        session.language = code_result.language
        
        logger.info(f"[{session_id}]   ✓ 生成语言: {session.language}")
        logger.info(f"[{session_id}]   ✓ 代码长度: {len(session.code)} 字符")
        logger.info(f"[{session_id}]   ✓ Token 消耗: {code_result.tokens_used}")
        
        session.add_event("thought", {"content": f"代码生成成功，语言: {session.language}"})
        session.add_event("code", {
            "content": session.code,
            "language": session.language,
        })
        
        # Step 3: 执行代码
        logger.info(f"[{session_id}] Step 3: 代码执行")
        logger.info(f"[{session_id}]   → 调用 E2B Sandbox 执行代码...")
        session.add_event("thought", {"content": "正在执行代码..."})
        
        exec_result = execute_code(session.code, session.language)
        
        session.execution = ExecutionInfo(
            status=exec_result.status,
            output=exec_result.output or "",
            error=exec_result.error or "",
        )
        
        if exec_result.success:
            logger.info(f"[{session_id}]   ✓ 执行成功，耗时 {exec_result.execution_time_ms}ms")
            logger.info(f"[{session_id}]   ✓ 输出: {exec_result.output[:200] if exec_result.output else '(无输出)'}...")
            session.add_event("thought", {"content": f"代码执行成功，耗时 {exec_result.execution_time_ms}ms"})
        else:
            logger.warning(f"[{session_id}]   ✗ 执行失败: {exec_result.error}")
            session.add_event("thought", {"content": f"代码执行失败: {exec_result.error}"})
        
        session.add_event("execution", {
            "status": session.execution.status,
            "output": session.execution.output,
            "error": session.execution.error,
        })
        
        # 完成
        session.status = SessionStatus.COMPLETED
        session.add_event("done", {})
        logger.info(f"[{session_id}] ========== 任务完成 ==========")
        
    except Exception as e:
        session.status = SessionStatus.ERROR
        session.error = str(e)
        session.add_event("error", {"message": str(e)})
        logger.error(f"[{session_id}] ========== 任务失败 ==========")
        logger.error(f"[{session_id}] 错误: {str(e)}")


# 启动命令: uvicorn api_server:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
