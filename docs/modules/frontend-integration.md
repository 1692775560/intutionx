# 前端集成模块文档

## 概述

前端通过 API 客户端与后端交互，使用 SSE (Server-Sent Events) 实现实时数据流。

---

## 文件结构

```
client/src/
├── lib/
│   └── api.ts          # API 客户端
└── pages/
    ├── Home.tsx        # 首页（输入 URL + 选择功能）
    └── Workspace.tsx   # 工作区（实时显示处理结果）
```

---

## API 客户端 (api.ts)

### createSession

创建处理任务。

```typescript
const response = await createSession(videoUrl);
// response: { sessionId, status, videoUrl }
```

### connectSSE

连接 SSE 流，接收实时事件。

```typescript
const disconnect = connectSSE(sessionId, {
  onThought: (content) => { /* 思考过程 */ },
  onVideo: (data) => { /* 视频信息 */ },
  onCode: (data) => { /* 生成的代码 */ },
  onExecution: (data) => { /* 执行结果 */ },
  onDone: () => { /* 完成 */ },
  onError: (message) => { /* 错误 */ },
});

// 组件卸载时断开连接
return () => disconnect();
```

---

## 页面流程

### Home.tsx

1. 用户输入视频 URL
2. 选择功能按钮（目前只有 "Video to Code" 可用）
3. 点击 Start 调用 `createSession()`
4. 成功后跳转到 `/workspace?session={sessionId}`

### Workspace.tsx

1. 从 URL 获取 `sessionId`
2. 调用 `connectSSE()` 连接 SSE 流
3. 根据事件类型更新 UI：
   - `thought` → 更新思考日志
   - `video` → 显示视频信息
   - `code` → 显示生成的代码
   - `execution` → 显示执行结果
   - `done` → 标记完成
   - `error` → 显示错误

---

## SSE 事件类型

| 事件 | 数据 | 说明 |
|------|------|------|
| `thought` | `{ content: string }` | Agent 思考过程 |
| `video` | `{ title, author, duration }` | 视频元信息 |
| `code` | `{ content, language }` | 生成的代码 |
| `execution` | `{ status, output, error }` | 执行结果 |
| `done` | `{}` | 处理完成 |
| `error` | `{ message }` | 错误信息 |

---

## 状态管理

Workspace 组件使用以下状态：

```typescript
const [videoInfo, setVideoInfo] = useState(null);      // 视频信息
const [thoughtLog, setThoughtLog] = useState([]);      // 思考日志
const [generatedCode, setGeneratedCode] = useState(""); // 生成的代码
const [codeOutput, setCodeOutput] = useState("");       // 执行输出
const [isProcessing, setIsProcessing] = useState(false); // 处理中状态
```

---

*最后更新：2026-01-01*
