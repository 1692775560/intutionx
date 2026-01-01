import { useState } from 'react';
import { Upload, FileVideo, Clock, CheckCircle, XCircle, ChevronRight, Sparkles } from 'lucide-react';
import { ViewMode, ConversionRecord, ConversionType } from '../App';
import { Sidebar } from './Sidebar';

interface MainViewProps {
  setViewMode: (mode: ViewMode) => void;
  setUploadedFile: (file: File | null) => void;
}

export function MainView({ setViewMode, setUploadedFile }: MainViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState<ConversionType | null>(null);
  
  // 模拟最近转化记录
  const recentRecords: ConversionRecord[] = [
    {
      id: '1',
      fileName: '产品发布会演讲.mp4',
      type: 'ppt',
      timestamp: new Date(Date.now() - 3600000),
      status: 'success'
    },
    {
      id: '2',
      fileName: '行业分析报告.mp4',
      type: 'article',
      timestamp: new Date(Date.now() - 7200000),
      status: 'success'
    },
    {
      id: '3',
      fileName: '技术教程录屏.mp4',
      type: 'blog',
      timestamp: new Date(Date.now() - 10800000),
      status: 'success'
    }
  ];

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
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => 
      file.type.startsWith('video/') || 
      /\.(mp4|mov|avi|mkv|wmv)$/i.test(file.name)
    );
    
    if (videoFile) {
      setUploadedFile(videoFile);
      // 可以在这里显示成功提示
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const getTypeLabel = (type: ConversionType) => {
    const labels = {
      ppt: 'PPT',
      article: '公众号图文',
      blog: '博客文章',
      all: '全部'
    };
    return labels[type];
  };

  const getTypeColor = (type: ConversionType) => {
    const colors = {
      ppt: 'text-[#FF6B6B]',
      article: 'text-[#4ECDC4]',
      blog: 'text-[#95E1D3]',
      all: 'text-[#2D8CFF]'
    };
    return colors[type];
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const tooltipTexts = {
    ppt: '自动提取视频内容生成精美PPT，支持多种版式和模板',
    article: '转换为适配公众号编辑器的图文内容，一键复制粘贴',
    blog: '生成结构化博客文章，支持多平台格式导出',
    all: '同时生成PPT、公众号图文和博客文章，一次转化全搞定'
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 主内容区 */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* 核心操作区 */}
          <div className="mb-8">
            {/* 拖拽上传框 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-[12px] border-2 border-dashed transition-all ${
                isDragging
                  ? 'border-[#2D8CFF] bg-[#2D8CFF]/5 scale-[1.02]'
                  : 'border-[#E5E5E5] dark:border-gray-600 bg-white dark:bg-[#2a2a2a]'
              }`}
              style={{
                minHeight: '320px',
                boxShadow: isDragging ? '0 8px 24px rgba(45, 140, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* 波纹效果 */}
              {isDragging && (
                <div className="absolute inset-0 rounded-[12px] overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2D8CFF]/10 to-transparent animate-pulse" />
                </div>
              )}
              
              <label className="flex flex-col items-center justify-center h-full cursor-pointer p-12">
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.avi,.mkv,.wmv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all ${
                  isDragging ? 'bg-[#2D8CFF] scale-110' : 'bg-[#F5F5F5] dark:bg-[#3a3a3a]'
                }`}>
                  {isDragging ? (
                    <Upload className="w-10 h-10 text-white" />
                  ) : (
                    <FileVideo className="w-10 h-10 text-[#2D8CFF]" />
                  )}
                </div>
                
                <p className="text-[#333333] dark:text-white mb-2">
                  {isDragging ? '释放以上传文件' : '拖拽视频文件至此处，或点击选择文件'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  支持 MP4 / MOV / AVI / MKV / WMV 等主流格式
                </p>
              </label>
            </div>

            {/* 快速转化按钮组 */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              {(['ppt', 'article', 'blog', 'all'] as ConversionType[]).map((type) => (
                <button
                  key={type}
                  onMouseEnter={() => setShowTooltip(type)}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="relative group"
                >
                  <div className="px-6 py-4 rounded-[8px] bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white transition-all hover:scale-110 hover:shadow-lg active:scale-95"
                    style={{
                      boxShadow: '0 4px 12px rgba(45, 140, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {type === 'all' && <Sparkles className="w-5 h-5" />}
                      <span className="font-medium">
                        {type === 'all' ? '一键全转' : `转${getTypeLabel(type)}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* 功能简介提示 */}
                  {showTooltip === type && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 bg-[#333333] text-white rounded-lg whitespace-nowrap z-10 animate-fade-in">
                      <p className="text-sm">{tooltipTexts[type]}</p>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#333333] rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 最近转化记录 */}
          <div className="bg-white dark:bg-[#2a2a2a] rounded-[12px] p-6" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
            <h3 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2D8CFF]" />
              最近转化记录
            </h3>
            
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileVideo className="w-5 h-5 text-[#2D8CFF]" />
                    <div className="flex-1">
                      <p className="text-[#333333] dark:text-white">{record.fileName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-sm ${getTypeColor(record.type)}`}>
                          {getTypeLabel(record.type)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(record.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {record.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-[#52C41A]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#FF4D4F]" />
                    )}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2D8CFF] hover:underline flex items-center gap-1">
                      重新转化
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 侧边栏 */}
      <Sidebar />
    </div>
  );
}
