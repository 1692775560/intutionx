import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Copy, Check, Play, Upload, X, MessageSquare, Download } from 'lucide-react';
import { Resizable } from 're-resizable';

export function CodePage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [generatedCode, setGeneratedCode] = useState(`# Python Basics Tutorial
# Learn Python Programming

def calculate_fibonacci(n):
    """
    Calculate Fibonacci sequence up to n terms
    """
    fib_sequence = [0, 1]
    
    for i in range(2, n):
        next_num = fib_sequence[i-1] + fib_sequence[i-2]
        fib_sequence.append(next_num)
    
    return fib_sequence

def greet_user(name):
    """
    A simple greeting function
    """
    message = f"Hello, {name}! Welcome to Python programming."
    return message

# Class example - Creating a simple Calculator
class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, a, b):
        self.result = a + b
        return self.result
    
    def subtract(self, a, b):
        self.result = a - b
        return self.result
    
    def multiply(self, a, b):
        self.result = a * b
        return self.result

# Main execution
if __name__ == "__main__":
    # Test fibonacci function
    print("Fibonacci sequence (10 terms):")
    print(calculate_fibonacci(10))
    
    # Test greeting function
    greeting = greet_user("Python Learner")
    print(greeting)
    
    # Test Calculator class
    calc = Calculator()
    print(f"Addition: 5 + 3 = {calc.add(5, 3)}")
    print(f"Multiplication: 4 * 7 = {calc.multiply(4, 7)}")
`);
  const [executionResult, setExecutionResult] = useState(`Fibonacci sequence (10 terms):
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

Hello, Python Learner! Welcome to Python programming.

Addition: 5 + 3 = 8
Multiplication: 4 * 7 = 28`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [thoughtProcess, setThoughtProcess] = useState<Array<{ step: string; status: 'complete' | 'processing' | 'pending' }>>([
    { step: 'Analyzing Python tutorial video...', status: 'complete' },
    { step: 'Extracting code patterns and concepts...', status: 'complete' },
    { step: 'Generating Python code examples...', status: 'complete' },
    { step: 'Testing and validating code...', status: 'complete' },
  ]);

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
        <h1 className="font-semibold text-gray-900">Video to Code</h1>
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
                    {/* Video Title Overlay */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
                      <h3 className="text-white text-sm font-medium">Python Programming Fundamentals</h3>
                      <p className="text-gray-300 text-xs mt-1">Learn Python basics, functions, and classes</p>
                    </div>
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full bg-black object-contain"
                    >
                      Your browser does not support video playback
                    </video>
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
                <pre className="text-gray-300 leading-relaxed">
                  <code>{generatedCode}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">No code generated yet</p>
                    <p className="text-sm">Use the chat to describe what you need</p>
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
                <div className={`w-2 h-2 rounded-full ${executionResult ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs text-gray-500">{executionResult ? 'Success' : 'Idle'}</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-50">
              {executionResult ? (
                <pre className="text-gray-700 leading-relaxed">
                  <code>{executionResult}</code>
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-gray-400">No output yet</p>
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