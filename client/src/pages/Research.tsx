import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, ArrowUp, MessageSquare, X, Play, ChevronRight, Loader2, GripVertical, RefreshCw } from "lucide-react";
import { Graph } from "@antv/g6";

// 知识图谱数据类型
interface KnowledgeNode {
  id: string;
  label: string;
  description: string;
  level: number;
}

interface KnowledgeEdge {
  source: string;
  target: string;
  relation: string;
}

interface NodeDetail {
  label: string;
  description: string;
  relatedVideos: Array<{
    title: string;
    url: string;
    platform: string;
  }>;
}

// 详情面板实例（支持多个同时显示）
interface DetailPanel {
  id: string;
  node: KnowledgeNode;
  detail: NodeDetail;
  pos: { x: number; y: number };
  size: { width: number; height: number };
}

export default function Research() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  // 多个详情面板
  const [detailPanels, setDetailPanels] = useState<DetailPanel[]>([]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [chatTargetNode, setChatTargetNode] = useState<KnowledgeNode | null>(null);
  const [chatTargetDetail, setChatTargetDetail] = useState<NodeDetail | null>(null);

  // 详情面板拖拽状态
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const [resizingPanelId, setResizingPanelId] = useState<string | null>(null);
  const panelDragOffset = useRef({ x: 0, y: 0 });

  // 对话框拖拽和缩放状态
  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });
  const [chatSize, setChatSize] = useState({ width: 380, height: 480 });
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const chatDragOffset = useRef({ x: 0, y: 0 });

  // 初始化面板位置（在客户端）- 不再需要，每个面板创建时单独设置位置
  const nextPanelOffset = useRef(0);

  // 初始化聊天窗口位置
  useEffect(() => {
    setChatPos({ x: window.innerWidth - 400, y: window.innerHeight - 520 });
  }, []);

  // 模拟知识图谱数据
  const [graphData, setGraphData] = useState<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } | null>(null);

  // 保存项目到数据库
  const saveProject = async (kw: string, graph: any) => {
    try {
      await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deep-research",
          title: `Research: ${kw}`,
          input: kw,
          data: {
            keyword: kw,
            graph: graph,
          },
          userId: "default_user",
        }),
      });
      console.log("[Research] 项目已保存");
    } catch (error) {
      console.error("[Research] 保存项目失败:", error);
    }
  };

  // Debug: 监控状态变化
  useEffect(() => {
    console.log("[Research] 状态变化 - detailPanels:", detailPanels.length);
  }, [detailPanels]);

  // 强制刷新图谱
  const refreshGraph = () => {
    if (keyword) {
      // 清除缓存
      const cacheKey = `research_graph_${keyword}`;
      sessionStorage.removeItem(cacheKey);
      // 重新生成
      generateGraph(keyword);
    }
  };

  // 从 URL 获取关键词
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const kw = params.get("keyword");
    if (kw) {
      setKeyword(kw);
      // 检查 sessionStorage 缓存
      const cacheKey = `research_graph_${kw}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        console.log("[Research] 使用缓存数据:", kw);
        setGraphData(JSON.parse(cached));
      } else {
        generateGraph(kw);
      }
    }
  }, [searchString]);

  // 生成知识图谱
  const generateGraph = async (kw: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/research/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate graph");
      }
      
      const data = await response.json();
      const graphResult = {
        nodes: data.nodes,
        edges: data.edges,
      };
      
      // 缓存到 sessionStorage
      const cacheKey = `research_graph_${kw}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(graphResult));
      console.log("[Research] 已缓存图谱数据:", kw);
      
      setGraphData(graphResult);
      
      // 保存项目到数据库
      saveProject(kw, graphResult);
    } catch (error) {
      console.error("Failed to generate graph:", error);
      // 降级：使用模拟数据
      const mockData = {
        nodes: [
          { id: "0", label: kw, description: `${kw} 是一个重要的技术概念`, level: 0 },
          { id: "1", label: "相关概念1", description: "描述1", level: 1 },
          { id: "2", label: "相关概念2", description: "描述2", level: 1 },
        ],
        edges: [
          { source: "0", target: "1", relation: "相关" },
          { source: "0", target: "2", relation: "相关" },
        ],
      };
      setGraphData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化 G6 图谱
  useEffect(() => {
    if (!graphData || !graphContainerRef.current) return;

    // 清理旧图
    if (graphRef.current) {
      graphRef.current.destroy();
    }

    const container = graphContainerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // 转换数据格式为 G6 格式
    const g6Data = {
      nodes: graphData.nodes.map(node => ({
        id: node.id,
        data: {
          label: node.label,
          description: node.description,
          level: node.level,
        },
      })),
      edges: graphData.edges.map((edge, idx) => ({
        id: `edge-${idx}`,
        source: edge.source,
        target: edge.target,
        data: { relation: edge.relation },
      })),
    };

    // 根据层级设置颜色
    const levelColors = {
      0: { fill: "#6366F1", stroke: "#4F46E5", text: "#FFFFFF" }, // 中心 - 紫色
      1: { fill: "#3B82F6", stroke: "#2563EB", text: "#FFFFFF" }, // 核心 - 蓝色
      2: { fill: "#10B981", stroke: "#059669", text: "#FFFFFF" }, // 子概念 - 绿色
      3: { fill: "#F59E0B", stroke: "#D97706", text: "#FFFFFF" }, // 细节 - 橙色
    };

    const graph = new Graph({
      container,
      width,
      height,
      data: g6Data,
      autoFit: "view",
      padding: 80,
      layout: {
        type: "dagre",
        rankdir: "TB",
        nodesep: 60,  // 增加节点间距
        ranksep: 100, // 增加层级间距
        align: "UL",
      },
      node: {
        type: "rect",
        style: {
          size: (d: any) => {
            const label = d.data.label || "";
            // 更精确的宽度计算，中文字符约 14px，英文约 8px
            const charWidth = /[\u4e00-\u9fa5]/.test(label) ? 14 : 8;
            const baseWidth = Math.max(label.length * charWidth + 24, 80);
            const level = d.data.level || 0;
            // 根据层级调整大小
            if (level === 0) return [baseWidth + 40, 48];
            if (level === 1) return [baseWidth + 20, 42];
            if (level === 2) return [baseWidth + 10, 36];
            return [baseWidth, 32];
          },
          radius: (d: any) => {
            const level = d.data.level || 0;
            return level === 0 ? 24 : level === 1 ? 20 : 16;
          },
          fill: (d: any) => {
            const level = d.data.level || 0;
            const colors = levelColors[level as keyof typeof levelColors] || levelColors[3];
            return colors.fill;
          },
          stroke: (d: any) => {
            const level = d.data.level || 0;
            const colors = levelColors[level as keyof typeof levelColors] || levelColors[3];
            return colors.stroke;
          },
          lineWidth: 2,
          shadowColor: "rgba(0, 0, 0, 0.1)",
          shadowBlur: 12,
          shadowOffsetY: 4,
          labelText: (d: any) => {
            const label = d.data.label || "";
            // 截断过长的标签
            return label.length > 8 ? label.slice(0, 7) + "…" : label;
          },
          labelFill: (d: any) => {
            const level = d.data.level || 0;
            const colors = levelColors[level as keyof typeof levelColors] || levelColors[3];
            return colors.text;
          },
          labelFontSize: (d: any) => {
            const level = d.data.level || 0;
            return level === 0 ? 14 : level === 1 ? 13 : 12;
          },
          labelFontWeight: (d: any) => (d.data.level === 0 ? 700 : 600),
          labelPlacement: "center",
          cursor: "pointer",
        },
        state: {
          selected: {
            stroke: "#EC4899",
            lineWidth: 3,
            shadowColor: "rgba(236, 72, 153, 0.4)",
            shadowBlur: 16,
          },
          hover: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
      },
      edge: {
        style: {
          stroke: "#94A3B8",
          lineWidth: 2,
          endArrow: true,
          // 添加边的标签（关系）
          labelText: (d: any) => d.data.relation || "",
          labelFontSize: 10,
          labelFill: "#64748B",
          labelBackground: true,
          labelBackgroundFill: "#F8FAFC",
          labelBackgroundRadius: 4,
          labelBackgroundPadding: [2, 6],
        },
        state: {
          selected: {
            stroke: "#6366F1",
            lineWidth: 2.5,
          },
        },
      },
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element", "click-select"],
    });

    graph.render();

    // 节点点击事件
    graph.on("node:click", (evt: any) => {
      console.log("[Research] ========== 节点点击 ==========");
      console.log("[Research] 完整事件对象:", evt);
      console.log("[Research] evt.target:", evt.target);
      console.log("[Research] evt.targetType:", evt.targetType);
      
      // G6 v5 中获取节点 ID 的方式
      let nodeId: string | null = null;
      
      // 方式1: 直接从 target 获取
      if (evt.target?.id) {
        nodeId = evt.target.id;
        console.log("[Research] 方式1 - evt.target.id:", nodeId);
      }
      
      // 方式2: 从 itemId 获取
      if (evt.itemId) {
        nodeId = evt.itemId;
        console.log("[Research] 方式2 - evt.itemId:", nodeId);
      }
      
      // 方式3: 从 targetType 和 target 获取
      if (evt.targetType === 'node' && evt.target) {
        const id = typeof evt.target === 'string' ? evt.target : evt.target.id;
        if (id) {
          nodeId = id;
          console.log("[Research] 方式3 - targetType node:", nodeId);
        }
      }
      
      console.log("[Research] 最终节点 ID:", nodeId);
      console.log("[Research] 当前图谱节点列表:", graphData.nodes.map(n => n.id));
      
      if (nodeId) {
        const nodeData = graphData.nodes.find(n => n.id === nodeId);
        console.log("[Research] 匹配到的节点数据:", nodeData);
        if (nodeData) {
          // 检查是否已经有这个节点的面板
          const existingPanel = detailPanels.find(p => p.node.id === nodeId);
          if (existingPanel) {
            // 如果已存在，只激活它
            setActivePanelId(existingPanel.id);
          } else {
            // 创建新面板
            loadNodeDetail(nodeData);
          }
        } else {
          console.log("[Research] 节点 ID 未匹配到任何数据");
        }
      } else {
        console.log("[Research] 未获取到节点 ID");
      }
    });

    graphRef.current = graph;

    return () => {
      graph.destroy();
    };
  }, [graphData]);

  // 加载节点详情并创建新面板
  const loadNodeDetail = async (node: KnowledgeNode) => {
    console.log("[Research] ========== 加载节点详情 ==========");
    console.log("[Research] 节点:", node.label);
    
    // 计算新面板位置（错开显示）
    const offset = nextPanelOffset.current * 30;
    nextPanelOffset.current = (nextPanelOffset.current + 1) % 10;
    const baseX = window.innerWidth - 400;
    const baseY = 80;
    
    try {
      const response = await fetch("http://localhost:8000/api/research/node/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: node.label, context: node.description }),
      });
      
      console.log("[Research] API 响应状态:", response.status);
      
      if (!response.ok) {
        throw new Error("Failed to load node detail");
      }
      
      const data = await response.json();
      console.log("[Research] API 返回数据:", data);
      
      const newDetail: NodeDetail = {
        label: data.label,
        description: data.description,
        relatedVideos: data.relatedVideos || [],
      };
      
      // 创建新面板
      const newPanel: DetailPanel = {
        id: `panel-${node.id}-${Date.now()}`,
        node: node,
        detail: newDetail,
        pos: { x: baseX - offset, y: baseY + offset },
        size: { width: 380, height: 480 },
      };
      
      setDetailPanels(prev => [...prev, newPanel]);
      setActivePanelId(newPanel.id);
    } catch (error) {
      console.error("[Research] 加载节点详情失败:", error);
      // 降级：使用基础数据
      const fallbackDetail: NodeDetail = {
        label: node.label,
        description: `${node.label} - ${node.description}`,
        relatedVideos: [
          { title: `${node.label} 教程`, url: "https://www.bilibili.com/video/BV1xs411Q799", platform: "bilibili" },
        ],
      };
      
      const newPanel: DetailPanel = {
        id: `panel-${node.id}-${Date.now()}`,
        node: node,
        detail: fallbackDetail,
        pos: { x: baseX - offset, y: baseY + offset },
        size: { width: 380, height: 480 },
      };
      
      setDetailPanels(prev => [...prev, newPanel]);
      setActivePanelId(newPanel.id);
    }
  };

  // 关闭面板
  const closePanel = (panelId: string) => {
    setDetailPanels(prev => prev.filter(p => p.id !== panelId));
    if (activePanelId === panelId) {
      setActivePanelId(null);
    }
  };

  // 更新面板位置
  const updatePanelPos = (panelId: string, pos: { x: number; y: number }) => {
    setDetailPanels(prev => prev.map(p => 
      p.id === panelId ? { ...p, pos } : p
    ));
  };

  // 更新面板大小
  const updatePanelSize = (panelId: string, size: { width: number; height: number }) => {
    setDetailPanels(prev => prev.map(p => 
      p.id === panelId ? { ...p, size } : p
    ));
  };

  // 跳转到 Video to Code
  const goToVideoToCode = async (videoUrl: string) => {
    // 调用 API 创建 session
    try {
      const response = await fetch("http://localhost:8000/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });
      const data = await response.json();
      setLocation(`/workspace?session=${data.sessionId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      // 降级：直接跳转
      localStorage.setItem("videoUrl", videoUrl);
      setLocation("/workspace");
    }
  };

  // 开始与节点对话
  const startChat = (node: KnowledgeNode, detail: NodeDetail) => {
    setChatTargetNode(node);
    setChatTargetDetail(detail);
    setShowChat(true);
    setChatMessages([
      {
        role: "assistant",
        content: `你好！我是 ${node.label}。有什么想了解的吗？`,
      },
    ]);
  };

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatTargetNode || !chatTargetDetail) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch("http://localhost:8000/api/research/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeLabel: chatTargetNode.label,
          nodeDescription: chatTargetDetail.description,
          message: userMessage,
          history: chatMessages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to chat");
      }
      
      const data = await response.json();
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
    } catch (error) {
      console.error("Failed to chat:", error);
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: "抱歉，我暂时无法回答。请稍后再试。" },
      ]);
    }
  };

  // 拖拽处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingPanelId) {
      updatePanelPos(draggingPanelId, {
        x: e.clientX - panelDragOffset.current.x,
        y: e.clientY - panelDragOffset.current.y,
      });
    }
    if (isDraggingChat) {
      setChatPos({
        x: e.clientX - chatDragOffset.current.x,
        y: e.clientY - chatDragOffset.current.y,
      });
    }
    if (resizingPanelId) {
      const panel = detailPanels.find(p => p.id === resizingPanelId);
      if (panel) {
        updatePanelSize(resizingPanelId, {
          width: Math.max(300, e.clientX - panel.pos.x),
          height: Math.max(300, e.clientY - panel.pos.y),
        });
      }
    }
    if (isResizingChat) {
      setChatSize({
        width: Math.max(300, e.clientX - chatPos.x),
        height: Math.max(300, e.clientY - chatPos.y),
      });
    }
  }, [draggingPanelId, isDraggingChat, resizingPanelId, isResizingChat, detailPanels, chatPos]);

  const handleMouseUp = useCallback(() => {
    setDraggingPanelId(null);
    setResizingPanelId(null);
    setIsDraggingChat(false);
    setIsResizingChat(false);
  }, []);

  useEffect(() => {
    if (draggingPanelId || isDraggingChat || resizingPanelId || isResizingChat) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingPanelId, isDraggingChat, resizingPanelId, isResizingChat, handleMouseMove, handleMouseUp]);

  const startDragPanel = (e: React.MouseEvent, panelId: string, panelPos: { x: number; y: number }) => {
    panelDragOffset.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y };
    setDraggingPanelId(panelId);
    setActivePanelId(panelId);
  };

  const startDragChat = (e: React.MouseEvent) => {
    chatDragOffset.current = { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y };
    setIsDraggingChat(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <img src="/logo.svg" alt="Mora" className="w-6 h-6" />
          <div>
            <h1 className="font-semibold text-gray-900">Deep Research</h1>
            {keyword && <p className="text-xs text-gray-500">探索: {keyword}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {keyword && !isLoading && (
            <button
              onClick={refreshGraph}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="重新生成图谱"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：知识图谱 */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-gray-500">正在生成知识图谱...</p>
              </div>
            </div>
          ) : graphData ? (
            <div ref={graphContainerRef} className="w-full h-full bg-white" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <p className="text-gray-400">请输入关键词开始探索</p>
            </div>
          )}
        </div>

        {/* 右侧：详情面板 - 支持多个同时显示 */}
        {detailPanels.map((panel) => (
          <div 
            key={panel.id}
            className={`fixed border bg-white flex flex-col shadow-2xl rounded-lg z-50 select-none ${
              activePanelId === panel.id ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
            style={{
              left: panel.pos.x,
              top: panel.pos.y,
              width: panel.size.width,
              height: panel.size.height,
              zIndex: activePanelId === panel.id ? 51 : 50,
            }}
            onClick={() => setActivePanelId(panel.id)}
          >
            {/* 拖拽标题栏 */}
            <div 
              className="p-4 border-b border-gray-100 cursor-move flex items-center gap-2"
              onMouseDown={(e) => startDragPanel(e, panel.id, panel.pos)}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 flex-1">{panel.detail.label}</h2>
              <button
                onClick={(e) => { e.stopPropagation(); closePanel(panel.id); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* 描述 */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">{panel.detail.description}</p>
            </div>

            {/* 相关视频 */}
            <div className="p-4 flex-1 overflow-auto">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                相关视频
              </h3>
              <div className="space-y-2">
                {panel.detail.relatedVideos.map((video, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                    onClick={() => goToVideoToCode(video.url)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{video.platform}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="p-4 space-y-2 border-t border-gray-100">
              <button
                onClick={() => startChat(panel.node, panel.detail)}
                className="w-full py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                与 {panel.node.label} 对话
              </button>
            </div>

            {/* 缩放角 */}
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => { e.stopPropagation(); setResizingPanelId(panel.id); }}
            >
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 16 16">
                <path fill="currentColor" d="M14 14H10V16H16V10H14V14ZM14 6H16V0H10V2H14V6Z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Chat 窗口 - 可拖拽缩放 */}
      {showChat && chatTargetNode && (
        <div 
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 select-none"
          style={{
            left: chatPos.x,
            top: chatPos.y,
            width: chatSize.width,
            height: chatSize.height,
          }}
        >
          {/* Chat Header - 可拖拽 */}
          <div 
            className="h-12 flex items-center justify-between px-4 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move"
            onMouseDown={startDragChat}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{chatTargetNode.label[0]}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">与 {chatTargetNode.label} 对话</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="输入问题..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center ${
                  chatInput.trim()
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 缩放角 */}
          <div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => { e.stopPropagation(); setIsResizingChat(true); }}
          >
            <svg className="w-4 h-4 text-gray-300" viewBox="0 0 16 16">
              <path fill="currentColor" d="M14 14H10V16H16V10H14V14ZM14 6H16V0H10V2H14V6Z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
