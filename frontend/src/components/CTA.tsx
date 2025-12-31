import { ArrowRight, Check } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main CTA Card */}
        <div className="relative bg-gradient-to-br from-[#2D8CFF]/20 to-purple-500/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12 md:p-16 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2D8CFF]/30 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px]" />

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl text-white mb-6">
                准备好提升您的内容创作效率了吗？
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                立即开始使用 VidConvert，体验 AI 驱动的智能转换
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-[#2D8CFF] rounded-full hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 group">
                  免费开始使用
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20">
                  查看定价方案
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              {[
                '无需信用卡',
                '每月 10 次免费转换',
                '24/7 客户支持'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center justify-center gap-2 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            {
              name: '免费版',
              price: '¥0',
              period: '永久免费',
              features: ['每月 10 次转换', '基础模板', '标准画质', '社区支持'],
              popular: false
            },
            {
              name: '专业版',
              price: '¥99',
              period: '/月',
              features: ['无限次转换', '高级模板', '超清画质', '优先支持', '自定义水印', 'API 访问'],
              popular: true
            },
            {
              name: '企业版',
              price: '定制',
              period: '联系销售',
              features: ['专属服务器', '批量处理', '团队协作', '定制开发', '专属客户经理', 'SLA 保障'],
              popular: false
            }
          ].map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/5 backdrop-blur-sm border ${
                plan.popular ? 'border-[#2D8CFF]' : 'border-white/10'
              } rounded-2xl p-8 hover:bg-white/10 transition-all ${
                plan.popular ? 'md:-translate-y-4' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white text-sm rounded-full">
                  最受欢迎
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl text-white mb-2">{plan.name}</h3>
                <div className="flex items-end justify-center gap-1 mb-1">
                  <span className="text-4xl text-white">{plan.price}</span>
                  <span className="text-gray-400 pb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-full transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white hover:brightness-110 shadow-lg shadow-[#2D8CFF]/25'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {plan.price === '定制' ? '联系销售' : '选择方案'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
