import { useState, useRef, useEffect } from 'react';
import { Check, Copy, Play, Download, MessageSquare, X } from 'lucide-react';
import { Resizable } from 're-resizable';
import { CodeEditor } from './CodeEditor';
import { useSSE } from '../hooks/useSSE';
import { usePyodide } from '../hooks/usePyodide';
import { useVideoSync } from '../hooks/useVideoSync';
import { api } from '../services/api';
import { Timeline } from '../types/session';

interface WorkspacePageProps {
  sessionId: string;
}

export function WorkspacePage({ sessionId }: WorkspacePageProps) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [leftWidth, setLeftWidth] = useState(450);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { messages, isConnected } = useSSE(sessionId);
  const { pyodide, loading: pyodideLoading, runCode } = usePyodide();
  const { highlightedLines } = useVideoSync(videoRef, timeline);

  const [thoughtProcess, setThoughtProcess] = useState<Array<{ 
    step: string; 
    status: 'complete' | 'processing' | 'pending' 
  }>>([]);

  // 加载会话信息
  useEffect(() => {
    api.getSession(sessionId).then(session => {
      if (session.videoUrl) {
        setVideoUrl(session.videoUrl);
      }
      if (session.generatedCode) {
        setGeneratedCode(session.generatedCode);
      }
      if (session.timeline) {
        setTimeline(session.timeline);
      }
    }).catch(error => {
      console.error('Failed to load session:', error);
    });
  }, [sessionId]);

  // 处理SSE消息
  useEffect(() => {
    messages.forEach(msg => {
      switch (msg.type) {
        case 'thought':
          setThoughtProcess(prev => [
            ...prev,
            { step: msg.content || '', status: 'processing' }
          ]);
          break;
        
        case 'subtitle':
          setThoughtProcess(prev => 
            prev.map((item, idx) => 
              idx === prev.length - 1 ? { ...item, status: 'complete' } : item
            )
          );
          if (msg.data?.title) {
            // 可以显示视频信息
          }
          break;
        
        case 'code':
          setGeneratedCode(prev => prev + (msg.content || ''));
          break;
        
        case 'code_done':
          setThoughtProcess(prev => 
            prev.map((item, idx) => 
              idx === prev.length - 1 ? { ...item, status: 'complete' } : item
            )
          );
          break;
        
        case 'timeline':
          if (msg.data) {
            setTimeline(msg.data);
          }
          break;
        
        case 'done':
          setThoughtProcess(prev => 
            prev.map(item => ({ ...item, status: 'complete' }))
          );
          break;
      }
    });
  }, [messages]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (!pyodide || !generatedCode) return;
    
    setIsExecuting(true);
    setExecutionResult('Running...');
    
    const result = await runCode(generatedCode);
    
    if (result.error) {
      setExecutionResult(`Error:\n${result.error}`);
    } else {
      setExecutionResult(result.output || 'Code executed successfully with no output.');
    }
    
    setIsExecuting(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
        <h1 className="font-semibold text-gray-900">Video to Code</h1>
        <div className="flex items-center gap-3">
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
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full bg-black object-contain"
                  >
                    Your browser does not support video playback
                  </video>
                ) : (
                  <div className="text-white text-center p-6">
                    <p>Loading video...</p>
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
                <div className="space-y-3">
                  {thoughtProcess.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-4">
                      {isConnected ? 'Processing...' : 'Waiting to connect...'}
                    </div>
                  )}
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
                  onClick={handleRun}
                  disabled={!generatedCode || pyodideLoading || isExecuting}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {pyodideLoading ? 'Loading...' : isExecuting ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {generatedCode ? (
                <CodeEditor
                  code={generatedCode}
                  onChange={setGeneratedCode}
                  highlightedLines={highlightedLines}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">Generating code...</p>
                    <p className="text-sm">Please wait while AI processes the video</p>
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
                <div className={`w-2 h-2 rounded-full ${
                  executionResult && !executionResult.startsWith('Error') ? 'bg-green-500' : 
                  executionResult.startsWith('Error') ? 'bg-red-500' :
                  'bg-gray-300'
                }`} />
                <span className="text-xs text-gray-500">
                  {pyodideLoading ? 'Loading Python...' : 
                   executionResult ? 'Complete' : 'Idle'}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-50">
              {pyodideLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading Python runtime...</p>
                  </div>
                </div>
              ) : executionResult ? (
                <pre className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  <code>{executionResult}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-400">Click "Run" to execute the code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
