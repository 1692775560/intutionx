# Mora - Video to Code

> AI-powered tool that extracts executable code from programming tutorial videos.

## 🎯 What is Mora?

Mora watches your coding tutorial videos and automatically generates production-ready code. Simply paste a video URL, and Mora will:

1. Extract subtitles/transcripts from the video
2. Analyze the content using LLM
3. Generate executable code
4. Run the code in a sandbox and show results

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- pnpm

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd mora_hackathon_ui

# Install frontend dependencies
pnpm install

# Setup Python environment
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
```

### Configuration

Create `backend/.env` file (or use existing):

```env
# BibiGPT - Video subtitle extraction
BIBIGPT_API_KEY=your_bibigpt_key

# Zhipu GLM - Code generation
ZHIPU_API_KEY=your_zhipu_key

# E2B - Code execution sandbox
E2B_API_KEY=your_e2b_key
```

### Running

```bash
# Terminal 1: Start backend
.venv/bin/uvicorn backend.api_server:app --port 8000

# Terminal 2: Start frontend
pnpm dev
```

Open http://localhost:3000 in your browser.

## 📁 Project Structure

```
mora_hackathon_ui/
├── backend/                    # Python backend
│   ├── api_server.py          # FastAPI server (HTTP + SSE)
│   ├── session_manager.py     # Session state management
│   ├── video_processor.py     # BibiGPT integration
│   ├── code_generator.py      # Zhipu GLM integration
│   ├── sandbox_executor.py    # E2B sandbox integration
│   ├── test_pipeline.py       # End-to-end test
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # API keys (not in git)
├── client/                    # React frontend
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx       # Landing page
│       │   └── Workspace.tsx  # Main workspace
│       └── lib/
│           └── api.ts         # API client
├── docs/                      # Documentation
│   ├── PRD.md                 # Product requirements
│   ├── PROGRESS.md            # Development progress
│   └── modules/               # Module docs
│       ├── video-processor.md
│       ├── code-generator.md
│       ├── sandbox-executor.md
│       ├── api-server.md
│       └── frontend-integration.md
└── README.md                  # This file
```

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite + Tailwind |
| Backend | Python + FastAPI + Uvicorn |
| Video Processing | BibiGPT API |
| Code Generation | Zhipu GLM-4-flash |
| Code Execution | E2B Sandbox |
| Real-time Updates | Server-Sent Events (SSE) |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session` | Create a new task |
| GET | `/api/session/{id}` | Get task status |
| GET | `/api/session/{id}/stream` | SSE stream for real-time updates |

### SSE Events

| Event | Data | Description |
|-------|------|-------------|
| `thought` | `{content}` | Agent thinking process |
| `video` | `{title, author, duration}` | Video metadata |
| `code` | `{content, language}` | Generated code |
| `execution` | `{status, output, error}` | Execution result |
| `done` | `{}` | Task completed |
| `error` | `{message}` | Error occurred |

## 🎬 Supported Platforms

| Platform | Subtitle Extraction | Video Embed |
|----------|-------------------|-------------|
| Bilibili | ✅ | ✅ iframe |
| Douyin | ✅ | ❌ (link only) |
| YouTube | ✅ | ✅ iframe |
| Others | Depends on BibiGPT | ❌ (link only) |

## 🧪 Testing

```bash
# Test backend pipeline
.venv/bin/python backend/test_pipeline.py

# Test API manually
curl -X POST http://localhost:8000/api/session \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.bilibili.com/video/BV1xs411Q799"}'
```

## 📖 Documentation

- [PRD](docs/PRD.md) - Product requirements document
- [Progress](docs/PROGRESS.md) - Development progress and changelog
- [Video Processor](docs/modules/video-processor.md) - BibiGPT integration
- [Code Generator](docs/modules/code-generator.md) - Zhipu GLM integration
- [Sandbox Executor](docs/modules/sandbox-executor.md) - E2B integration
- [API Server](docs/modules/api-server.md) - FastAPI server docs
- [Frontend Integration](docs/modules/frontend-integration.md) - React frontend docs

## 🤝 Contributing

1. Read the docs in `docs/` folder first
2. Check `docs/PROGRESS.md` for current status
3. Create a branch for your feature
4. Submit a PR

## 📝 License

MIT
