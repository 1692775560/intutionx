import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Copy, Check, Play, Upload, X, MessageSquare, Download, PlayCircle } from 'lucide-react';
import { Resizable } from 're-resizable';
import { useSSE } from '../hooks/useSSE';
import { useCodeExecutor } from '../hooks/useCodeExecutor';

export function CodePage() {
  const [message, setMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [codeSegments, setCodeSegments] = useState<any[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  
  const { executeCode, isExecuting, result: execResult } = useCodeExecutor();

  // Load video URL and session ID from localStorage when component mounts
  useEffect(() => {
    const savedVideoUrl = localStorage.getItem('videoUrl');
    const savedSessionId = localStorage.getItem('sessionId');
    
    if (savedVideoUrl) {
      setVideoUrl(savedVideoUrl);
    } else {
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    }

    if (savedSessionId) {
      setSessionId(savedSessionId);
      setIsGenerating(true);
    }
  }, []);

  const [showChat, setShowChat] = useState(false);
  const [thoughtProcess, setThoughtProcess] = useState<Array<{ step: string; status: 'complete' | 'processing' | 'pending' }>>([]);

  // Use SSE hook to receive real-time updates from backend
  const { messages, isConnected, error } = useSSE(sessionId || '');

  // Handle SSE errors
  useEffect(() => {
    if (error) {
      console.error('SSE Error:', error);
      setIsGenerating(false);
    }
  }, [error]);

  // Process SSE messages to update UI
  useEffect(() => {
    if (messages.length === 0) return;

    // 处理所有消息，而不是只处理最后一个
    messages.forEach((message, index) => {
      if (!message || !message.type) return;
      
      console.log(`🔍 Processing message ${index}:`, message.type);
      
      switch (message.type) {
      case 'thought':
        // Add or update thought process step
        const thoughtContent = message.content || '';
        setThoughtProcess((prev) => {
          const existing = prev.find(p => p.step === thoughtContent);
          if (existing) {
            return prev.map(p => p.step === thoughtContent ? { ...p, status: 'processing' as const } : p);
          }
          return [...prev, { step: thoughtContent, status: 'processing' as const }];
        });
        break;

      case 'subtitle':
        // Mark subtitle extraction as complete
        setThoughtProcess((prev) => 
          prev.map(p => {
            const step = p.step.toLowerCase();
            if (step.includes('字幕') || step.includes('subtitle') || step.includes('提取') || step.includes('extract')) {
              return { ...p, status: 'complete' as const };
            }
            return p;
          })
        );
        break;

      case 'code_segment':
        // 接收单个代码段
        const segmentData = message.data || message;
        console.log('📦 Code segment received:', {
          index: segmentData.segmentIndex,
          timeRange: segmentData.timeRange,
          summary: segmentData.summary,
          codeLength: segmentData.code?.length || 0
        });
        setCodeSegments((prev) => {
          const updated = [...prev, segmentData];
          console.log(`📊 Total segments now: ${updated.length}`);
          // 如果是第一个代码段，立即显示
          if (updated.length === 1) {
            setCurrentSegmentIndex(0);
            setGeneratedCode(segmentData.code || '');
            console.log('✅ First segment auto-displayed');
          }
          return updated;
        });
        break;

      case 'segments_complete':
        // 所有代码段接收完成
        const allSegments = message.data?.segments || [];
        console.log('✅ segments_complete event:', {
          totalSegments: allSegments.length,
          hasData: !!message.data,
          rawData: message.data
        });
        
        if (allSegments.length > 0) {
          setCodeSegments(allSegments);
          setCurrentSegmentIndex(0);
          setGeneratedCode(allSegments[0].code || '');
          console.log('✅ Displayed first segment:', allSegments[0].summary);
        } else {
          console.warn('⚠️ No segments in segments_complete event');
        }
        break;

      case 'code_done':
        // Mark code generation as complete
        setThoughtProcess((prev) => 
          prev.map(p => {
            const step = p.step.toLowerCase();
            // Match multiple Chinese/English variations
            if (step.includes('生成代码') || step.includes('generating code') || 
                step.includes('分析视频') || step.includes('analyzing video') ||
                step.includes('代码') || step.includes('code')) {
              return { ...p, status: 'complete' as const };
            }
            return p;
          })
        );
        break;

      case 'timeline':
        // 兼容旧的timeline事件（不再使用）
        break;

      case 'done':
        // All processing complete
        setIsGenerating(false);
        setThoughtProcess((prev) => prev.map(p => ({ ...p, status: 'complete' as const })));
        break;

      case 'error':
        // Handle error
        setIsGenerating(false);
        const errorMsg = message.content || message.data || 'Unknown error';
        alert(`Error: ${errorMsg}`);
        break;
      }
    });
  }, [messages]);

  // 监听执行结果并更新UI
  useEffect(() => {
    if (execResult) {
      if (execResult.success) {
        setExecutionResult(execResult.output || 'Code executed successfully (no output)');
      } else {
        setExecutionResult(`Error: ${execResult.error || 'Unknown error'}`);
      }
    }
  }, [execResult]);

  // 监听视频播放进度，更新当前显示的代码段
  useEffect(() => {
    if (codeSegments.length === 0) return;

    // 根据当前时间找到对应的代码段索引
    const segmentIndex = codeSegments.findIndex((seg: any) => {
      // 使用 <= 而不是 < 来确保最后一秒也能匹配
      return currentTime >= seg.startTime && currentTime <= seg.endTime;
    });

    if (segmentIndex !== -1) {
      // 只在段落真正改变时才切换
      if (segmentIndex !== currentSegmentIndex) {
        setCurrentSegmentIndex(segmentIndex);
        const segment = codeSegments[segmentIndex];
        setGeneratedCode(segment.code || '');
        console.log(`⏱️ Video time ${currentTime}s → Switched to segment ${segmentIndex}: ${segment.timeRange} - ${segment.summary}`);
      }
    } else {
      // 如果没有匹配的段落，显示第一段
      if (currentSegmentIndex === null && codeSegments.length > 0) {
        setCurrentSegmentIndex(0);
        setGeneratedCode(codeSegments[0].code || '');
        console.log(`⏱️ No matching segment, showing first segment`);
      }
    }
  }, [currentTime, codeSegments, currentSegmentIndex]);

  // 添加视频timeupdate事件监听
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(video.currentTime));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef.current]);

  // 运行代码
  const handleRunCode = async () => {
    if (!generatedCode.trim()) {
      setExecutionResult('Error: No code to execute');
      return;
    }
    
    setExecutionResult('Running code...');
    await executeCode(generatedCode);
  };

  const [leftWidth, setLeftWidth] = useState(450);
  const [chatSize, setChatSize] = useState({ width: 400, height: 500 });
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);

  // Initialize chat position (bottom right corner)
  useEffect(() => {
    if (showChat && chatPosition.x === 0 && chatPosition.y === 0) {
      setChatPosition({
        x: window.innerWidth - chatSize.width - 40,
        y: window.innerHeight - chatSize.height - 40
      });
    }
  }, [showChat]);

  const handleSend = () => {
    if (message.trim()) {
      setChatHistory([...chatHistory, { role: 'user', content: message }]);
      setMessage('');
      setIsGenerating(true);

      // Simulate code generation
      setTimeout(() => {
        const code = `// ${message}\nfunction example() {\n  const greeting = "Hello, World!";\n  console.log(greeting);\n  \n  return {\n    message: greeting,\n    timestamp: Date.now()\n  };\n}\n\n// Call function\nexample();`;
        
        setGeneratedCode(code);
        setExecutionResult('Hello, World!\n{ message: "Hello, World!", timestamp: 1735660800000 }');
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'I have generated the code for you. You can view and run it in the code panel.' 
        }]);
        setIsGenerating(false);
      }, 1500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleRemoveVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl('');
    setVideoFile(null);
  };

  // Convert video URL to embeddable format
  const getEmbedUrl = (url: string): { type: 'iframe' | 'video'; embedUrl: string } => {
    // Bilibili video
    if (url.includes('bilibili.com')) {
      // Extract BV id from URL like https://www.bilibili.com/video/BV1qW4y1a7fU
      const bvMatch = url.match(/\/video\/(BV[\w]+)/);
      if (bvMatch) {
        return {
          type: 'iframe',
          embedUrl: `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&high_quality=1&autoplay=0`
        };
      }
    }
    
    // YouTube video
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (videoIdMatch) {
        return {
          type: 'iframe',
          embedUrl: `https://www.youtube.com/embed/${videoIdMatch[1]}`
        };
      }
    }
    
    // Default: treat as direct video URL
    return { type: 'video', embedUrl: url };
  };

  // Chat dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - chatPosition.x,
        y: e.clientY - chatPosition.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setChatPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div className="h-full flex flex-col">
      {/* Top Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-gray-900">Video to Code</h1>
          {sessionId && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          )}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Video + Thought Process (Resizable) */}
        <Resizable
          size={{ width: leftWidth, height: '100%' }}
          onResizeStop={(e, direction, ref, d) => {
            setLeftWidth(leftWidth + d.width);
          }}
          minWidth={300}
          maxWidth={800}
          enable={{ right: true }}
          handleStyles={{
            right: {
              width: '4px',
              right: '-2px',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s'
            }
          }}
          handleClasses={{
            right: 'hover:bg-blue-500'
          }}
        >
          <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Video Section */}
            <div className="flex-[3] flex flex-col border-b border-gray-200 pt-4 px-4">
              <div className="h-12 flex items-center justify-between px-4 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">Video Preview</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">Python Tutorial</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-3xl overflow-hidden mt-4 mb-4">
                {videoUrl ? (
                  <div className="relative w-full h-full">
                    {(() => {
                      const { type, embedUrl } = getEmbedUrl(videoUrl);
                      
                      if (type === 'iframe') {
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ border: 'none' }}
                          />
                        );
                      } else {
                        return (
                          <>
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
                              <h3 className="text-white text-sm font-medium">Video Tutorial</h3>
                              <p className="text-gray-300 text-xs mt-1">Programming Tutorial</p>
                            </div>
                            <video
                              ref={videoRef}
                              src={embedUrl}
                              controls
                              className="w-full h-full bg-black object-contain"
                              onTimeUpdate={(e) => {
                                const video = e.target as HTMLVideoElement;
                                setCurrentTime(video.currentTime);
                              }}
                            >
                              Your browser does not support video playback
                            </video>
                          </>
                        );
                      }
                    })()}
                    <button
                      onClick={handleRemoveVideo}
                      className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-6 w-full">
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-400 cursor-pointer transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-300">Click to upload Python tutorial video</span>
                      <span className="text-xs text-gray-500 mt-1">Supports MP4, WebM, MOV</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Thought Process */}
            <div className="flex-[2] flex flex-col bg-gray-50 pt-4 px-4 pb-4">
              <div className="h-12 flex items-center px-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">Agent Thought Process</h2>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-white rounded-2xl mt-4">
                {thoughtProcess.length > 0 ? (
                  <div className="space-y-3">
                    {thoughtProcess.map((thought, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          thought.status === 'complete' ? 'bg-green-500' :
                          thought.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                          'bg-gray-300'
                        }`}>
                          {thought.status === 'complete' && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                          {thought.status === 'processing' && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            thought.status === 'pending' ? 'text-gray-400' : 'text-gray-700'
                          }`}>
                            {thought.step}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-sm">Waiting for processing to start...</p>
                      {isGenerating && (
                        <div className="mt-3 flex justify-center">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Resizable>

        {/* Right Side - Code Panels */}
        <div className="flex-1 flex flex-col bg-gray-50 pt-4 px-4 pb-4">
          {/* Generated Code Panel */}
          <div className="flex-[3] flex flex-col bg-[#1e1e1e] rounded-2xl overflow-hidden mb-4">
            <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4 bg-[#2d2d2d]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">Generated Code</span>
                <span className="text-xs text-gray-500">main.py</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!generatedCode}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={!generatedCode || isExecuting}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Run
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {generatedCode ? (
                <textarea
                  value={generatedCode}
                  onChange={(e) => setGeneratedCode(e.target.value)}
                  className="w-full h-full p-4 bg-gray-900/50 text-lime-200 font-mono text-sm leading-relaxed resize-none focus:outline-none shadow-inner"
                  style={{ textShadow: '0 0 2px rgba(190, 242, 100, 0.5)' }}
                  spellCheck={false}
                  placeholder="Code will appear here..."
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">No code generated yet</p>
                    <p className="text-sm">
                      {currentSegmentIndex !== null 
                        ? `Waiting for segment ${currentSegmentIndex + 1}...`
                        : 'Play the video to see code segments'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Execution Result Panel */}
          <div className="flex-[2] flex flex-col bg-white rounded-2xl overflow-hidden">
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
              <span className="text-sm font-medium text-gray-900">Execution Result</span>
              <div className="flex items-center gap-2">
                {isExecuting ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-xs text-yellow-600">Running</span>
                  </>
                ) : execResult?.success === false ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-red-600">Error</span>
                  </>
                ) : executionResult ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600">Success</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-xs text-gray-500">Idle</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-50">
              {executionResult ? (
                <pre className={`leading-relaxed ${
                  execResult?.success === false ? 'text-red-600' : 'text-gray-700'
                }`}>
                  <code>{executionResult}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-400">No output yet. Click "Run" to execute the code.</p>
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
              height: chatSize.height + d.height
            });
          }}
          minWidth={320}
          minHeight={400}
          maxWidth={800}
          maxHeight={800}
          style={{
            position: 'fixed',
            left: chatPosition.x,
            top: chatPosition.y,
            zIndex: 1000,
          }}
          className="shadow-2xl rounded-lg overflow-hidden"
        >
          <div 
            ref={chatRef}
            className="h-full flex flex-col bg-white border border-gray-300 rounded-lg"
            onMouseDown={handleMouseDown}
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
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                          </div>
                          <span className="text-sm text-gray-600">Generating...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="relative bg-white border border-gray-300 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  rows={2}
                  className="w-full px-3 py-2 pr-10 bg-transparent resize-none outline-none text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    message.trim()
                      ? 'bg-black hover:bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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