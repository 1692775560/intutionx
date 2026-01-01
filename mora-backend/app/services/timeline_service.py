import httpx
import json
from app.config import get_settings
from typing import Dict, Any

settings = get_settings()

class TimelineService:
    """时间轴生成服务"""
    
    @staticmethod
    def build_timeline_prompt(subtitle_data: Dict[str, Any], code: str) -> str:
        """构建时间轴映射Prompt"""
        subtitles = subtitle_data.get("subtitles", [])
        
        # 采样字幕，每10秒一条
        subtitle_summary = []
        for i, sub in enumerate(subtitles):
            if i % 10 == 0:
                subtitle_summary.append({
                    "time": sub["startTime"],
                    "text": sub["text"]
                })
        
        subtitle_text = json.dumps(subtitle_summary, indent=2, ensure_ascii=False)
        
        code_lines = code.split('\n')
        total_lines = len(code_lines)
        
        # 提取代码中的时间注释
        time_comments = []
        for i, line in enumerate(code_lines[:500]):  # 只看前500行
            if '# Video' in line or '# 视频' in line:
                time_comments.append(f"Line {i+1}: {line.strip()}")
        
        return f"""You are a video-code mapping expert. Analyze the video subtitles and generated code to create a timeline mapping.

VIDEO SUBTITLES (sampled):
{subtitle_text}

GENERATED CODE ({total_lines} lines total):
```python
{code[:3000]}
```

TIME COMMENTS IN CODE:
{chr(10).join(time_comments) if time_comments else "No explicit time comments found"}

TASK:
Create a timeline mapping that connects video time segments to code line ranges.

OUTPUT FORMAT (JSON):
{{
  "segments": [
    {{
      "startTime": 0,
      "endTime": 30,
      "description": "Introduction",
      "codeLines": null
    }},
    {{
      "startTime": 30,
      "endTime": 120,
      "description": "String basics",
      "codeLines": "5-15"
    }},
    {{
      "startTime": 120,
      "endTime": 200,
      "description": "Format examples",
      "codeLines": "16-30"
    }}
  ]
}}

REQUIREMENTS:
1. Each segment covers 30-120 seconds
2. codeLines format: "start-end" or null (if no code)
3. Description: concise (max 20 chars)
4. Segments in chronological order, no overlap
5. If code has time comments (# Video X:XX), use them for accurate mapping
6. Output ONLY JSON, no other text

GENERATE TIMELINE:"""
    
    @staticmethod
    async def generate_timeline(subtitle_data: Dict[str, Any], code: str) -> Dict[str, Any]:
        """
        生成时间轴映射
        
        Args:
            subtitle_data: 字幕数据
            code: 生成的代码
            
        Returns:
            时间轴数据
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # 启用AI时间轴生成
        logger.info("Generating timeline mapping with AI")
        
        try:
            prompt = TimelineService.build_timeline_prompt(subtitle_data, code)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
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
                                "content": "You are a JSON data expert. Generate structured timeline mappings."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=30.0
                )
                
                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                timeline = json.loads(content)
                
                logger.info(f"Timeline generated with {len(timeline.get('segments', []))} segments")
                return timeline
                
        except Exception as e:
            logger.warning(f"Timeline generation failed, using default: {e}")
            return TimelineService._get_default_timeline(subtitle_data)
        
        # 以下代码暂时禁用，避免DeepSeek API调用超时
        """
        prompt = TimelineService.build_timeline_prompt(subtitle_data, code)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
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
                                "content": "你是JSON数据生成专家，擅长分析视频内容并生成结构化数据。"
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=30.0
                )
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                timeline = json.loads(content)
                
                return timeline
                
            except Exception as e:
                logger.error(f"Timeline generation error: {e}")
                return TimelineService._get_default_timeline(subtitle_data)
        """
    
    @staticmethod
    def _get_default_timeline(subtitle_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成默认时间轴（降级方案）"""
        duration = subtitle_data.get("duration", 0)
        return {
            "segments": [
                {
                    "startTime": 0,
                    "endTime": duration,
                    "description": "完整视频内容",
                    "codeLines": None
                }
            ]
        }

timeline_service = TimelineService()
