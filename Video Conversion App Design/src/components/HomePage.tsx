import { ArrowUp, Sparkles, Code2, Presentation, Wrench, Zap, Globe, FileText, Plus, Heart, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { PageView } from '../App';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import logoImage from 'figma:asset/02f64196dcb384f26a2d9e24a90507ab21e27a7c.png';
import { api } from '../services/api';

interface HomePageProps {
  setCurrentPage: (page: PageView) => void;
}

export function HomePage({ setCurrentPage }: HomePageProps) {
  const [message, setMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [placeholderText, setPlaceholderText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter effect for placeholder
  useEffect(() => {
    const fullText = 'Share a video to unlock its digital potential.';
    const words = fullText.split(' ');
    let currentWordIndex = 0;
    let currentText = '';

    const intervalId = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText += (currentWordIndex > 0 ? ' ' : '') + words[currentWordIndex];
        setPlaceholderText(currentText);
        currentWordIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 150); // 150ms per word for smooth appearance

    return () => clearInterval(intervalId);
  }, []);

  // Handle video URL submission from message input
  const handleVideoSubmit = async () => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Call backend API to create session
      const response = await api.createSession({
        videoUrl: message.trim(),
        language: 'python'
      });

      // Store session ID and video URL
      localStorage.setItem('sessionId', response.sessionId);
      localStorage.setItem('videoUrl', message.trim());

      // Navigate to CodePage
      setCurrentPage('code');
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(error instanceof Error ? error.message : 'Failed to create session. Please try again.');
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    { icon: Code2, text: 'Video to Code' },
    { icon: Zap, text: 'Deep Research' },
    { icon: Sparkles, text: 'Social Post' },
    { icon: Presentation, text: 'Slides' },
    { icon: FileText, text: 'To do list' },
  ];

  const categories = [
    'All',
    'Brand Design',
    'Poster & Ad',
    'Illustration',
    'UI Design',
    'Photography',
    'Typography',
    '3D Art',
  ];

  // Showcase gallery items
  const showcaseItems = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=800&fit=crop',
      author: 'Sarah Chen',
      likes: 1284,
      views: 15632,
      category: 'Brand Design',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop',
      author: 'Alex Kim',
      likes: 892,
      views: 9421,
      category: 'UI Design',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=600&h=700&fit=crop',
      author: 'Maria Garcia',
      likes: 2145,
      views: 23847,
      category: 'Illustration',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=600&h=500&fit=crop',
      author: 'James Park',
      likes: 567,
      views: 7823,
      category: 'Photography',
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&h=900&fit=crop',
      author: 'Emma Wilson',
      likes: 1876,
      views: 19234,
      category: 'Poster & Ad',
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
      author: 'David Lee',
      likes: 1432,
      views: 16789,
      category: '3D Art',
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600&h=750&fit=crop',
      author: 'Sophie Turner',
      likes: 943,
      views: 11245,
      category: 'Typography',
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=600&h=450&fit=crop',
      author: 'Ryan Martinez',
      likes: 2301,
      views: 28456,
      category: 'Brand Design',
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&h=850&fit=crop',
      author: 'Lisa Anderson',
      likes: 1654,
      views: 18923,
      category: 'UI Design',
    },
    {
      id: 10,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=500&fit=crop',
      author: 'Tom Brown',
      likes: 789,
      views: 9567,
      category: 'Photography',
    },
    {
      id: 11,
      image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=600&h=650&fit=crop',
      author: 'Jessica Wu',
      likes: 1567,
      views: 14523,
      category: 'Illustration',
    },
    {
      id: 12,
      image: 'https://images.unsplash.com/photo-1533282960533-51328aa49826?w=600&h=550&fit=crop',
      author: 'Michael Chen',
      likes: 934,
      views: 10234,
      category: 'Typography',
    },
  ];

  const filteredItems = activeCategory === 'All' 
    ? showcaseItems 
    : showcaseItems.filter(item => item.category === activeCategory);

  const handleSend = () => {
    if (message.trim()) {
      // If "Video to Code" action is selected, call API
      if (selectedAction === 'Video to Code') {
        handleVideoSubmit();
      } else {
        console.log('Sending message:', message);
        setMessage('');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Mora Logo" className="w-6 h-6" />
            <span className="font-semibold text-gray-900">Mora</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Sign In
          </button>
          <button className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 hover:scale-105 transition-all">
            Try for Free
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8">
              <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
              <span className="text-sm text-gray-900">AI Assistant Online</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Hello, I'm <span className="text-black">Mora</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Transform video content into production-ready code and assets.
            </p>

            {/* Search Box */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-black rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200">
                  <textarea
                    ref={messageInputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholderText}
                    rows={1}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 pr-14 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50"
                    style={{ minHeight: '60px', maxHeight: '200px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isSubmitting}
                    className={`absolute right-4 bottom-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      message.trim() && !isSubmitting
                        ? 'bg-black hover:bg-gray-800 hover:shadow-lg hover:scale-110 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowUp className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAction(action.text);
                    if (action.text === 'Video to Code') {
                      // Focus on the message input box
                      messageInputRef.current?.focus();
                    } else if (action.text === 'Slides') {
                      setCurrentPage('ppt');
                    }
                  }}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all hover:shadow-md hover:scale-105 ${
                    selectedAction === action.text
                      ? 'bg-blue-500 text-white border border-blue-500'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <action.icon className={`w-4 h-4 transition-colors ${
                    selectedAction === action.text
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-gray-900'
                  }`} />
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Projects Section */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                View All →
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* New Project Card */}
              <button className="aspect-[4/3] bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">New Project</span>
              </button>

              {/* Recent Project Cards */}
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-200">
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100" />
                  <div className="px-3 py-3 bg-white border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-0.5">Untitled</h3>
                    <p className="text-xs text-gray-500">Updated 2025-12-31</p>
                  </div>
                </div>
              </div>

              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-200">
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100" />
                  <div className="px-3 py-3 bg-white border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-0.5">Untitled</h3>
                    <p className="text-xs text-gray-500">Updated 2025-12-31</p>
                  </div>
                </div>
              </div>

              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-200">
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <div className="w-full h-full bg-white rounded shadow-sm" />
                  </div>
                  <div className="px-3 py-3 bg-white border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-0.5">Untitled</h3>
                    <p className="text-xs text-gray-500">Updated 2025-12-31</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Gallery */}
          <div className="mt-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Inspiration Discovery</h2>
              
              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-5 py-2.5 text-sm rounded-full whitespace-nowrap transition-all ${
                      activeCategory === category 
                        ? 'bg-black text-white shadow-md' 
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Masonry Grid */}
            <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}>
              <Masonry gutter="16px">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.author}
                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* Info Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-sm font-medium mb-2">{item.author}</p>
                      <div className="flex items-center justify-between text-white/80 text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{item.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{item.views.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-6">
              <button className="hover:text-gray-700 transition-colors">Terms of Service</button>
              <button className="hover:text-gray-700 transition-colors">Privacy Policy</button>
              <button className="hover:text-gray-700 transition-colors">Help Center</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}