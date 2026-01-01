import json
import httpx
from typing import Dict, Any, List
from app.config import get_settings

settings = get_settings()

class CodePlanner:
    """代码规划服务 - 分析字幕并生成代码段大纲"""
    
    @staticmethod
    async def summarize_subtitles(subtitle_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        分析字幕，让大模型总结每个时间段讲了什么，需要生成什么代码
        
        这是三步流程的第一步：字幕理解和分段
        
        Args:
            subtitle_data: 字幕数据
            
        Returns:
            时间段总结列表，每段包含:
            - startTime: 开始时间（秒）
            - endTime: 结束时间（秒）
            - summary: 这段时间讲了什么（中文）
            - codeTask: 需要生成什么样的代码（中文描述）
        """
        import logging
        logger = logging.getLogger(__name__)
        
        title = subtitle_data.get("title", "Unknown")
        duration = subtitle_data.get("duration", 0)
        subtitles = subtitle_data.get("subtitles", [])
        
        # 构建完整字幕文本
        subtitle_lines = []
        for sub in subtitles:
            time_str = f"[{sub['startTime']:.1f}s]"
            subtitle_lines.append(f"{time_str} {sub['text']}")
        subtitle_text = "\n".join(subtitle_lines)
        
        prompt = f"""你是一个视频内容分析专家。请仔细阅读这个Python教学视频的字幕，然后总结出视频的内容结构。

视频标题: {title}
视频时长: {duration}秒

完整字幕:
{subtitle_text}

任务:
请将视频内容分成**3-5个**逻辑段落（最多5个），每个段落应该：
1. 涵盖一个完整的知识点或概念
2. 时长适中，覆盖视频的主要内容
3. 有明确的教学目标

对于每个段落，请提供：
- startTime: 段落开始时间（秒）
- endTime: 段落结束时间（秒）  
- summary: 这段时间讲师讲了什么内容（用一句话总结，15字以内）
- codeTask: 需要编写什么样的代码来演示这个知识点（具体描述）

输出JSON格式:
{{
  "segments": [
    {{
      "startTime": 0,
      "endTime": 60,
      "summary": "课程介绍和目标",
      "codeTask": "添加注释说明学习目标"
    }},
    {{
      "startTime": 60,
      "endTime": 180,
      "summary": "讲解f-string语法",
      "codeTask": "演示f-string基本语法和变量插入"
    }},
    {{
      "startTime": 180,
      "endTime": 290,
      "summary": "实战示例和总结",
      "codeTask": "完整示例代码和优缺点总结"
    }}
  ]
}}

要求:
1. **段落数量：3-5个（不超过5个）**
2. 段落按时间顺序排列，不重叠
3. summary简洁（15字内）
4. codeTask具体可执行
5. 只输出JSON，不要其他文字

现在开始分析:"""

        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                logger.info("Step 1: Analyzing subtitles and summarizing content segments")
                
                response = await client.post(
                    f"{settings.DEEPSEEK_API_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.DEEPSEEK_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "你是一个专业的视频内容分析师，擅长分析教学视频并生成结构化总结。"
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
                )
                
                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                analysis = json.loads(content)
                
                segments = analysis.get("segments", [])
                
                # 强制限制段落数量不超过5个
                if len(segments) > 5:
                    logger.warning(f"AI generated {len(segments)} segments, truncating to 5")
                    segments = segments[:5]
                
                logger.info(f"Subtitle analysis complete: {len(segments)} segments identified")
                
                # 打印总结结果便于调试
                for i, seg in enumerate(segments, 1):
                    logger.info(f"  Segment {i}: {seg.get('startTime')}s-{seg.get('endTime')}s - {seg.get('summary')}")
                
                return segments
                
        except Exception as e:
            logger.error(f"Subtitle analysis failed: {e}")
            # 返回默认的单段
            return [{
                "startTime": 0,
                "endTime": duration,
                "summary": "完整教程内容",
                "codeTask": "根据视频内容生成演示代码"
            }]
    
    @staticmethod
    async def analyze_subtitles(subtitle_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        分析字幕，生成代码段规划
        
        Args:
            subtitle_data: 字幕数据
            
        Returns:
            代码段列表，每段包含 startTime, endTime, description, topic
        """
        import logging
        logger = logging.getLogger(__name__)
        
        title = subtitle_data.get("title", "Unknown")
        duration = subtitle_data.get("duration", 0)
        subtitles = subtitle_data.get("subtitles", [])
        
        # 采样字幕
        subtitle_lines = []
        for i, sub in enumerate(subtitles):
            if i % 5 == 0:  # 每5条采样一条
                time_str = f"[{sub['startTime']}s]"
                subtitle_lines.append(f"{time_str} {sub['text']}")
        subtitle_text = "\n".join(subtitle_lines)
        
        prompt = f"""You are a video content analyzer. Analyze the video subtitles and create a code generation plan.

VIDEO: {title}
DURATION: {duration}s

SUBTITLES (sampled):
{subtitle_text}

TASK:
Analyze the content and divide it into logical code segments. Each segment should cover one concept or topic.

OUTPUT FORMAT (JSON):
{{
  "segments": [
    {{
      "startTime": 0,
      "endTime": 45,
      "topic": "Introduction and imports",
      "description": "Video introduction, import statements"
    }},
    {{
      "startTime": 45,
      "endTime": 180,
      "topic": "String formatting basics",
      "description": "Explain f-string syntax, basic examples"
    }},
    {{
      "startTime": 180,
      "endTime": 300,
      "topic": "Advanced formatting",
      "description": "Format specifiers, expressions in f-strings"
    }}
  ]
}}

REQUIREMENTS:
1. Each segment: 30-120 seconds
2. topic: Brief title (5-10 words)
3. description: What code to generate for this segment
4. Segments in chronological order, no overlap
5. Output ONLY valid JSON, no other text

GENERATE PLAN:"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info("Calling DeepSeek to analyze video content and create code plan")
                
                response = await client.post(
                    f"{settings.DEEPSEEK_API_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.DEEPSEEK_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a video content analyzer. Generate structured code generation plans in JSON format."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    }
                )
                
                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                plan = json.loads(content)
                
                segments = plan.get("segments", [])
                logger.info(f"Generated code plan with {len(segments)} segments")
                
                return segments
                
        except Exception as e:
            logger.error(f"Code planning failed: {e}")
            # 返回默认的单段计划
            return [{
                "startTime": 0,
                "endTime": duration,
                "topic": "Complete code",
                "description": "Generate complete code for the entire video"
            }]

code_planner = CodePlanner()
