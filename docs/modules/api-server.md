# API Server 模块文档

## 一、模块概述

### 1.1 模块职责
API Server 负责将后端核心模块封装成 HTTP API，供前端调用：
- 提供 RESTful API 接口
- 支持 SSE 流式推送
- 管理 Session 生命周期

### 1.2 技术选型
- **框架**：FastAPI（高性能，原生支持异步和 SSE）
- **服务器**：Uvicorn
- **数据存储**：内存（P0 阶段，后续可换 Redis）

---

## 二、API 设计

### 2.1 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/session` | 创建任务 |
| GET | `/api/session/{id}` | 获取任务状态 |
| GET | `/api/session/{id}/stream` | SSE 流式推送 |

### 2.2 创建任务

**请求**
```http
POST /api/session
Content-Type: application/json

{
  "videoUrl": "https://www.bilibili.com/video/BV1xxx"
}
```

**响应**
```json
{
  "sessionId": "abc123",
  "status": "created",
  "videoUrl": "https://www.bilibili.com/video/BV1xxx"
}
```

### 2.3 获取任务状态

**请求**
```http
GET /api/session/{sessionId}
```

**响应**
```json
{
  "sessionId": "abc123",
  "status": "processing",  // created | processing | completed | error
  "videoUrl": "https://...",
  "video": {
    "title": "视频标题",
    "author": "作者",
    "duration": 120
  },
  "code": "生成的代码...",
  "language": "python",
  "execution": {
    "status": "success",
    "output": "执行输出..."
  },
  "error": null
}
```

### 2.4 SSE 流式推送

**请求**
```http
GET /api/session/{sessionId}/stream
Accept: text/event-stream
```

**事件类型**

| 事件 | 数据结构 | 说明 |
|------|---------|------|
| `thought` | `{"content": "..."}` | Agent 思考日志 |
| `video` | `{"title": "...", "author": "...", "duration": 0}` | 视频信息 |
| `code` | `{"content": "...", "language": "..."}` | 生成的代码 |
| `execution` | `{"status": "...", "output": "..."}` | 执行结果 |
| `error` | `{"message": "..."}` | 错误信息 |
| `done` | `{}` | 流程完成 |

**SSE 格式示例**
```
event: thought
data: {"content": "正在获取视频字幕..."}

event: thought
data: {"content": "字幕获取成功，共 5000 字符"}

event: video
data: {"title": "Python教程", "author": "xxx", "duration": 120}

event: thought
data: {"content": "正在生成代码..."}

event: code
data: {"content": "def hello():\n    print('Hello')", "language": "python"}

event: thought
data: {"content": "正在执行代码..."}

event: execution
data: {"status": "success", "output": "Hello"}

event: done
data: {}
```

---

## 三、Session 状态机

```
created → processing → completed
              ↓
            error
```

| 状态 | 说明 |
|------|------|
| created | 任务已创建，等待处理 |
| processing | 正在处理中 |
| completed | 处理完成 |
| error | 处理失败 |

---

## 四、实现代码

### 4.1 目录结构

```
backend/
├── api_server.py       # API 服务主文件
├── session_manager.py  # Session 管理
├── video_processor.py  # 视频处理模块
├── code_generator.py   # 代码生成模块
├── sandbox_executor.py # 代码执行模块
└── requirements.txt    # 依赖
```

### 4.2 依赖

```
fastapi
uvicorn[standard]
httpx
e2b-code-interpreter
python-dotenv
```

---

## 五、运行说明

### 5.1 启动服务

```bash
cd mora_hackathon_ui
.venv/bin/uvicorn backend.api_server:app --reload --port 8000
```

### 5.2 测试 API

```bash
# 创建任务
curl -X POST http://localhost:8000/api/session \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.bilibili.com/video/BV1xs411Q799"}'

# 获取状态
curl http://localhost:8000/api/session/{sessionId}

# SSE 流式
curl http://localhost:8000/api/session/{sessionId}/stream
```

---

## 六、日志系统

API Server 在终端输出详细的处理日志，便于调试和监控。

### 6.1 日志格式

```
HH:MM:SS [LEVEL] [session_id] message
```

### 6.2 日志示例

```
08:31:29 [INFO] ========== 新任务创建 ==========
08:31:29 [INFO] Session ID: 5d1e4449
08:31:29 [INFO] Video URL: https://www.bilibili.com/video/BV1xs411Q799
08:31:29 [INFO] [5d1e4449] 开始处理任务...
08:31:29 [INFO] [5d1e4449] Step 1: 视频处理
08:31:29 [INFO] [5d1e4449]   → 调用 BibiGPT API 获取字幕...
08:31:33 [INFO] [5d1e4449]   ✓ 视频标题: Python教程
08:31:33 [INFO] [5d1e4449]   ✓ 视频作者: xxx
08:31:33 [INFO] [5d1e4449]   ✓ 字幕长度: 5512 字符
08:31:33 [INFO] [5d1e4449] Step 2: 代码生成
08:31:33 [INFO] [5d1e4449]   → 调用智谱 GLM API 生成代码...
08:31:38 [INFO] [5d1e4449]   ✓ 生成语言: python
08:31:38 [INFO] [5d1e4449]   ✓ 代码长度: 989 字符
08:31:38 [INFO] [5d1e4449]   ✓ Token 消耗: 2653
08:31:38 [INFO] [5d1e4449] Step 3: 代码执行
08:31:38 [INFO] [5d1e4449]   → 调用 E2B Sandbox 执行代码...
08:31:41 [INFO] [5d1e4449]   ✓ 执行成功，耗时 2332ms
08:31:41 [INFO] [5d1e4449] ========== 任务完成 ==========
```

### 6.3 错误日志

```
08:31:33 [ERROR] [5d1e4449]   ✗ 视频处理失败: BibiGPT API error: 500
08:31:33 [ERROR] [5d1e4449] ========== 任务失败 ==========
08:31:33 [ERROR] [5d1e4449] 错误: 视频处理失败: BibiGPT API error: 500
```

---

## 七、CORS 配置

允许前端跨域访问：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需要限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

*文档版本：v1.1*
*最后更新：2026-01-01*
*更新内容：添加日志系统说明*
