// API 客户端 - 与后端 API 交互

const API_BASE = "http://localhost:8000";

// 创建 Session
export interface CreateSessionResponse {
  sessionId: string;
  status: string;
  videoUrl: string;
}

export async function createSession(videoUrl: string): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_BASE}/api/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoUrl }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

// SSE 事件类型
export type SSEEventType = "thought" | "video" | "code" | "execution" | "done" | "error";

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
}

// SSE 事件回调
export interface SSECallbacks {
  onThought?: (content: string) => void;
  onVideo?: (data: { title: string; author: string; duration: string }) => void;
  onCode?: (data: { content: string; language: string }) => void;
  onExecution?: (data: { status: string; output: string; error: string }) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

// 连接 SSE 流
export function connectSSE(sessionId: string, callbacks: SSECallbacks): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/session/${sessionId}/stream`);

  eventSource.addEventListener("thought", (e) => {
    const data = JSON.parse(e.data);
    callbacks.onThought?.(data.content);
  });

  eventSource.addEventListener("video", (e) => {
    const data = JSON.parse(e.data);
    callbacks.onVideo?.(data);
  });

  eventSource.addEventListener("code", (e) => {
    const data = JSON.parse(e.data);
    callbacks.onCode?.(data);
  });

  eventSource.addEventListener("execution", (e) => {
    const data = JSON.parse(e.data);
    callbacks.onExecution?.(data);
  });

  eventSource.addEventListener("done", () => {
    callbacks.onDone?.();
    eventSource.close();
  });

  eventSource.addEventListener("error", (e) => {
    if (e instanceof MessageEvent) {
      const data = JSON.parse(e.data);
      callbacks.onError?.(data.message);
    }
    eventSource.close();
  });

  // 返回关闭函数
  return () => eventSource.close();
}
