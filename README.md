# Mora - Video to Code Platform

AI-powered platform that converts educational videos into executable code with real-time synchronization.

## 🚀 Project Structure

```
intutionx/
├── backend/          # FastAPI Backend
│   ├── app/         # Application code
│   ├── alembic/     # Database migrations
│   └── requirements.txt
└── frontend/        # React Frontend
    ├── src/
    └── package.json
```

## 📦 Backend

**Stack**: FastAPI, PostgreSQL, Redis, SQLAlchemy

**Features**:
- BibiGPT video subtitle extraction
- DeepSeek AI code generation
- SSE streaming for real-time updates
- PostgreSQL session persistence
- Redis caching

**Quick Start**:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 🎨 Frontend

**Stack**: React 18, TypeScript, Vite, TailwindCSS

**Features**:
- Monaco code editor
- Pyodide Python runtime in browser
- Real-time code streaming via SSE
- Video-code synchronization
- Modern UI with shadcn/ui

**Quick Start**:
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Environment Variables

**Backend** (.env):
```
DATABASE_URL=postgresql://user@localhost:5432/mora
REDIS_URL=redis://localhost:6379/0
BIBIGPT_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
```

**Frontend** (.env):
```
VITE_API_URL=http://localhost:8000
```

## 📚 Documentation

- [Backend README](./backend/README.md)
- [Frontend Configuration](./frontend/前端配置说明.md)
- [Quick Start Guide](./backend/快速启动.md)

## 🎯 Key Features

1. **Video to Code**: Convert educational videos into executable Python code
2. **Real-time Streaming**: See code generation happen in real-time
3. **Video Synchronization**: Code highlights as video plays
4. **Browser Python**: Run Python code directly in the browser
5. **AI-Powered**: BibiGPT + DeepSeek for intelligent processing

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Monaco Editor, Pyodide
- **Backend**: FastAPI, PostgreSQL, Redis, SQLAlchemy
- **AI**: BibiGPT (subtitles), DeepSeek (code generation)
- **Infrastructure**: Alembic, Uvicorn, SSE

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.
