# Mora Backend API

Mora视频转代码后端服务 - 基于FastAPI构建的RESTful API

## 🚀 快速开始

### 1. 环境要求

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 2. 安装依赖

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置环境变量

`.env` 文件已包含必要配置，包括：
- BibiGPT API Key: `pyUCIr0m4FLU`
- DeepSeek API Key: `sk-ce51524faa084f4c92bbbf32cca843cb`

**如需修改数据库配置**：
```bash
DATABASE_URL=postgresql://用户名:密码@localhost:5432/数据库名
```

### 4. 初始化数据库

```bash
# 方式1: 使用Alembic迁移（推荐）
alembic upgrade head

# 方式2: 直接创建（如果没有安装Alembic）
python -c "from app.database import engine, Base; from app.models import Session; Base.metadata.create_all(engine)"
```

### 5. 启动服务

```bash
# 开发模式（自动重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或使用Python直接运行
python -m app.main
```

**服务地址**：
- API: http://localhost:8000
- 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

---

## 📡 API接口

### 1. 创建会话

```bash
POST /api/session
Content-Type: application/json

{
  "videoUrl": "https://www.youtube.com/watch?v=xxx",
  "language": "python"
}
```

**响应**：
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "videoUrl": "https://www.youtube.com/watch?v=xxx",
  "status": "created",
  "createdAt": "2026-01-01T06:00:00Z"
}
```

### 2. 获取会话状态

```bash
GET /api/session/{sessionId}
```

### 3. SSE流式推送

```bash
GET /api/session/{sessionId}/stream
```

**事件类型**：
- `thought`: AI思考过程
- `subtitle`: 字幕提取完成
- `code`: 代码片段（流式）
- `code_done`: 代码生成完成
- `timeline`: 时间轴映射
- `done`: 全部完成
- `error`: 错误信息

---

## 🗂️ 项目结构

```
mora-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models/              # SQLAlchemy模型
│   │   └── session.py
│   ├── schemas/             # Pydantic schemas
│   │   └── session.py
│   ├── api/                 # API路由
│   │   ├── session.py
│   │   └── stream.py
│   ├── services/            # 业务逻辑
│   │   ├── video_processor.py
│   │   ├── bibigpt_service.py
│   │   ├── deepseek_service.py
│   │   └── timeline_service.py
│   └── utils/               # 工具函数
│       ├── sse.py
│       ├── cache.py
│       └── errors.py
├── alembic/                 # 数据库迁移
│   └── versions/
├── .env                     # 环境变量（已配置）
├── requirements.txt         # Python依赖
└── README.md               # 本文件
```

---

## 🔧 核心功能

### 1. 视频URL验证
支持平台：
- YouTube
- Bilibili
- TikTok

### 2. 字幕提取
- 使用BibiGPT API
- 自动缓存（24小时）
- 支持多语言

### 3. 代码生成
- DeepSeek AI模型
- 流式输出
- Python语法高亮

### 4. 时间轴映射
- 自动分析视频内容
- 映射代码行号
- 精准同步

---

## 🛠️ 开发工具

### 数据库迁移

```bash
# 创建新迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### 测试

```bash
# 运行所有测试
pytest

# 查看覆盖率
pytest --cov=app tests/
```

### 代码格式化

```bash
# 格式化
black app/

# 检查
ruff check app/
```

---

## ⚙️ 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL连接URL | - |
| `REDIS_URL` | Redis连接URL | redis://localhost:6379/0 |
| `BIBIGPT_API_KEY` | BibiGPT API密钥 | - |
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | - |
| `ENABLE_CACHE` | 是否启用缓存 | true |
| `MAX_VIDEO_DURATION` | 最大视频时长（秒） | 7200 |
| `DEBUG` | 调试模式 | False |

---

## 🐛 故障排查

### 1. 数据库连接失败

**问题**：`sqlalchemy.exc.OperationalError`

**解决**：
```bash
# 检查PostgreSQL是否运行
pg_isready

# 检查数据库是否存在
psql -l | grep mora

# 创建数据库
createdb mora
```

### 2. Redis连接失败

**问题**：`redis.exceptions.ConnectionError`

**解决**：
```bash
# 启动Redis
redis-server

# 检查Redis状态
redis-cli ping
```

### 3. API密钥错误

**问题**：401 Unauthorized

**解决**：
检查 `.env` 文件中的API密钥是否正确配置

---

## 📊 性能优化

### 缓存策略

- 视频字幕：24小时
- 会话结果：1小时
- Redis持久化：RDB + AOF

### 并发处理

```bash
# 使用Gunicorn（生产环境）
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

---

## 📝 API密钥信息

**已配置的API密钥**：
- ✅ BibiGPT Token: `pyUCIr0m4FLU`
- ✅ DeepSeek API Key: `sk-ce51524faa084f4c92bbbf32cca843cb`

**安全提示**：
- 不要将 `.env` 文件提交到Git
- 生产环境使用环境变量管理密钥
- 定期轮换API密钥

---

## 📚 相关文档

- [FastAPI官方文档](https://fastapi.tiangolo.com)
- [BibiGPT API文档](https://bibigpt.co)
- [DeepSeek API文档](https://api.deepseek.com)
- [前端项目说明](../Video%20Conversion%20App%20Design/前端配置说明.md)

---

## ✅ 快速检查清单

部署前确认：
- [ ] PostgreSQL已启动
- [ ] Redis已启动
- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] API密钥可用
- [ ] 前端CORS配置正确

---

## 🎉 完成！

后端服务现在已经可以运行了！

启动后端：`uvicorn app.main:app --reload`

访问API文档：http://localhost:8000/docs
