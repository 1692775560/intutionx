import { ArrowUp, Code2, Zap, Sparkles, FileText, CheckSquare, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createSession } from "@/lib/api";

// 项目类型
interface Project {
  id: string;
  type: "video-to-code" | "deep-research";
  title: string;
  input: string;
  data: any;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("video-to-code");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [placeholderText, setPlaceholderText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [, setLocation] = useLocation();

  // 加载项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/projects?limit=7");
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  // 打字机效果 - 根据选中功能显示不同提示
  useEffect(() => {
    const texts: Record<string, string> = {
      "video-to-code": "Share a video to unlock its digital potential.",
      "deep-research": "Enter a keyword to explore knowledge graph.",
    };
    const fullText = texts[selectedFeature] || texts["video-to-code"];
    const words = fullText.split(" ");
    let currentWordIndex = 0;
    let currentText = "";

    setPlaceholderText(""); // 重置

    const intervalId = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText += (currentWordIndex > 0 ? " " : "") + words[currentWordIndex];
        setPlaceholderText(currentText);
        currentWordIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 150);

    return () => clearInterval(intervalId);
  }, [selectedFeature]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleFeatureClick = (featureId: string) => {
    if (featureId === "video-to-code" || featureId === "deep-research") {
      setSelectedFeature(featureId);
    } else {
      showToast("即将上线");
    }
  };

  const handleStartClick = async () => {
    if (!videoUrl.trim()) return;

    // Deep Research: 跳转到研究页面
    if (selectedFeature === "deep-research") {
      setLocation(`/research?keyword=${encodeURIComponent(videoUrl.trim())}`);
      return;
    }

    // Video to Code: 创建 session 并跳转
    if (selectedFeature !== "video-to-code") {
      showToast("即将上线");
      return;
    }

    setIsLoading(true);
    try {
      const response = await createSession(videoUrl);
      localStorage.setItem("videoUrl", videoUrl);
      setLocation(`/workspace?session=${response.sessionId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      showToast("创建任务失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartClick();
    }
  };

  // 点击项目卡片
  const handleProjectClick = (project: Project) => {
    if (project.type === "video-to-code") {
      // 跳转到 workspace，使用保存的数据
      const videoUrl = project.data?.video_url || project.input;
      localStorage.setItem("videoUrl", videoUrl);
      // 如果有保存的 session，可以恢复；否则创建新的
      setLocation(`/workspace?projectId=${project.id}`);
    } else if (project.type === "deep-research") {
      // 跳转到 research 页面
      const keyword = project.data?.keyword || project.input;
      setLocation(`/research?keyword=${encodeURIComponent(keyword)}`);
    }
  };

  // 删除项目
  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // 阻止触发卡片点击
    
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setProjects(projects.filter(p => p.id !== projectId));
        showToast("项目已删除");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      showToast("删除失败");
    }
  };

  const features = [
    { id: "video-to-code", name: "Video to Code", icon: Code2 },
    { id: "deep-research", name: "Deep Research", icon: Zap },
    { id: "social-post", name: "Social Post", icon: Sparkles },
    { id: "slides", name: "Slides", icon: FileText },
    { id: "todo-list", name: "To do list", icon: CheckSquare },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Mora" className="w-8 h-8" />
          <span className="font-semibold text-gray-900 text-lg">Mora</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Sign In
          </button>
          <button className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 hover:scale-105 transition-all">
            Try for Free
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Hello, I'm <span className="text-black">Mora</span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Transform video content into production-ready code and assets.
            </p>

            {/* Search Box */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-black rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity" />
                <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200">
                  <textarea
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholderText}
                    rows={1}
                    className="w-full px-6 py-4 pr-14 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400"
                    style={{ minHeight: "60px", maxHeight: "200px" }}
                  />
                  <button
                    onClick={handleStartClick}
                    disabled={!videoUrl.trim() || isLoading}
                    className={`absolute right-4 bottom-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      videoUrl.trim() && !isLoading
                        ? "bg-black hover:bg-gray-800 hover:shadow-lg hover:scale-110 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature.id)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all hover:shadow-md hover:scale-105 ${
                    selectedFeature === feature.id
                      ? "bg-blue-500 text-white border border-blue-500"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <feature.icon
                    className={`w-4 h-4 transition-colors ${
                      selectedFeature === feature.id
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-900"
                    }`}
                  />
                  <span>{feature.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Projects Section */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
              {projects.length > 0 && (
                <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  View All →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* New Project Card */}
              <button 
                onClick={() => setVideoUrl("")}
                className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:from-gray-100 hover:to-gray-150 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm group-hover:shadow-md flex items-center justify-center transition-all group-hover:scale-110">
                  <Plus className="w-7 h-7 text-gray-500 group-hover:text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">New Project</span>
              </button>

              {/* Recent Project Cards */}
              {projects.length > 0 ? (
                projects.slice(0, 7).map((project) => {
                  // 优先使用项目保存的封面图片，否则使用默认图片
                  const bgImage = project.data?.cover_image || 
                    (project.type === "video-to-code" 
                      ? "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"
                      : "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop");
                  
                  return (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 relative"
                    >
                      <div className="h-full flex flex-col">
                        {/* 项目封面 - 使用真实图片 */}
                        <div className="flex-1 relative overflow-hidden">
                          <img 
                            src={bgImage} 
                            alt="" 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* 渐变遮罩 */}
                          <div className={`absolute inset-0 ${
                            project.type === "video-to-code" 
                              ? "bg-gradient-to-br from-blue-600/80 to-indigo-700/80" 
                              : "bg-gradient-to-br from-emerald-500/80 to-teal-600/80"
                          } mix-blend-multiply`} />
                          

                          
                          {/* 类型标签 */}
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] text-white font-medium">
                              {project.type === "video-to-code" ? "Video" : "Research"}
                            </span>
                          </div>
                        </div>
                        
                        {/* 项目信息 */}
                        <div className="px-3 py-3 bg-white">
                          <h3 className="text-sm font-medium text-gray-900 mb-0.5 truncate">
                            {project.title || "Untitled"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(project.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/30 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  );
                })
              ) : (
                // 空状态占位
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center"
                  >
                    <p className="text-xs text-gray-400">No projects yet</p>
                  </div>
                ))
              )}
            </div>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
