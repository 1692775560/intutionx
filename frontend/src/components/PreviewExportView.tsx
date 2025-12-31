import { useState } from 'react';
import { ArrowLeft, FileText, Download, Share2, Mail, Edit3, Image as ImageIcon, Type, ChevronLeft, ChevronRight, Copy, CheckCircle, QrCode } from 'lucide-react';
import { ViewMode } from '../App';

interface PreviewExportViewProps {
  conversionResults: any;
  setViewMode: (mode: ViewMode) => void;
}

export function PreviewExportView({ conversionResults, setViewMode }: PreviewExportViewProps) {
  const [previewType, setPreviewType] = useState<'ppt' | 'article' | 'blog'>('ppt');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalPages = 12; // PPT 总页数

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F5F5F5] dark:bg-[#1a1a1a]">
      {/* 顶部操作栏 */}
      <div className="bg-white dark:bg-[#2a2a2a] border-b border-[#E5E5E5] dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('professional')}
            className="flex items-center gap-2 px-4 py-2 text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回编辑
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                isEditing
                  ? 'bg-[#2D8CFF] text-white'
                  : 'border border-[#E5E5E5] dark:border-gray-600 text-[#333333] dark:text-gray-300 hover:border-[#2D8CFF]'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? '完成编辑' : '在线编辑'}
            </button>
            
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 border border-[#E5E5E5] dark:border-gray-600 text-[#333333] dark:text-gray-300 rounded-lg hover:border-[#2D8CFF] transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧预览区 */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#2a2a2a]">
          {/* 格式切换 */}
          <div className="border-b border-[#E5E5E5] dark:border-gray-700 px-6 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewType('ppt')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  previewType === 'ppt'
                    ? 'bg-[#2D8CFF] text-white'
                    : 'bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a]'
                }`}
              >
                PPT
              </button>
              <button
                onClick={() => setPreviewType('article')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  previewType === 'article'
                    ? 'bg-[#2D8CFF] text-white'
                    : 'bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a]'
                }`}
              >
                公众号图文
              </button>
              <button
                onClick={() => setPreviewType('blog')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  previewType === 'blog'
                    ? 'bg-[#2D8CFF] text-white'
                    : 'bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a]'
                }`}
              >
                博客文章
              </button>
            </div>
          </div>

          {/* 预览内容 */}
          <div className="flex-1 overflow-auto p-8">
            {previewType === 'ppt' && (
              <div className="max-w-4xl mx-auto">
                {/* PPT 幻灯片预览 */}
                <div
                  className="aspect-[16/9] bg-gradient-to-br from-[#2D8CFF] to-[#1a6dd4] rounded-[12px] flex items-center justify-center relative overflow-hidden"
                  style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
                    <h1 className="text-4xl mb-6 text-center">视频内容转化演示</h1>
                    <p className="text-xl text-white/80">第 {currentPage} 页</p>
                    <div className="absolute bottom-8 right-8 text-sm text-white/60">
                      VidConvert 自动生成
                    </div>
                  </div>
                </div>

                {/* 翻页控制 */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </button>
                  
                  <span className="text-[#333333] dark:text-white">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 在线编辑工具 */}
                {isEditing && (
                  <div className="mt-6 p-4 bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg">
                    <h4 className="text-[#333333] dark:text-white mb-3">编辑工具</h4>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white dark:bg-[#2a2a2a] border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] transition-all flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        修改文本
                      </button>
                      <button className="px-4 py-2 bg-white dark:bg-[#2a2a2a] border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] transition-all flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        替换图片
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewType === 'article' && (
              <div className="max-w-2xl mx-auto bg-white dark:bg-[#2a2a2a] rounded-[12px] p-8" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                <h1 className="text-3xl text-[#333333] dark:text-white mb-4">
                  视频内容精华提炼：核心要点解析
                </h1>
                <div className="text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-[#E5E5E5] dark:border-gray-700">
                  <p>发布时间：2025-12-31 | 阅读时间：5 分钟</p>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
                    本文通过对视频内容的深度分析，为您提炼出最核心的观点和要点。我们采用了智能算法，确保每一个重要信息都不会被遗漏。
                  </p>
                  
                  <h2 className="text-2xl text-[#333333] dark:text-white mt-8 mb-4">一、核心观点</h2>
                  <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
                    通过视频分析，我们发现了三个关键要点...
                  </p>
                  
                  <div className="aspect-video bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center my-6">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  
                  <h2 className="text-2xl text-[#333333] dark:text-white mt-8 mb-4">二、详细解读</h2>
                  <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
                    接下来我们将深入探讨每个要点的具体内容和实践意义...
                  </p>
                  
                  <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] p-4 rounded-lg my-6">
                    <p className="text-[#333333] dark:text-gray-300 text-center">
                      💡 点赞、在看、转发，让更多人看到这篇文章
                    </p>
                  </div>
                </div>
              </div>
            )}

            {previewType === 'blog' && (
              <div className="max-w-3xl mx-auto">
                <article className="bg-white dark:bg-[#2a2a2a] rounded-[12px] p-10" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <header className="mb-8">
                    <h1 className="text-4xl text-[#333333] dark:text-white mb-4">
                      从视频到博客：内容创作新思路
                    </h1>
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                      <span>2025年12月31日</span>
                      <span>·</span>
                      <span>技术分享</span>
                      <span>·</span>
                      <span>8 分钟阅读</span>
                    </div>
                  </header>

                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-2xl text-[#333333] dark:text-white mt-8 mb-4">引言</h2>
                    <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
                      在数字内容创作的时代，如何高效地将视频内容转化为文字形式，成为了许多创作者关注的焦点。本文将为您介绍一种全新的内容转化思路。
                    </p>

                    <h2 className="text-2xl text-[#333333] dark:text-white mt-8 mb-4">核心方法</h2>
                    <ul className="list-disc list-inside text-[#333333] dark:text-gray-300 space-y-2 mb-4">
                      <li>自动提取视频中的关键信息点</li>
                      <li>智能生成结构化的文章框架</li>
                      <li>优化 SEO 关键词布局</li>
                      <li>适配多平台发布格式</li>
                    </ul>

                    <div className="aspect-video bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg flex items-center justify-center my-8">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>

                    <h2 className="text-2xl text-[#333333] dark:text-white mt-8 mb-4">实践案例</h2>
                    <p className="text-[#333333] dark:text-gray-300 leading-relaxed mb-4">
                      让我们通过一个实际案例来看看这种方法的效果...
                    </p>

                    <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] p-6 rounded-lg my-6">
                      <h3 className="text-lg text-[#333333] dark:text-white mb-2">💡 小贴士</h3>
                      <p className="text-[#333333] dark:text-gray-300">
                        在转化过程中，保持内容的核心价值不变是最重要的原则。
                      </p>
                    </div>

                    <h2 className="text-2xl text-[#333333] dark:text-white mt-8 mb-4">总结</h2>
                    <p className="text-[#333333] dark:text-gray-300 leading-relaxed">
                      通过系统化的方法，我们可以高效地将视频内容转化为优质的博客文章，为内容创作开辟新的可能性。
                    </p>
                  </div>
                </article>
              </div>
            )}
          </div>
        </div>

        {/* 右侧导出区 */}
        <div className="w-80 bg-white dark:bg-[#2a2a2a] border-l border-[#E5E5E5] dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-[#E5E5E5] dark:border-gray-700">
            <h3 className="text-[#333333] dark:text-white mb-1 flex items-center gap-2">
              <Download className="w-5 h-5 text-[#2D8CFF]" />
              导出设置
            </h3>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* 格式选择 */}
            <div>
              <h4 className="text-[#333333] dark:text-white mb-3">导出格式</h4>
              <div className="space-y-2">
                {previewType === 'ppt' && (
                  <>
                    <label className="flex items-center gap-3 p-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] cursor-pointer transition-all">
                      <input type="radio" name="format" defaultChecked className="w-4 h-4 text-[#2D8CFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">PPTX 格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">可编辑的演示文稿</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] cursor-pointer transition-all">
                      <input type="radio" name="format" className="w-4 h-4 text-[#2D8CFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">PDF 格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">便于分享和打印</p>
                      </div>
                    </label>
                  </>
                )}
                
                {previewType === 'article' && (
                  <>
                    <label className="flex items-center gap-3 p-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] cursor-pointer transition-all">
                      <input type="radio" name="format" defaultChecked className="w-4 h-4 text-[#2D8CFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">HTML 格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">适配公众号编辑器</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] cursor-pointer transition-all">
                      <input type="radio" name="format" className="w-4 h-4 text-[#2D8CFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">Word 格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">便于二次编辑</p>
                      </div>
                    </label>
                  </>
                )}
                
                {previewType === 'blog' && (
                  <>
                    <label className="flex items-center gap-3 p-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] cursor-pointer transition-all">
                      <input type="radio" name="format" defaultChecked className="w-4 h-4 text-[#2D8CFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">Markdown 格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">适配多数博客平台</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-[#E5E5E5] dark:border-gray-600 rounded-lg hover:border-[#2D8CFF] cursor-pointer transition-all">
                      <input type="radio" name="format" className="w-4 h-4 text-[#2D8CFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] dark:text-white">TXT 格式</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">纯文本格式</p>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* 批量导出 */}
            <div>
              <h4 className="text-[#333333] dark:text-white mb-3">批量导出</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" />
                  <span className="text-sm text-[#333333] dark:text-gray-300">包含 PPT</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" />
                  <span className="text-sm text-[#333333] dark:text-gray-300">包含公众号图文</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#2D8CFF] rounded" />
                  <span className="text-sm text-[#333333] dark:text-gray-300">包含博客文章</span>
                </label>
              </div>
              <button className="w-full mt-3 px-4 py-2 border border-[#E5E5E5] dark:border-gray-600 text-[#333333] dark:text-gray-300 rounded-lg hover:border-[#2D8CFF] transition-all">
                打包为 ZIP
              </button>
            </div>

            {/* 分享功能 */}
            <div>
              <h4 className="text-[#333333] dark:text-white mb-3">快速分享</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] transition-all">
                  微信
                </button>
                <button className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] transition-all">
                  微博
                </button>
                <button className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] transition-all flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4" />
                  邮箱
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#4a4a4a] transition-all flex items-center justify-center gap-1"
                >
                  <QrCode className="w-4 h-4" />
                  二维码
                </button>
              </div>
            </div>
          </div>

          {/* 导出按钮 */}
          <div className="p-6 border-t border-[#E5E5E5] dark:border-gray-700">
            <button
              className="w-full px-6 py-3 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white rounded-[8px] hover:brightness-110 transition-all flex items-center justify-center gap-2"
              style={{ boxShadow: '0 4px 12px rgba(45, 140, 255, 0.3)' }}
            >
              <Download className="w-5 h-5" />
              立即导出
            </button>
          </div>
        </div>
      </div>

      {/* 分享弹窗 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-[#2a2a2a] rounded-[12px] p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl text-[#333333] dark:text-white mb-6">分享内容</h3>
            
            {/* 二维码 */}
            <div className="bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg p-8 mb-6 flex items-center justify-center">
              <div className="w-48 h-48 bg-white dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                <QrCode className="w-24 h-24 text-gray-400" />
              </div>
            </div>

            {/* 分享链接 */}
            <div className="mb-6">
              <label className="block text-sm text-[#333333] dark:text-gray-300 mb-2">
                分享链接
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="https://vidconvert.app/share/abc123"
                  readOnly
                  className="flex-1 px-3 py-2 border border-[#E5E5E5] dark:border-gray-600 rounded-lg bg-[#F5F5F5] dark:bg-[#3a3a3a] text-[#333333] dark:text-white"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-[#2D8CFF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 border border-[#E5E5E5] dark:border-gray-600 text-[#333333] dark:text-gray-300 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
