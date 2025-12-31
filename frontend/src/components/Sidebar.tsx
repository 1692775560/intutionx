import { MessageSquarePlus, Code2, Presentation, Sparkles, History, Menu } from 'lucide-react';
import { PageView } from '../App';
import { useState } from 'react';
import logoImage from 'figma:asset/02f64196dcb384f26a2d9e24a90507ab21e27a7c.png';

interface SidebarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
}

export function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'home' as PageView, icon: MessageSquarePlus, label: 'New Chat', shortcut: '⌘ K' },
    { id: 'code' as PageView, icon: Code2, label: 'Video to Code' },
    { id: 'ppt' as PageView, icon: Presentation, label: 'Slides' },
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#f7f7f8] border-r border-gray-200 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Mora Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-medium text-gray-900">Mora</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              currentPage === item.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-400">{item.shortcut}</span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* History Section */}
      <div className="border-t border-gray-200 p-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors">
          <History className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left text-sm">History</span>}
        </button>
      </div>

      {/* User Section */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}