import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Copy, Download, Play, GripVertical, MessageCircle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { connectSSE } from "@/lib/api";

// 从 B站 URL 提取 BV 号
function extractBvid(url: string): string {
  const match = url.match(/BV[\w]+/);
  return match ? match[0] : "";
}

// 从 YouTube URL 提取视频 ID
function extractYoutubeId(url: string): string {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return "";
}

export default function Workspace() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<{ title: string; author: string; duration: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "system",
      content: "Mora Agent initialized. Ready to process your video.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeOutput, setCodeOutput] = useState("");
  const [thoughtLog, setThoughtLog] = useState<string[]>([]);
  const [leftWidth, setLeftWidth] = useState(50);
  const [showChat, setShowChat] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 16, y: 16 });
  const [chatSize, setChatSize] = useState({ width: 384, height: 512 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const chatDraggingRef = useRef<{
    type?: 'move' | 'resize';
    startX?: number;
    startY?: number;
    startWidth?: number;
    startHeight?: number;
    startPosX?: number;
    startPosY?: number;
  }>({});

  useEffect(() => {
    const url = localStorage.getItem("videoUrl");
    if (url) {
      setVideoUrl(url);
    }

    // 从 URL 获取 sessionId
    const params = new URLSearchParams(searchString);
    const sessionId = params.get("session");
    
    if (sessionId) {
      setIsProcessing(true);
      setThoughtLog([]);
      
      // 连接 SSE
      const disconnect = connectSSE(sessionId, {
        onThought: (content) => {
          console.log("[SSE] thought:", content);
          setThoughtLog((prev) => [...prev, content]);
        },
        onVideo: (data) => {
          console.log("[SSE] video:", data);
          setVideoInfo(data);
        },
        onCode: (data) => {
          console.log("[SSE] code:", data.language, data.content.length, "chars");
          setGeneratedCode(data.content);
        },
        onExecution: (data) => {
          console.log("[SSE] execution:", data);
          if (data.status === "success") {
            setCodeOutput(data.output);
          } else {
            setCodeOutput(`Error: ${data.error}`);
          }
        },
        onDone: () => {
          console.log("[SSE] done");
          setIsProcessing(false);
          setThoughtLog((prev) => [...prev, "✓ 处理完成"]);
        },
        onError: (message) => {
          console.error("[SSE] error:", message);
          setIsProcessing(false);
          setThoughtLog((prev) => [...prev, `✗ 错误: ${message}`]);
        },
      });

      return () => disconnect();
    }
  }, [searchString]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([
        ...messages,
        { role: "user", content: inputValue },
        { role: "assistant", content: "Processing your request..." },
      ]);
      setInputValue("");
    }
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleChatMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-chat-header]')) {
      chatDraggingRef.current = {
        type: 'move',
        startX: e.clientX,
        startY: e.clientY,
        startPosX: chatPosition.x,
        startPosY: chatPosition.y,
      };
    }
  };

  const handleChatResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    chatDraggingRef.current = {
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      startWidth: chatSize.width,
      startHeight: chatSize.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (chatDraggingRef.current.type === 'move') {
        const deltaX = e.clientX - (chatDraggingRef.current.startX || 0);
        const deltaY = e.clientY - (chatDraggingRef.current.startY || 0);
        setChatPosition({
          x: (chatDraggingRef.current.startPosX || 0) + deltaX,
          y: (chatDraggingRef.current.startPosY || 0) + deltaY,
        });
      } else if (chatDraggingRef.current.type === 'resize') {
        const deltaX = e.clientX - (chatDraggingRef.current.startX || 0);
        const deltaY = e.clientY - (chatDraggingRef.current.startY || 0);
        setChatSize({
          width: Math.max(300, (chatDraggingRef.current.startWidth || 0) + deltaX),
          height: Math.max(300, (chatDraggingRef.current.startHeight || 0) + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      chatDraggingRef.current = {};
      isDraggingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [chatPosition, chatSize]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" onMouseMove={handleMouseMove}>
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">
                {videoInfo?.title || "Video Processing"}
              </h1>
              <p className="text-xs text-gray-500 truncate max-w-md">
                {videoInfo ? `${videoInfo.author} · ${videoInfo.duration}` : videoUrl}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="hover:bg-gray-100"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace - Draggable Split Layout */}
      <main
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
        onMouseLeave={handleMouseUp}
      >
        {/* Left Panel */}
        <div
          className="flex flex-col gap-4 p-4 overflow-hidden bg-white"
          style={{ width: `${leftWidth}%` }}
        >
          {/* Video Player */}
          <Card className="bg-black rounded-lg border border-gray-300 flex-1 overflow-hidden">
            {videoUrl ? (
              <div className="w-full h-full">
                {/* B站视频嵌入 */}
                {videoUrl.includes('bilibili.com') && (
                  <iframe
                    src={`//player.bilibili.com/player.html?bvid=${extractBvid(videoUrl)}&autoplay=0`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                )}
                {/* YouTube 视频嵌入 */}
                {(videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) && (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                )}
                {/* 抖音和其他视频：显示跳转链接 */}
                {!videoUrl.includes('bilibili.com') && 
                 !videoUrl.includes('youtube.com') && 
                 !videoUrl.includes('youtu.be') && (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center mb-4">
                      <Play className="w-10 h-10 text-purple-400" />
                    </div>
                    <p className="text-sm mb-2 font-semibold text-gray-400">
                      {videoUrl.includes('douyin.com') ? '抖音视频' : 'Video Player'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4 px-4 text-center">
                      {videoUrl.includes('douyin.com') 
                        ? '抖音不支持嵌入播放' 
                        : '该平台不支持嵌入播放'}
                    </p>
                    <a 
                      href={videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                    >
                      打开原视频 →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center mb-4">
                  <Play className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-sm mb-2 font-semibold text-gray-400">Video Player</p>
                <p className="text-xs text-gray-500">No video loaded</p>
              </div>
            )}
          </Card>

          {/* Agent Thought Process */}
          <Card className="bg-white border border-gray-200 flex-1 overflow-hidden flex flex-col p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
              Agent Thought Process
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
              {thoughtLog.length === 0 ? (
                <p className="text-gray-500">Waiting for processing...</p>
              ) : (
                thoughtLog.map((log, idx) => (
                  <div key={idx} className="text-gray-700">
                    <span className="text-purple-600">→</span> {log}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Draggable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-gray-200 hover:bg-purple-400 cursor-col-resize transition-colors flex items-center justify-center group"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="flex flex-col gap-4 p-4 overflow-hidden bg-white"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Generated Code */}
          <Card className="bg-white border border-gray-200 flex-1 overflow-hidden flex flex-col p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Generated Code</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  className="hover:bg-gray-100 h-8 w-8 p-0"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 h-8 w-8 p-0"
                  title="Download code"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {generatedCode ? (
              <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400">
                <pre className="whitespace-pre-wrap break-words">{generatedCode}</pre>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-sm">Processing video...</p>
              </div>
            )}
          </Card>

          {/* Code Execution Result */}
          <Card className="bg-white border border-gray-200 flex-1 overflow-hidden flex flex-col p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Execution Result</h3>
            {codeOutput ? (
              <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-3 font-mono text-xs text-blue-400">
                <pre className="whitespace-pre-wrap break-words">{codeOutput}</pre>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-sm">Waiting for execution...</p>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Chat Floating Window */}
      {showChat && (
        <div
          className="fixed bg-white rounded-lg border border-gray-200 shadow-2xl flex flex-col z-40 overflow-hidden group"
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            width: `${chatSize.width}px`,
            height: `${chatSize.height}px`,
          }}
        >
          {/* Chat Header - Draggable */}
          <div
            data-chat-header="true"
            onMouseDown={handleChatMouseDown}
            className="border-b border-gray-200 p-4 flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 cursor-move hover:shadow-lg transition-shadow flex-shrink-0"
          >
            <h3 className="font-semibold text-white flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              <MessageCircle className="w-4 h-4" />
              Chat with Mora
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(false)}
              className="hover:bg-white/20 h-8 w-8 p-0 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Ask Mora..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 h-9 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 h-9 w-9 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={handleChatResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-purple-400/0 hover:bg-purple-400/50 transition-colors opacity-0 group-hover:opacity-100"
          />
        </div>
      )}
    </div>
  );
}
