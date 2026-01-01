# research_service.py
# Deep Research 服务 - 知识图谱生成、节点对话

import httpx
import os
import json
import re
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "f9905f5fb666420eaeb852feea554065.BjTiMGXjCaeipExE")
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
# 使用 GLM-4 模型（glm-4.7 可能有访问限制，先用 glm-4-flash）
ZHIPU_MODEL = os.getenv("ZHIPU_MODEL", "glm-4-flash")


@dataclass
class GraphNode:
    id: str
    label: str
    description: str
    level: int


@dataclass
class GraphEdge:
    source: str
    target: str
    relation: str


@dataclass
class KnowledgeGraphResult:
    success: bool
    nodes: List[Dict] = None
    edges: List[Dict] = None
    error: Optional[str] = None


@dataclass
class NodeDetailResult:
    success: bool
    label: str = ""
    description: str = ""
    related_videos: List[Dict] = None
    error: Optional[str] = None


@dataclass
class ChatResult:
    success: bool
    content: str = ""
    error: Optional[str] = None


# ============ 知识图谱生成 ============

GRAPH_SYSTEM_PROMPT = """你是 Mora 的知识图谱生成专家。Mora 是一个 AI 驱动的学习工具，帮助用户探索人工智能、机器学习、编程技术等领域的知识。

【核心定位】
你的任务是为用户输入的关键词生成一个多层次的知识图谱，帮助他们理解该概念在 AI/技术领域的相关知识。

【AI 产品识别 - 非常重要】
用户输入的关键词应优先理解为 AI/技术领域的概念：
- "豆包" / "Doubao" → 字节跳动的 AI 助手（不是食物）
- "元宝" / "Yuanbao" → 腾讯的 AI 助手（不是货币或金元宝）
- "GPT" / "ChatGPT" → OpenAI 的大语言模型
- "Claude" → Anthropic 的 AI 助手
- "Gemini" → Google DeepMind 的 AI 模型（不是加密货币）
- "Kimi" → 月之暗面(Moonshot AI)的 AI 助手（不是汽车）
- "Llama" → Meta 的开源大语言模型（不是动物）
- "Manus" → 独立 AI Agent 公司（不是智谱产品）
- "DeepSeek" → 深度求索公司的 AI 模型
- "Qwen" / "通义千问" → 阿里巴巴的 AI 模型
- "文心一言" / "ERNIE" → 百度的 AI 模型
- "GLM" / "ChatGLM" → 智谱 AI 的模型
- "Copilot" → GitHub/Microsoft 的 AI 编程助手
- "Cursor" → AI 代码编辑器
- "Midjourney" / "DALL-E" / "Stable Diffusion" → AI 图像生成

【输出格式 - 必须严格遵守】
输出纯 JSON，不要有任何其他文字：
{
  "nodes": [
    {"id": "0", "label": "关键词", "description": "简短描述", "level": 0},
    {"id": "1", "label": "概念1", "description": "简短描述", "level": 1},
    {"id": "1-1", "label": "子概念", "description": "简短描述", "level": 2},
    {"id": "1-1-1", "label": "细分概念", "description": "简短描述", "level": 3},
    ...
  ],
  "edges": [
    {"source": "0", "target": "1", "relation": "包含"},
    {"source": "1", "target": "1-1", "relation": "细分"},
    {"source": "1-1", "target": "1-1-1", "relation": "应用"},
    ...
  ]
}

【结构规则 - 必须严格遵守】
1. level 0: 中心节点，只有1个（用户输入的关键词）
2. level 1: 核心分类，4-5个，必须连接到 level 0
3. level 2: 子概念，每个 level 1 必须有 2-3 个子节点
4. level 3: 具体应用/细节，部分 level 2 节点可以有 1-2 个子节点
5. 总节点数：15-20个
6. 【关键】形成树状层级结构，不是扁平的一对多
7. 【关键】每个节点必须有边连接，绝对不能有孤立节点
8. 边的 source 和 target 必须是有效的节点 id
9. label 不超过 6 个字，description 不超过 15 字
10. 边的 relation 要有意义，如：包含、应用、实现、依赖、优化"""


def extract_json_from_response(content: str) -> dict:
    """从 LLM 响应中提取 JSON"""
    # 尝试直接解析
    try:
        return json.loads(content)
    except:
        pass
    
    # 尝试从 markdown 代码块中提取
    pattern = r'```(?:json)?\n?([\s\S]*?)```'
    matches = re.findall(pattern, content)
    if matches:
        try:
            return json.loads(matches[0])
        except:
            pass
    
    # 尝试找到 JSON 对象
    pattern = r'\{[\s\S]*\}'
    matches = re.findall(pattern, content)
    if matches:
        try:
            return json.loads(matches[0])
        except:
            pass
    
    return None


async def generate_knowledge_graph(keyword: str) -> KnowledgeGraphResult:
    """生成知识图谱"""
    try:
        user_prompt = f"请为关键词「{keyword}」生成知识图谱。注意：如果这是一个 AI 产品名称，请按 AI 领域理解。"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                },
                json={
                    "model": ZHIPU_MODEL,
                    "messages": [
                        {"role": "system", "content": GRAPH_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.7,
                }
            )
            
            if response.status_code != 200:
                return KnowledgeGraphResult(
                    success=False,
                    error=f"API error: {response.status_code}"
                )
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            graph_data = extract_json_from_response(content)
            if not graph_data:
                return KnowledgeGraphResult(
                    success=False,
                    error="Failed to parse graph JSON"
                )
            
            # 验证并修复孤立节点
            nodes = graph_data.get("nodes", [])
            edges = graph_data.get("edges", [])
            
            # 找出所有被连接的节点
            connected_nodes = set()
            for edge in edges:
                connected_nodes.add(str(edge.get("source", "")))
                connected_nodes.add(str(edge.get("target", "")))
            
            # 找出孤立节点并连接到中心节点
            center_id = "0"
            for node in nodes:
                node_id = str(node.get("id", ""))
                if node_id and node_id != center_id and node_id not in connected_nodes:
                    # 将孤立节点连接到中心节点
                    edges.append({
                        "source": center_id,
                        "target": node_id,
                        "relation": "相关"
                    })
                    print(f"[Research] 修复孤立节点: {node.get('label')} -> 连接到中心")
            
            return KnowledgeGraphResult(
                success=True,
                nodes=nodes,
                edges=edges,
            )
            
    except Exception as e:
        return KnowledgeGraphResult(
            success=False,
            error=str(e)
        )


# ============ 节点详情 ============

DETAIL_SYSTEM_PROMPT = """你是一个技术知识专家，专注于人工智能、机器学习、编程技术领域。用户会给你一个技术概念，你需要提供详细的介绍。

重要：请将概念理解为技术/AI领域。例如 Kimi 是月之暗面的 AI 模型，Gemini 是 Google 的 AI 模型，Claude 是 Anthropic 的 AI 模型。

输出格式要求（必须严格遵守）：
1. 输出纯 JSON，不要有任何其他文字
2. JSON 结构如下：
{
  "description": "详细描述（100-200字）",
  "key_points": ["要点1", "要点2", "要点3"],
  "related_topics": ["相关主题1", "相关主题2"]
}"""


async def get_node_detail(label: str, context: str = "") -> NodeDetailResult:
    """获取节点详情"""
    try:
        user_prompt = f"请详细介绍「{label}」这个概念。"
        if context:
            user_prompt += f"\n上下文：{context}"
        
        # 并行请求：LLM 描述 + 视频搜索
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                },
                json={
                    "model": ZHIPU_MODEL,
                    "messages": [
                        {"role": "system", "content": DETAIL_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.7,
                }
            )
            
            if response.status_code != 200:
                return NodeDetailResult(
                    success=False,
                    error=f"API error: {response.status_code}"
                )
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            detail_data = extract_json_from_response(content)
            description = detail_data.get("description", content[:500]) if detail_data else content[:500]
        
        # 搜索真实视频
        videos = await search_videos(label)
        if not videos:
            # 如果搜索失败，使用 mock 数据
            videos = generate_mock_videos(label)
        
        return NodeDetailResult(
            success=True,
            label=label,
            description=description,
            related_videos=videos,
        )
            
    except Exception as e:
        return NodeDetailResult(
            success=False,
            error=str(e)
        )


async def search_bilibili_videos(keyword: str, limit: int = 3) -> List[Dict]:
    """搜索 B站视频 - 使用网页搜索接口"""
    try:
        # B站搜索 API 需要 cookie，改用搜索建议或直接构造搜索链接
        # 这里我们用 LLM 生成更有针对性的视频推荐
        return []
    except Exception as e:
        print(f"[Research] B站搜索异常: {e}")
        return []


async def generate_video_recommendations(keyword: str) -> List[Dict]:
    """使用 LLM 生成针对性的视频推荐"""
    try:
        prompt = f"""请为学习「{keyword}」推荐3个B站上可能存在的高质量教程视频。

要求：
1. 推荐真实可能存在的视频类型和标题风格
2. 标题要具体，体现视频内容
3. 考虑知名 UP 主的风格（如：3Blue1Brown、李沐、跟李沐学AI、同济子豪兄等）

输出纯 JSON 格式：
[
  {{"title": "具体的视频标题", "author": "UP主名称", "reason": "推荐理由"}},
  ...
]"""

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                },
                json={
                    "model": ZHIPU_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 512,
                    "temperature": 0.8,
                }
            )
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            recommendations = extract_json_from_response(content)
            if not recommendations or not isinstance(recommendations, list):
                return []
            
            videos = []
            for rec in recommendations[:3]:
                title = rec.get("title", "")
                author = rec.get("author", "")
                if title:
                    # 构造 B站搜索链接
                    import urllib.parse
                    search_query = urllib.parse.quote(f"{title} {author}".strip())
                    videos.append({
                        "title": title,
                        "url": f"https://search.bilibili.com/all?keyword={search_query}",
                        "platform": "bilibili",
                        "author": author,
                    })
            
            return videos
            
    except Exception as e:
        print(f"[Research] 生成视频推荐失败: {e}")
        return []


async def search_videos(keyword: str) -> List[Dict]:
    """搜索相关视频（整合多个平台）"""
    # 使用 LLM 生成针对性推荐
    videos = await generate_video_recommendations(keyword)
    
    if not videos:
        print(f"[Research] 未能生成 '{keyword}' 相关视频推荐")
    
    return videos


def generate_mock_videos(keyword: str) -> List[Dict]:
    """生成模拟视频列表（备用方案）"""
    import urllib.parse
    search_query = urllib.parse.quote(keyword)
    return [
        {
            "title": f"{keyword} 入门教程",
            "url": f"https://search.bilibili.com/all?keyword={search_query}",
            "platform": "bilibili"
        },
        {
            "title": f"{keyword} 原理详解",
            "url": f"https://search.bilibili.com/all?keyword={search_query}%20原理",
            "platform": "bilibili"
        },
        {
            "title": f"{keyword} 实战项目",
            "url": f"https://search.bilibili.com/all?keyword={search_query}%20实战",
            "platform": "bilibili"
        },
    ]


# ============ 节点对话 ============

def build_chat_system_prompt(node_label: str, node_description: str) -> str:
    return f"""你现在扮演「{node_label}」这个技术概念。用户会向你提问，你需要以第一人称的方式回答。

关于你的背景：
{node_description}

回答规则：
1. 以第一人称回答，如"我是 {node_label}..."
2. 回答要专业但易懂
3. 可以适当举例说明
4. 回答长度控制在 100-300 字
5. 如果用户问的问题与你无关，礼貌地引导回相关话题"""


async def chat_with_node(
    node_label: str,
    node_description: str,
    user_message: str,
    history: List[Dict] = None
) -> ChatResult:
    """与节点对话"""
    try:
        messages = [
            {"role": "system", "content": build_chat_system_prompt(node_label, node_description)}
        ]
        
        # 添加历史消息
        if history:
            for msg in history[-6:]:  # 只保留最近 6 条
                messages.append(msg)
        
        messages.append({"role": "user", "content": user_message})
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                },
                json={
                    "model": ZHIPU_MODEL,
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.8,
                }
            )
            
            if response.status_code != 200:
                return ChatResult(
                    success=False,
                    error=f"API error: {response.status_code}"
                )
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            return ChatResult(
                success=True,
                content=content,
            )
            
    except Exception as e:
        return ChatResult(
            success=False,
            error=str(e)
        )
