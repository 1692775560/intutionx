import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Zap, BookOpen, Share2, FileText, CheckSquare, ArrowRight, Play, Code2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { createSession } from "@/lib/api";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("video-to-code");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleFeatureClick = (featureId: string) => {
    if (featureId === "video-to-code") {
      setSelectedFeature(featureId);
    } else {
      showToast("即将上线");
    }
  };

  const handleStartClick = async () => {
    if (!videoUrl.trim()) return;
    
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

  const features = [
    {
      id: "video-to-code",
      name: "Video to Code",
      icon: Zap,
    },
    {
      id: "deep-research",
      name: "Deep Research",
      icon: BookOpen,
    },
    {
      id: "social-post",
      name: "Social Post",
      icon: Share2,
    },
    {
      id: "slides",
      name: "Slides",
      icon: FileText,
    },
    {
      id: "todo-list",
      name: "Todo List",
      icon: CheckSquare,
    },
  ];

  const caseStudies = [
    {
      id: 1,
      title: "Python 爬虫教程",
      description: "30秒学会网页数据爬取",
      code: "def scrape_data():\n    return data",
      tags: ["Coding", "Python"],
    },
    {
      id: 2,
      title: "Excel 数据处理",
      description: "自动化数据清洗与分析",
      code: "df.groupby().sum()",
      tags: ["Coding", "Data"],
    },
    {
      id: 3,
      title: "API 集成指南",
      description: "快速接入第三方服务",
      code: "requests.get(url)",
      tags: ["Coding", "API"],
    },
    {
      id: 4,
      title: "JavaScript 优化",
      description: "性能提升 50%+ 的技巧",
      code: "const optimize = () => {}",
      tags: ["Coding", "Web"],
    },
  ];

  const companies = ["OpenAI", "Google", "Meta", "Microsoft", "Anthropic", "Hugging Face"];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Mora</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">English</span>
            <Button variant="outline" size="sm">Upgrade</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-100 rounded-full">
            <span className="text-sm font-semibold text-purple-700">✨ Introducing Mora</span>
          </div>
          
          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Videos into <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Executable Code</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            The autonomous agent that watches your coding videos and instantly generates production-ready code. Learn smarter, code faster.
          </p>

          {/* Input Section */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mb-12">
            <div className="flex gap-3 mb-6">
              <Input
                placeholder="Paste your video URL here..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 h-12 text-base border-gray-300"
              />
              <Button
                onClick={handleStartClick}
                disabled={!videoUrl.trim() || isLoading}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                {isLoading ? "处理中..." : "Start"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {/* Feature Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {features.map((feature) => {
                const IconComponent = feature.icon;
                const isSelected = feature.id === selectedFeature;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {feature.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
              {toast}
            </div>
          )}

          {/* Trust Section */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Trusted by developers at</p>
            <div className="flex flex-wrap justify-center gap-6 items-center">
              {companies.map((company) => (
                <span key={company} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-gray-900 mb-16 text-center">
            Powerful Capabilities
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Code2,
                title: "Multi-Language Support",
                description: "Generate code in Python, JavaScript, Java, Go, Rust, and more.",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Analysis",
                description: "Advanced logic extraction and semantic understanding of video content.",
              },
              {
                icon: Play,
                title: "Real-time Execution",
                description: "Verify generated code with sandboxed execution and instant feedback.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="p-8 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Creator Build Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-gray-900 mb-4 text-center">Creator Build</h3>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            See what developers are creating with Mora
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {caseStudies.map((caseStudy) => (
              <Card
                key={caseStudy.id}
                className="bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                <div className="p-6">
                  {/* Code Preview */}
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 font-mono text-xs text-green-400 overflow-hidden h-20 group-hover:h-24 transition-all">
                    <pre>{caseStudy.code}</pre>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-semibold text-gray-900 mb-2">{caseStudy.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{caseStudy.description}</p>

                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap">
                    {caseStudy.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <p className="text-5xl font-bold text-purple-600 mb-3">1000+</p>
            <p className="text-lg text-gray-600">Videos Processed</p>
            <p className="text-sm text-gray-500 mt-2">Every day</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-purple-600 mb-3">99.8%</p>
            <p className="text-lg text-gray-600">Code Success Rate</p>
            <p className="text-sm text-gray-500 mt-2">Production ready</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-purple-600 mb-3">&lt;30s</p>
            <p className="text-lg text-gray-600">Average Processing</p>
            <p className="text-sm text-gray-500 mt-2">Lightning fast</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to transform your coding?</h3>
          <p className="text-xl text-purple-100 mb-8">Start with a free trial. No credit card required.</p>
          <Button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Paste your video URL here..."]') as HTMLInputElement;
              if (input) input.focus();
            }}
            className="bg-white text-purple-600 hover:bg-gray-50 font-semibold px-8 py-3 text-lg"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>© 2026 Mora. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}
