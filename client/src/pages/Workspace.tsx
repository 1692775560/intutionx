import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUp, Copy, Check, Play, Download, MessageSquare, X, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Resizable } from "re-resizable";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeOutput, setCodeOutput] = useState("");
  const [thoughtLog, setThoughtLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatSize, setChatSize] = useState({ width: 400, height: 500 });
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Left panel width
  const [leftWidth, setLeftWidth] = useState(450);

  // 保存项目到数据库
  const saveProject = async () => {
    try {
      const title = videoInfo?.title || "Untitled Video";
      await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "video-to-code",
          title: title,
          input: videoUrl,
          data: {
            video_url: videoUrl,
            video_info: videoInfo,
            code: generatedCode,
            output: codeOutput,
          },
          userId: "default_user",
        }),
      });
      console.log("[Workspace] 项目已保存");
    } catch (error) {
      console.error("[Workspace] 保存项目失败:", error);
    }
  };

  // Initialize chat position
  useEffect(() => {
    if (showChat && chatPosition.x === 0 && chatPosition.y === 0) {
      setChatPosition({
        x: window.innerWidth - chatSize.width - 40,
        y: window.innerHeight - chatSize.height - 40,
      });
    }
  }, [showChat]);

  useEffect(() => {
    const url = localStorage.getItem("videoUrl");
    if (url) {
      setVideoUrl(url);
    }

    const params = new URLSearchParams(searchString);
    const sessionId = params.get("session");

    if (sessionId) {
      setIsProcessing(true);
      setThoughtLog([]);

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
          
          // 保存项目到数据库
          saveProject();
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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChatSend = () => {
    if (chatMessage.trim()) {
      setChatHistory([...chatHistory, { role: "user", content: chatMessage }]);
      setChatMessage("");
      // TODO: 实现 chat 功能
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: "Chat 功能即将上线，敬请期待！" },
        ]);
      }, 500);
    }
  };

  // Chat dragging
  const handleChatMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".chat-header")) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - chatPosition.x,
        y: e.clientY - chatPosition.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setChatPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 渲染视频播放器
  const renderVideoPlayer = () => {
    if (!videoUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-300">No video loaded</span>
        </div>
      );
    }

    // B站
    if (videoUrl.includes("bilibili.com")) {
      return (
        <iframe
          src={`//player.bilibili.com/player.html?bvid=${extractBvid(videoUrl)}&autoplay=0`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      );
    }

    // YouTube
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      );
    }

    // 其他（抖音等）
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Play className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-300 mb-2">
          {videoUrl.includes("douyin.com") ? "抖音视频" : "Video"}
        </p>
        <p className="text-xs text-gray-500 mb-4">该平台不支持嵌入播放</p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white text-gray-900 text-sm rounded-lg hover:bg-gray-100 transition-colors"
        >
          打开原视频 →
        </a>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <img src="/logo.svg" alt="Mora" className="w-6 h-6" />
          <div>
            <h1 className="font-semibold text-gray-900">
              {videoInfo?.title || "Video to Code"}
            </h1>
            {videoInfo && (
              <p className="text-xs text-gray-500">
                {videoInfo.author} · {videoInfo.duration}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Video + Thought Process */}
        <Resizable
          size={{ width: leftWidth, height: "100%" }}
          onResizeStop={(e, direction, ref, d) => {
            setLeftWidth(leftWidth + d.width);
          }}
          minWidth={300}
          maxWidth={800}
          enable={{ right: true }}
          handleStyles={{
            right: {
              width: "4px",
              right: "-2px",
              cursor: "col-resize",
              backgroundColor: "transparent",
            },
          }}
          handleClasses={{
            right: "hover:bg-blue-500 transition-colors",
          }}
        >
          <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Video Section */}
            <div className="flex-[3] flex flex-col border-b border-gray-200 p-4">
              <div className="h-10 flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-900">Video Preview</h2>
                {videoInfo && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                    {videoInfo.author}
                  </span>
                )}
              </div>
              <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden relative">
                {/* Video Title Overlay */}
                {videoInfo && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
                    <h3 className="text-white text-sm font-medium truncate">{videoInfo.title}</h3>
                    <p className="text-gray-300 text-xs mt-1">{videoInfo.author}</p>
                  </div>
                )}
                {renderVideoPlayer()}
              </div>
            </div>

            {/* Agent Thought Process */}
            <div className="flex-[2] flex flex-col bg-gray-50 p-4">
              <div className="h-10 flex items-center mb-4">
                <h2 className="text-sm font-medium text-gray-900">Agent Thought Process</h2>
              </div>
              <div className="flex-1 overflow-auto bg-white rounded-2xl p-4">
                <div className="space-y-2">
                  {thoughtLog.length === 0 ? (
                    <p className="text-sm text-gray-400">Waiting for processing...</p>
                  ) : (
                    thoughtLog.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 select-none">→</span>
                        <p className={`${
                          log.includes("✓") ? "text-green-600" : 
                          log.includes("✗") ? "text-red-600" : 
                          "text-gray-600"
                        }`}>{log}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Resizable>

        {/* Right Side - Code Panels */}
        <div className="flex-1 flex flex-col bg-gray-50 p-4">
          {/* Generated Code Panel - Green Theme */}
          <div className="flex-[3] flex flex-col bg-[#0d1117] rounded-2xl overflow-hidden mb-4 border border-green-900/30">
            <div className="h-12 border-b border-green-900/30 flex items-center justify-between px-4 bg-[#161b22]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-400 font-medium">Generated Code</span>
                <span className="text-xs text-gray-500">main.py</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!generatedCode}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  disabled={!generatedCode}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              {generatedCode ? (
                <pre className="text-green-300 leading-relaxed whitespace-pre-wrap">
                  <code>{generatedCode}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">
                    {isProcessing ? "Generating code..." : "No code generated yet"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Execution Result Panel - Blue Theme */}
          <div className="flex-[2] flex flex-col bg-[#0d1117] rounded-2xl overflow-hidden border border-blue-900/30">
            <div className="h-12 border-b border-blue-900/30 flex items-center justify-between px-4 bg-[#161b22]">
              <span className="text-sm font-medium text-blue-400">Execution Result</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${codeOutput ? "bg-green-500" : "bg-gray-500"}`} />
                <span className="text-xs text-gray-400">{codeOutput ? "Success" : "Idle"}</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              {codeOutput ? (
                <pre className="text-blue-300 leading-relaxed whitespace-pre-wrap">
                  <code>{codeOutput}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-500">
                    {isProcessing ? "Waiting for execution..." : "No output yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Window */}
      {showChat && (
        <Resizable
          size={chatSize}
          onResizeStop={(e, direction, ref, d) => {
            setChatSize({
              width: chatSize.width + d.width,
              height: chatSize.height + d.height,
            });
          }}
          minWidth={320}
          minHeight={400}
          maxWidth={800}
          maxHeight={800}
          style={{
            position: "fixed",
            left: chatPosition.x,
            top: chatPosition.y,
            zIndex: 1000,
          }}
          className="shadow-2xl rounded-lg overflow-hidden"
        >
          <div
            className="h-full flex flex-col bg-white border border-gray-300 rounded-lg"
            onMouseDown={handleChatMouseDown}
          >
            {/* Chat Header */}
            <div className="chat-header h-12 flex items-center justify-between px-4 border-b border-gray-200 bg-gray-50 cursor-move">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">Mora</h3>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-6 h-6 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-auto px-4 py-4 bg-white">
              {chatHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 text-sm">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Start a conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="relative bg-white border border-gray-300 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="Ask me anything..."
                  rows={2}
                  className="w-full px-3 py-2 pr-10 bg-transparent resize-none outline-none text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatMessage.trim()}
                  className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    chatMessage.trim()
                      ? "bg-black hover:bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Resizable>
      )}
    </div>
  );
}
