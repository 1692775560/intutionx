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
        
        subtitle_summary = []
        for i, sub in enumerate(subtitles):
            if i % 5 == 0:
                subtitle_summary.append({
                    "time": sub["startTime"],
                    "text": sub["text"]
                })
        
        subtitle_text = json.dumps(subtitle_summary, indent=2, ensure_ascii=False)
        
        code_lines = code.split('\n')
        total_lines = len(code_lines)
        
        return f"""你是视频内容分析专家。请根据视频字幕和生成的代码，创建时间轴映射。

【视频字幕摘要】
{subtitle_text}

【生成的代码】（共{total_lines}行）
```python
{code[:2000]}
...
```

【任务】
分析字幕内容，将视频时间段映射到代码行号。输出JSON格式：

{{
  "segments": [
    {{
      "startTime": 0,
      "endTime": 30,
      "description": "课程介绍",
      "codeLines": null
    }},
    {{
      "startTime": 30,
      "endTime": 120,
      "description": "导入库和环境准备",
      "codeLines": "1-8"
    }}
  ]
}}

【要求】
1. 每个segment覆盖一个逻辑段落（30-120秒为宜）
2. codeLines格式: "起始行-结束行" 或 null（无代码）
3. description简洁描述（10字以内）
4. segments按时间顺序，不重叠
5. 只输出JSON，无其他文字

请生成时间轴："""
    
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
        prompt = TimelineService.build_timeline_prompt(subtitle_data, code)
        
        async with httpx.AsyncClient(timeout=60.0) as client:
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
                    }
                )
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                timeline = json.loads(content)
                
                return timeline
                
            except Exception as e:
                print(f"Timeline generation error: {e}")
                return TimelineService._get_default_timeline(subtitle_data)
    
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
