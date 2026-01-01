# 开发指南

## 环境搭建

### 1. 克隆项目

```bash
git clone <repo-url>
cd mora_hackathon_ui
```

### 2. 前端环境

```bash
# 安装 pnpm (如果没有)
npm install -g pnpm

# 安装依赖
pnpm install
```

### 3. 后端环境

```bash
# 创建虚拟环境
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# 安装依赖
pip install -r backend/requirements.txt
```

### 4. 配置 API Keys

编辑 `backend/.env`:

```env
BIBIGPT_API_KEY=xxx      # BibiGPT 字幕提取
ZHIPU_API_KEY=xxx        # 智谱 GLM 代码生成
E2B_API_KEY=xxx          # E2B 代码执行沙盒
```

## 启动服务

### 开发模式

```bash
# 终端 1: 后端
.venv/bin/uvicorn backend.api_server:app --reload --port 8000

# 终端 2: 前端
pnpm dev
```

### 访问

- 前端: http://localhost:3000
- 后端: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────┐    ┌───────────┐    ┌─────────────────────┐   │
│  │ Home.tsx│───▶│ api.ts    │───▶│ Workspace.tsx       │   │
│  │         │    │ (SSE)     │    │ - Video Player      │   │
│  └─────────┘    └───────────┘    │ - Thought Process   │   │
│                                   │ - Generated Code    │   │
│                                   │ - Execution Result  │   │
│                                   └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP + SSE
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────────┐                                        │
│  │ api_server.py   │ FastAPI + SSE                          │
│  └────────┬────────┘                                        │
│           │                                                  │
│  ┌────────▼────────┐                                        │
│  │session_manager  │ Session 状态管理                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│  ┌────────▼────────────────────────────────────────────┐   │
│  │              Processing Pipeline                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │video_processor│─▶│code_generator│─▶│sandbox_exec│ │   │
│  │  │  (BibiGPT)   │  │  (Zhipu GLM) │  │   (E2B)    │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 数据流

```
1. 用户输入视频 URL
   │
2. POST /api/session 创建任务
   │
3. 返回 sessionId，跳转到 /workspace?session={id}
   │
4. 前端连接 SSE: GET /api/session/{id}/stream
   │
5. 后端开始处理:
   │
   ├─▶ Step 1: video_processor.py
   │   └─▶ 调用 BibiGPT API 获取字幕
   │   └─▶ SSE: thought, video
   │
   ├─▶ Step 2: code_generator.py
   │   └─▶ 调用智谱 GLM API 生成代码
   │   └─▶ SSE: thought, code
   │
   └─▶ Step 3: sandbox_executor.py
       └─▶ 调用 E2B API 执行代码
       └─▶ SSE: thought, execution, done
```

## 模块说明

### video_processor.py

- 调用 BibiGPT API 获取视频字幕
- 支持 B站、抖音、YouTube 等平台
- 返回视频元信息和完整字幕文本

### code_generator.py

- 调用智谱 GLM-4-flash API
- 分析字幕内容，生成可执行代码
- Prompt 约束：生成可在 Linux 沙盒独立运行的代码

### sandbox_executor.py

- 调用 E2B Code Interpreter API
- 在安全沙盒中执行生成的代码
- 返回执行输出或错误信息

### api_server.py

- FastAPI 服务
- 提供 RESTful API 和 SSE 流
- 详细的终端日志输出

### session_manager.py

- 管理任务状态
- 内存存储（P0 阶段）
- 支持事件队列用于 SSE

## 调试

### 后端日志

后端会在终端输出详细日志：

```
08:31:29 [INFO] ========== 新任务创建 ==========
08:31:29 [INFO] Session ID: 5d1e4449
08:31:29 [INFO] Video URL: https://...
08:31:29 [INFO] [5d1e4449] Step 1: 视频处理
08:31:29 [INFO] [5d1e4449]   → 调用 BibiGPT API...
08:31:33 [INFO] [5d1e4449]   ✓ 视频标题: xxx
...
```

### 前端日志

打开浏览器 DevTools Console 查看 SSE 事件：

```
[SSE] thought: 正在获取视频信息...
[SSE] video: {title: "xxx", author: "xxx", duration: 120}
[SSE] code: python 500 chars
[SSE] execution: {status: "success", output: "..."}
[SSE] done
```

### 测试 API

```bash
# 健康检查
curl http://localhost:8000/

# 创建任务
curl -X POST http://localhost:8000/api/session \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.bilibili.com/video/BV1xs411Q799"}'

# SSE 流
curl -N http://localhost:8000/api/session/{sessionId}/stream
```

## 常见问题

### BibiGPT API 返回 402

API 余额不足，需要充值或更换 API key。

### BibiGPT API 返回 500

可能是视频 URL 格式问题，尝试简化 URL（去掉多余参数）。

### 抖音视频无法嵌入播放

抖音禁止 iframe 嵌入，这是平台限制。点击"打开原视频"在新窗口观看。

### 代码执行失败

检查生成的代码是否依赖外部文件或需要用户输入。Prompt 已优化，但 LLM 可能仍会生成不合适的代码。

## 下一步开发

参考 `docs/PROGRESS.md` 查看当前进度和待办事项。
