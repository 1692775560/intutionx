import { Upload, Settings, Sparkles, Download } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: '上传视频',
      description: '拖拽或选择您的视频文件，支持多种格式',
      step: '01'
    },
    {
      icon: Settings,
      title: '选择转换类型',
      description: '选择 PPT、图文或博客，自定义转换参数',
      step: '02'
    },
    {
      icon: Sparkles,
      title: 'AI 智能处理',
      description: '系统自动分析视频内容，生成高质量输出',
      step: '03'
    },
    {
      icon: Download,
      title: '下载使用',
      description: '预览编辑后导出，支持多种格式和平台',
      step: '04'
    }
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-white mb-4">
            工作原理
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            只需四个简单步骤，即可完成视频内容的智能转换
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-[#2D8CFF] to-[#1a6dd4] rounded-full flex items-center justify-center shadow-lg shadow-[#2D8CFF]/50">
                    <span className="text-white font-bold">{step.step}</span>
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6 mt-4">
                    <step.icon className="w-7 h-7 text-[#2D8CFF]" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (Desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent -translate-y-1/2 z-10">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/20 rotate-45 translate-x-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-20 relative">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-2 shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] rounded-2xl flex items-center justify-center relative overflow-hidden">
              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>

              {/* Placeholder Content */}
              <div className="relative text-center px-8">
                <Sparkles className="w-16 h-16 text-[#2D8CFF] mx-auto mb-4 animate-pulse" />
                <p className="text-xl text-white mb-2">观看演示视频</p>
                <p className="text-gray-400">了解 VidConvert 的强大功能</p>
              </div>

              {/* Play Button */}
              <button className="absolute inset-0 flex items-center justify-center group">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
