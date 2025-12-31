import { useState } from 'react';
import { Play, Pause, Scissors, Plus, Eye, Zap, FileText, Image as ImageIcon, AlignLeft, Type, Palette2, MessageSquare, Hash, List, ArrowLeft } from 'lucide-react';
import { ViewMode } from '../App';

interface ProfessionalViewProps {
  uploadedFile: File | null;
  setViewMode: (mode: ViewMode) => void;
  setConversionResults: (results: any) => void;
}

export function ProfessionalView({ uploadedFile, setViewMode, setConversionResults }: ProfessionalViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'ppt' | 'article' | 'blog'>('ppt');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handlePreview = () => {
    // 预览逻辑
    console.log('预览');
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    
    // 模拟生成过程
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          // 生成完成后跳转到预览页面
          setTimeout(() => {
            setConversionResults({
              type: activeTab,
              file: uploadedFile?.name
            });
            setViewMode('preview');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getProgressText = () => {
    if (progress < 30) return '正在提取视频关键信息...';
    if (progress < 60) return '正在生成内容结构...';
    if (progress < 90) return activeTab === 'ppt' ? '正在生成 PPT 版式...' : '正在优化排版...';
    return '即将完成...';
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F5F5F5] dark:bg-[#1a1a1a]">
      {/* 返回按钮 */}
      <div className="p-4 bg-white dark:bg-[#2a2a2a] border-b border-[#E5E5E5] dark:border-gray-700">
        <button
          onClick={() => setViewMode('main')}
          className="flex items-center gap-2 px-4 py-2 text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回主界面
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：视频预览和分段设置 */}
        <div className="w-96 bg-white dark:bg-[#2a2a2a] border-r border-[#E5E5E5] dark:border-gray-700 flex flex-col">
          {/* 视频预览窗 */}
          <div className="p-4 border-b border-[#E5E5E5] dark:border-gray-700">
            <h3 className="text-[#333333] dark:text-white mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-[#2D8CFF]" />
              视频预览
            </h3>
            <div className="aspect-video bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center relative overflow-hidden">
              {uploadedFile ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-[#2D8CFF] flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </button>
                  </div>
                  <p className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                    {uploadedFile.name}
                  </p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">未选择视频文件</p>
              )}
            </div>
            
            {/* 视频进度条 */}
            <div className="mt-3">
              <div className="h-1 bg-[#E5E5E5] dark:bg-[#3a3a3a] rounded-full overflow-hidden">
                <div className="h-full bg-[#2D8CFF] w-1/3 transition-all" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">00:45</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">02:30</span>
              </div>
            </div>
          </div>

          {/* 分段设置 */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#333333] dark:text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#2D8CFF]" />
                分段设置
              </h3>
              <button className="px-3 py-1.5 bg-[#2D8CFF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-1">
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 1, time: '00:00 - 00:45', title: '开场介绍' },
                { id: 2, time: '00:45 - 01:30', title: '核心内容' },
                { id: 3, time: '01:30 - 02:30', title: '总结展望' }
              ].map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#333333] dark:text-white font-medium">
                      第 {segment.id} 段
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {segment.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {segment.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：参数配置区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 标签页切换 */}
          <div className="bg-white dark:bg-[#2a2a2a] border-b border-[#E5E5E5] dark:border-gray-700">
            <div className="flex px-6">
              <button
                onClick={() => setActiveTab('ppt')}
                className={`px-6 py-4 text-sm transition-colors relative ${
                  activeTab === 'ppt'
                    ? 'text-[#2D8CFF]'
                    : 'text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a]'
                }`}
              >
                PPT 转化
                {activeTab === 'ppt' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D8CFF]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('article')}
                className={`px-6 py-4 text-sm transition-colors relative ${
                  activeTab === 'article'
                    ? 'text-[#2D8CFF]'
                    : 'text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a]'
                }`}
              >
                公众号图文
                {activeTab === 'article' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D8CFF]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('blog')}
                className={`px-6 py-4 text-sm transition-colors relative ${
                  activeTab === 'blog'
                    ? 'text-[#2D8CFF]'
                    : 'text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a]'
                }`}
              >
                博客文章
                {activeTab === 'blog' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D8CFF]" />
                )}
              </button>
            </div>
          </div>

          {/* 配置内容区 */}
          <div className="flex-1 overflow-auto p-6 bg-white dark:bg-[#2a2a2a]">
            {activeTab === 'ppt' && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* 基础设置 */}
                <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-[12px] p-6">
                  <h4 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2D8CFF]" />
                    基础设置
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        页数预估
                      </label>
                      <input
                        type="text"
                        value="约 12 页"
                        readOnly
                        className="w-full px-3 py-2 border border-[#E5E5E5] dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2a] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        版式选择
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['文字主导', '图文并重', '全图型'].map((layout) => (
                          <button
                            key={layout}
                            className="px-4 py-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] hover:bg-[#2D8CFF]/5 transition-all"
                          >
                            <AlignLeft className="w-5 h-5 mx-auto mb-1 text-[#2D8CFF]" />
                            <p className="text-xs text-[#333333] dark:text-gray-300">{layout}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                          字体
                        </label>
                        <select className="w-full px-3 py-2 border border-[#E5E5E5] dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#2D8CFF] focus:ring-2 focus:ring-[#2D8CFF]/20 dark:bg-[#2a2a2a] dark:text-white">
                          <option>思源黑体</option>
                          <option>微软雅黑</option>
                          <option>Arial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                          配色方案
                        </label>
                        <select className="w-full px-3 py-2 border border-[#E5E5E5] dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#2D8CFF] focus:ring-2 focus:ring-[#2D8CFF]/20 dark:bg-[#2a2a2a] dark:text-white">
                          <option>商务蓝</option>
                          <option>活力橙</option>
                          <option>专业灰</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 高级设置 */}
                <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-[12px] p-6">
                  <h4 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#2D8CFF]" />
                    高级设置
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">提取视频字幕为 PPT 文本</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">自动识别视频中的语音并转换为文字</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">截取关键帧为 PPT 配图</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">智能识别重要画面并插入到幻灯片中</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">生成演讲备注</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">为每页幻灯片添加演讲提示和要点</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'article' && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* 基础设置 */}
                <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-[12px] p-6">
                  <h4 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2D8CFF]" />
                    基础设置
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        标题生成模式
                      </label>
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-2 border-2 border-[#2D8CFF] bg-[#2D8CFF]/5 text-[#2D8CFF] rounded-lg">
                          自动提取
                        </button>
                        <button className="flex-1 px-4 py-2 border border-[#E5E5E5] dark:border-gray-600 text-[#333333] dark:text-gray-300 rounded-lg hover:border-[#2D8CFF]">
                          手动输入
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        正文风格
                      </label>
                      <select className="w-full px-3 py-2 border border-[#E5E5E5] dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#2D8CFF] focus:ring-2 focus:ring-[#2D8CFF]/20 dark:bg-[#2a2a2a] dark:text-white">
                        <option>正式专业</option>
                        <option>活泼轻松</option>
                        <option>学术严谨</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        配图比例
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['16:9', '4:3', '1:1'].map((ratio) => (
                          <button
                            key={ratio}
                            className="px-4 py-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] hover:bg-[#2D8CFF]/5 transition-all"
                          >
                            <ImageIcon className="w-5 h-5 mx-auto mb-1 text-[#2D8CFF]" />
                            <p className="text-xs text-[#333333] dark:text-gray-300">{ratio}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 高级设置 */}
                <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-[12px] p-6">
                  <h4 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#2D8CFF]" />
                    高级设置
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">添加引导关注语</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">在文末自动添加关注提示</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">自动生成摘要</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">在开头生成内容概要</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">适配公众号编辑器格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">可直接复制粘贴到微信编辑器</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'blog' && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* 基础设置 */}
                <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-[12px] p-6">
                  <h4 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2D8CFF]" />
                    基础设置
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        文章结构
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: '总分总', icon: List },
                          { label: '递进式', icon: Hash },
                          { label: '清单式', icon: AlignLeft }
                        ].map((structure) => (
                          <button
                            key={structure.label}
                            className="px-4 py-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] hover:bg-[#2D8CFF]/5 transition-all"
                          >
                            <structure.icon className="w-5 h-5 mx-auto mb-1 text-[#2D8CFF]" />
                            <p className="text-xs text-[#333333] dark:text-gray-300">{structure.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        语言风格
                      </label>
                      <select className="w-full px-3 py-2 border border-[#E5E5E5] dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#2D8CFF] focus:ring-2 focus:ring-[#2D8CFF]/20 dark:bg-[#2a2a2a] dark:text-white">
                        <option>口语化</option>
                        <option>书面化</option>
                        <option>技术性</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                        关键词密度（SEO 优化）
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="50"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>低</span>
                        <span>中</span>
                        <span>高</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 高级设置 */}
                <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-[12px] p-6">
                  <h4 className="text-[#333333] dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#2D8CFF]" />
                    高级设置
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">自动生成小标题</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">为文章各部分添加醒目的标题</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">添加引用标注</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">为引用内容添加来源说明</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" defaultChecked />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">适配主流博客平台格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">支持 WordPress、知乎专栏等</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部操作区 */}
          <div className="bg-white dark:bg-[#2a2a2a] border-t border-[#E5E5E5] dark:border-gray-700 p-6">
            {isGenerating ? (
              <div className="max-w-3xl mx-auto">
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#333333] dark:text-white">{getProgressText()}</span>
                    <span className="text-sm text-[#2D8CFF]">{progress}%</span>
                  </div>
                  <div className="h-2 bg-[#E5E5E5] dark:bg-[#3a3a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto flex gap-4">
                <button
                  onClick={handlePreview}
                  className="flex-1 px-6 py-3 border-2 border-[#2D8CFF] text-[#2D8CFF] rounded-[8px] hover:bg-[#2D8CFF]/5 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  预览
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white rounded-[8px] hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 4px 12px rgba(45, 140, 255, 0.3)' }}
                >
                  <Zap className="w-5 h-5" />
                  生成
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
