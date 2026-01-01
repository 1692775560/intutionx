import { ChevronDown, Moon, Sun, User } from 'lucide-react';
import { ViewMode } from '../App';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export function Header({ viewMode, setViewMode, isDarkMode, setIsDarkMode }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#2a2a2a] shadow-sm z-50 transition-colors">
      <div className="h-full px-6 flex items-center justify-between">
        {/* 左侧 Logo 和菜单 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8CFF] to-[#1a6dd4] flex items-center justify-center">
              <span className="text-white font-bold">VC</span>
            </div>
            <span className="text-[#333333] dark:text-white font-bold text-lg">VidConvert</span>
          </div>
          
          <nav className="flex items-center gap-1">
            <button className="px-4 py-2 text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors flex items-center gap-1">
              文件上传
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors">
              编辑
            </button>
            <button className="px-4 py-2 text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors">
              设置
            </button>
            <button className="px-4 py-2 text-[#333333] dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors">
              帮助
            </button>
          </nav>
        </div>
        
        {/* 右侧操作区 */}
        <div className="flex items-center gap-4">
          {/* 模式选择 */}
          <div className="flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#3a3a3a] rounded-lg p-1">
            <button
              onClick={() => setViewMode('main')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'main'
                  ? 'bg-white dark:bg-[#4a4a4a] text-[#2D8CFF] shadow-sm'
                  : 'text-[#333333] dark:text-gray-300'
              }`}
            >
              快速转化
            </button>
            <button
              onClick={() => setViewMode('professional')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'professional'
                  ? 'bg-white dark:bg-[#4a4a4a] text-[#2D8CFF] shadow-sm'
                  : 'text-[#333333] dark:text-gray-300'
              }`}
            >
              专业定制
            </button>
          </div>
          
          {/* 账号 */}
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors">
            <User className="w-5 h-5 text-[#333333] dark:text-gray-300" />
            <span className="text-[#333333] dark:text-gray-300">个人</span>
            <ChevronDown className="w-4 h-4 text-[#333333] dark:text-gray-300" />
          </button>
          
          {/* 夜间模式切换 */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-[#333333]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
