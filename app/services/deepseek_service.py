import httpx
import json
from app.config import get_settings
from typing import Dict, Any, AsyncIterator

settings = get_settings()

class DeepSeekService:
    """DeepSeek API服务"""
    
    BASE_URL = settings.DEEPSEEK_API_URL
    API_KEY = settings.DEEPSEEK_API_KEY
    MODEL = settings.DEEPSEEK_MODEL
    TIMEOUT = settings.DEEPSEEK_TIMEOUT
    TEMPERATURE = settings.DEEPSEEK_TEMPERATURE
    
    @staticmethod
    def build_code_generation_prompt(subtitle_data: Dict[str, Any]) -> str:
        """构建代码生成Prompt"""
        title = subtitle_data.get("title", "Unknown")
        duration = subtitle_data.get("duration", 0)
        subtitles = subtitle_data.get("subtitles", [])
        
        subtitle_lines = []
        for sub in subtitles[:100]:
            time_str = f"[{sub['startTime']}s]"
            subtitle_lines.append(f"{time_str} {sub['text']}")
        subtitle_text = "\n".join(subtitle_lines)
        
        return f"""你是一个专业的编程教学代码生成助手。根据视频字幕内容生成完整可运行的Python代码。

【视频信息】
标题: {title}
时长: {duration}秒

【完整字幕】
{subtitle_text}

【要求】
1. 生成完整可运行的Python代码
2. 包含所有必要的import语句
3. 添加详细的中文注释解释关键步骤
4. 遵循PEP8代码规范
5. 包含适当的错误处理
6. 代码应该是教学性质的，易于理解
7. 如果视频包含多个示例，请都包含进来

【输出格式】
- 只输出Python代码，不要用markdown代码块包裹
- 从第一行开始就是代码
- 不要添加任何说明文字

请生成代码："""
    
    @staticmethod
    async def generate_code_stream(subtitle_data: Dict[str, Any]) -> AsyncIterator[str]:
        """
        流式生成代码
        
        Args:
            subtitle_data: 字幕数据
            
        Yields:
            代码片段字符串
        """
        prompt = DeepSeekService.build_code_generation_prompt(subtitle_data)
        
        async with httpx.AsyncClient(timeout=DeepSeekService.TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{DeepSeekService.BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DeepSeekService.API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": DeepSeekService.MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "你是专业的Python代码生成助手，擅长根据教学视频生成清晰易懂的代码。"
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "stream": True,
                    "temperature": DeepSeekService.TEMPERATURE,
                    "max_tokens": 4000
                }
            ) as response:
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    
                    if line.startswith("data: "):
                        data = line[6:]
                        
                        if data == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data)
                            content = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                            
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

deepseek_service = DeepSeekService()
