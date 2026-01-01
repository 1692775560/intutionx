import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    产品: ['功能特性', '定价方案', '使用案例', '更新日志'],
    资源: ['帮助文档', '视频教程', 'API 文档', '开发者社区'],
    公司: ['关于我们', '加入我们', '联系我们', '隐私政策'],
    支持: ['常见问题', '在线客服', '反馈建议', '服务状态']
  };

  return (
    <footer className="relative border-t border-white/10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8CFF] to-[#1a6dd4] flex items-center justify-center">
                <span className="text-white font-bold">VC</span>
              </div>
              <span className="text-white font-medium text-lg">VidConvert</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-xs">
              基于 AI 技术的智能视频内容转换平台，让内容创作更简单高效。
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5 text-gray-300" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Github className="w-5 h-5 text-gray-300" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5 text-gray-300" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Mail className="w-5 h-5 text-gray-300" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 VidConvert. 保留所有权利。
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                服务条款
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                隐私政策
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Cookie 政策
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
