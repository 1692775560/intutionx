const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CreateSessionRequest {
  videoUrl: string;
  language?: string;
}

export interface SessionResponse {
  sessionId: string;
  videoUrl: string;
  status: 'created' | 'processing' | 'completed' | 'error';
  videoInfo?: {
    title: string;
    duration: number;
    thumbnail: string;
  };
  generatedCode?: string;
  timeline?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  async createSession(request: CreateSessionRequest): Promise<SessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create session');
    }

    return response.json();
  },

  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`);

    if (!response.ok) {
      throw new Error('Session not found');
    }

    return response.json();
  },
};
