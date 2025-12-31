import { useState, useEffect } from 'react';

export interface SSEMessage {
  type: 'thought' | 'subtitle' | 'code' | 'code_done' | 'timeline' | 'done' | 'error';
  content?: string;
  data?: any;
}

export function useSSE(sessionId: string | null) {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const eventSource = new EventSource(`${API_URL}/api/session/${sessionId}/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connected');
    };

    eventSource.addEventListener('thought', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev: SSEMessage[]) => [...prev, { type: 'thought', content: data.content }]);
    });

    eventSource.addEventListener('subtitle', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev: SSEMessage[]) => [...prev, { type: 'subtitle', data }]);
    });

    eventSource.addEventListener('code', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev: SSEMessage[]) => [...prev, { type: 'code', content: data.content }]);
    });

    eventSource.addEventListener('code_done', () => {
      setMessages((prev: SSEMessage[]) => [...prev, { type: 'code_done' }]);
    });

    eventSource.addEventListener('timeline', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev: SSEMessage[]) => [...prev, { type: 'timeline', data }]);
    });

    eventSource.addEventListener('done', () => {
      setMessages((prev: SSEMessage[]) => [...prev, { type: 'done' }]);
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.addEventListener('error', (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      setError(data.message);
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.onerror = () => {
      setError('Connection failed');
      eventSource.close();
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  return { messages, isConnected, error };
}
