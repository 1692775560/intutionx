export type SessionStatus = 'created' | 'processing' | 'completed' | 'error';

export interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  author?: string;
}

export interface Session {
  sessionId: string;
  videoUrl: string;
  status: SessionStatus;
  videoInfo?: VideoInfo;
  generatedCode?: string;
  timeline?: Timeline;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Timeline {
  segments: TimelineSegment[];
}

export interface TimelineSegment {
  startTime: number;
  endTime: number;
  description: string;
  codeLines: string | null;
  code?: string;
}
