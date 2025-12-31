import { FileText, Image, BookOpen, Zap, Brain, Globe } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: FileText,
      title: 'PPT 生成',
      description: '自动提取视频要点，生成结构清晰的演示文稿，支持多种模板和配色方案',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Image,
      title: '公众号图文',
      description: '智能转换为适配公众号编辑器的图文内容，一键复制粘贴即可发布',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BookOpen,
      title: '博客文章',
      description: '生成结构化的长文章，优化 SEO 关键词，支持 Markdown 等多种格式',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Brain,
      title: 'AI 智能分析',
      description: '深度理解视频内容，准确提取核心观点和关键信息，保持原意不变形',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: '极速转换',
      description: '采用最新 AI 技术，平均 2 分钟即可完成转换，大幅提升工作效率',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Globe,
      title: '多平台适配',
      description: '支持导出多种格式，完美适配各大内容平台，让分享更便捷',
      color: 'from-teal-500 to-blue-500'
    }
  ];

  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-white mb-4">
            强大的功能特性
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            基于先进的 AI 技术，为您提供全方位的视频内容转换解决方案
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="px-8 py-4 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white rounded-full hover:brightness-110 transition-all shadow-lg shadow-[#2D8CFF]/25">
            免费试用所有功能
          </button>
        </div>
      </div>
    </section>
  );
}
