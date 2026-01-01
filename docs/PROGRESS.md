# Mora 开发进度记录

## 当前状态：Recent Projects UI 优化完成 ✅

---

## 一、已完成的工作

### 1.1 后端核心模块 ✅

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| Video Processor | `backend/video_processor.py` | ✅ | BibiGPT API 集成 |
| Code Generator | `backend/code_generator.py` | ✅ | 智谱 GLM API 集成 |
| Sandbox Executor | `backend/sandbox_executor.py` | ✅ | E2B Sandbox 集成 |
| API Server | `backend/api_server.py` | ✅ | FastAPI + SSE |
| Session Manager | `backend/session_manager.py` | ✅ | 状态管理 |
| Research Service | `backend/research_service.py` | ✅ | 知识图谱生成、节点对话 |
| Database | `backend/database.py` | ✅ | Supabase PostgreSQL |
| Pipeline Test | `backend/test_pipeline.py` | ✅ | 端到端测试 |

### 1.2 前端页面 ✅

| 文件 | 说明 | 状态 |
|------|------|------|
| `client/src/pages/Home.tsx` | 首页 + 功能选择 | ✅ |
| `client/src/pages/Workspace.tsx` | Video to Code 工作区 | ✅ |
| `client/src/pages/Research.tsx` | Deep Research 知识图谱 | ✅ |
| `client/src/App.tsx` | 路由配置 | ✅ |

### 1.3 数据库 ✅

| 项目 | 说明 |
|------|------|
| 平台 | Supabase (PostgreSQL) |
| 表结构 | `docs/database-schema.sql` |
| Project URL | `https://lzuazgurngxmxtkpckxe.supabase.co` |

### 1.4 文档 ✅

| 文档 | 路径 |
|------|------|
| README | `README.md` |
| 开发指南 | `docs/DEVELOPMENT.md` |
| PRD - Deep Research | `docs/PRD-DeepResearch.md` |
| UI 设计文档 | `docs/UI-REDESIGN.md` |
| 数据库 Schema | `docs/database-schema.sql` |
| 进度记录 | `docs/PROGRESS.md` |

---

## 二、更新日志

### 2026-01-01

#### 更新 10: Recent Projects UI 视觉优化
- **文件**: `client/src/pages/Home.tsx`
- **改进**:
  - 项目卡片使用 Unsplash 真实图片作为背景
  - 添加渐变遮罩效果（Video to Code: 蓝紫色，Deep Research: 绿色）
  - 项目类型标签（Video/Research）
  - 悬停时图片放大动画
  - 删除按钮悬停显示
- **参考**: `Video Conversion App Design/src/components/HomePage.tsx` 的 showcase gallery

#### 更新 9: LLM Prompt 优化 - AI 产品识别
- **文件**: `backend/research_service.py`
- **改进**:
  - 添加 AI 产品/公司对照表（GPT, Claude, Gemini, Kimi, Manus, DeepSeek, Qwen 等）
  - Manus 正确标注为"独立 AI Agent 公司"（不是智谱产品）
  - Kimi 正确标注为"月之暗面的 AI 助手"（不是汽车）
  - Gemini 正确标注为"Google DeepMind 的 AI 模型"（不是加密货币交易所）
- **注意**: 需要重启后端才能生效

#### 更新 8: Supabase 数据库集成
- **文件**: 
  - `backend/database.py` - Supabase 客户端和 CRUD 操作
  - `backend/api_server.py` - 添加项目 API 端点
  - `backend/requirements.txt` - 添加 supabase 依赖
  - `docs/database-schema.sql` - 数据库表结构
- **API 端点**:
  - `GET /api/projects` - 获取项目列表
  - `GET /api/projects/{id}` - 获取单个项目
  - `POST /api/projects` - 创建项目
  - `DELETE /api/projects/{id}` - 删除项目
- **数据库表**: `projects` - 存储用户项目（Video to Code / Deep Research）

#### 更新 7: Deep Research 缓存
- **文件**: `client/src/pages/Research.tsx`
- **功能**: 使用 sessionStorage 缓存知识图谱数据
- **效果**: 从 Workspace 返回时不重新加载

#### 更新 6: Workspace 返回按钮修复
- **文件**: `client/src/pages/Workspace.tsx`
- **修复**: 返回按钮从 `setLocation("/")` 改为 `window.history.back()`
- **效果**: 从 Deep Research 跳转到 Workspace 后，返回会回到 Research 页面

#### 更新 5: Deep Research 功能完整实现
- **文件**: 
  - `client/src/pages/Research.tsx` - 知识图谱页面（@antv/g6）
  - `backend/research_service.py` - LLM 服务
  - `backend/api_server.py` - API 端点
- **功能**:
  - 输入关键词 → LLM 生成知识图谱
  - 点击节点 → 显示详情面板（fixed 定位）
  - 与节点对话 → LLM 角色扮演
  - 点击视频 → 跳转到 Video to Code
- **Prompt 优化**: 添加 AI/技术领域上下文，避免歧义（如 Gemini）

#### 更新 4: BibiGPT API Key 更新
- **文件**: `backend/video_processor.py`

#### 更新 3: 视频播放器嵌入
- **文件**: `client/src/pages/Workspace.tsx`
- **支持**: B站、YouTube iframe 嵌入

#### 更新 2: 后端日志系统
- **文件**: `backend/api_server.py`
- **格式**: `HH:MM:SS [LEVEL] [session_id] message`

#### 更新 1: 代码生成 Prompt 优化
- **文件**: `backend/code_generator.py`

---

## 三、配置信息

### API Keys
```bash
# backend/.env
BIBIGPT_API_KEY=Yg8XSbFg9bjm
ZHIPU_API_KEY=f9905f5fb666420eaeb852feea554065.BjTiMGXjCaeipExE
E2B_API_KEY=e2b_ef74fea3d74873ba65ea43b97caf9cd20e9bb9fe
SUPABASE_URL=https://lzuazgurngxmxtkpckxe.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 数据库
- **平台**: Supabase
- **Project ID**: lzuazgurngxmxtkpckxe
- **表**: projects

---

## 四、快速启动

```bash
# 安装依赖
pnpm install
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt

# 启动后端
.venv/bin/uvicorn backend.api_server:app --port 8000

# 启动前端
pnpm dev
```

访问 http://localhost:3000

---

## 五、下一步计划

### 已完成
- [x] 前端 Home.tsx 集成真实 Recent Projects
- [x] 项目卡片视觉优化（真实图片 + 渐变遮罩）
- [x] LLM Prompt 优化（AI 产品识别）

### P1 功能
- [ ] 项目自动保存（Video to Code / Deep Research 完成后保存）
- [ ] 用户认证（Supabase Auth）
- [ ] Deep Research 视频搜索 API

### P2 功能
- [ ] 代码编辑器
- [ ] 分享功能
- [ ] 部署到生产环境

---

*最后更新：2026-01-01*
