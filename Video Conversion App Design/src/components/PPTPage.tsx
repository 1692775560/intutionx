import { useState } from 'react';
import { ArrowUp, Download, ChevronLeft, ChevronRight, Layout } from 'lucide-react';

export function PPTPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [slides, setSlides] = useState<Array<{ title: string; content: string }>>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setChatHistory([...chatHistory, { role: 'user', content: message }]);
      setMessage('');
      setIsGenerating(true);

      // 模拟PPT生成
      setTimeout(() => {
        const newSlides = [
          { title: '封面页', content: message },
          { title: '核心观点', content: '这是基于您的需求生成的核心内容' },
          { title: '详细说明', content: '更多详细信息和数据支持' },
          { title: '总结展望', content: '总结要点并展望未来' }
        ];
        
        setSlides(newSlides);
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'I have generated a 4-slide presentation for you. You can preview and download it on the left.' 
        }]);
        setIsGenerating(false);
        setCurrentSlide(0);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Side - PPT Preview */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Preview Header */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-gray-600" />
            <h2 className="font-medium text-gray-900">Slides Preview</h2>
            {slides.length > 0 && (
              <span className="text-sm text-gray-500">
                {slides.length} slides
              </span>
            )}
          </div>
          <button
            disabled={slides.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download PPTX
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          {slides.length > 0 ? (
            <div className="max-w-4xl w-full">
              {/* Slide Preview */}
              <div className="aspect-[16/9] bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
                <div className="h-full flex flex-col p-12 bg-gradient-to-br from-blue-50 to-white">
                  <h1 className="text-4xl font-medium text-gray-900 mb-8">
                    {slides[currentSlide].title}
                  </h1>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    {slides[currentSlide].content}
                  </p>
                  <div className="mt-auto flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Slide {currentSlide + 1} / {slides.length}
                    </div>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Slide Thumbnails */}
                <div className="flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-12 h-8 rounded border-2 transition-all ${
                        index === currentSlide
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs text-gray-600">{index + 1}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={nextSlide}
                  disabled={currentSlide === slides.length - 1}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Layout className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg mb-2">Waiting for presentation generation...</p>
              <p className="text-sm">Describe your presentation topic in the chat on the right</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat */}
      <div className="w-[400px] flex flex-col bg-white border-l border-gray-200">
        {/* Chat Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Slides Generator</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6">
          {chatHistory.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center mb-3">🎨 Tell me your presentation topic and I'll create a beautiful slideshow for you</p>
              <div className="space-y-2">
                <button
                  onClick={() => setMessage('Create a presentation about artificial intelligence')}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors text-left"
                >
                  Create a presentation about AI
                </button>
                <button
                  onClick={() => setMessage('Generate a product introduction presentation')}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors text-left"
                >
                  Generate product introduction
                </button>
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
                        ? 'bg-blue-600 text-white'
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
                      <span className="text-sm text-gray-600">Generating presentation...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="relative bg-white border border-gray-300 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your presentation topic..."
              rows={3}
              className="w-full px-3 py-2 pr-10 bg-transparent resize-none outline-none text-sm text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                message.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}