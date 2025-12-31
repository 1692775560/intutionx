import { ArrowRight, Sparkles, Upload } from 'lucide-react';
import { useState } from 'react';

export function Hero() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file upload
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2D8CFF]/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#2D8CFF]" />
          <span className="text-sm text-gray-300">AI 驱动的视频内容转换工具</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
          将视频转化为
          <br />
          <span className="bg-gradient-to-r from-[#2D8CFF] via-purple-400 to-pink-400 bg-clip-text text-transparent">
            多种内容形式
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          一键将视频内容智能转换为 PPT、公众号图文、博客文章
          <br />
          让内容创作更高效，让知识传播更广泛
        </p>

        {/* Upload Area */}
        <div className="max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? 'border-[#2D8CFF] bg-[#2D8CFF]/10 scale-[1.02]'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            } backdrop-blur-sm p-12 cursor-pointer group`}
          >
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
              />
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                isDragging ? 'bg-[#2D8CFF] scale-110' : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-gray-300'}`} />
              </div>
              
              <p className="text-lg text-white mb-2">
                拖拽视频文件至此，或点击选择文件
              </p>
              <p className="text-sm text-gray-400">
                支持 MP4, MOV, AVI 等主流格式，最大 2GB
              </p>
            </label>

            {/* Floating Elements */}
            {!isDragging && (
              <>
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#2D8CFF] rounded-lg opacity-50 blur-sm animate-pulse" />
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-purple-500 rounded-lg opacity-50 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button className="px-6 py-3 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white rounded-full hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#2D8CFF]/25">
              <Sparkles className="w-5 h-5" />
              一键全转
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20">
              转为 PPT
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20">
              转为图文
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20">
              转为博客
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {[
            { label: '转换次数', value: '10M+' },
            { label: '用户数量', value: '500K+' },
            { label: '节省时间', value: '95%' },
            { label: '满意度', value: '99%' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl text-white mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
