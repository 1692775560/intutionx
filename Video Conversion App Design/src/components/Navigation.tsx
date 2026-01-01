import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8CFF] to-[#1a6dd4] flex items-center justify-center">
              <span className="text-white font-bold">VC</span>
            </div>
            <span className="text-white font-medium text-lg">VidConvert</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              功能特性
            </a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              工作原理
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              定价
            </a>
            <button className="px-6 py-2 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white rounded-full hover:brightness-110 transition-all">
              立即开始
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 animate-fade-in">
            <a href="#features" className="block text-gray-300 hover:text-white transition-colors">
              功能特性
            </a>
            <a href="#how-it-works" className="block text-gray-300 hover:text-white transition-colors">
              工作原理
            </a>
            <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">
              定价
            </a>
            <button className="w-full px-6 py-2 bg-gradient-to-r from-[#2D8CFF] to-[#1a6dd4] text-white rounded-full hover:brightness-110 transition-all">
              立即开始
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
