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
        for sub in subtitles[:150]:  # Increased to 150 for better context
            time_str = f"[{sub['startTime']}s]"
            subtitle_lines.append(f"{time_str} {sub['text']}")
        subtitle_text = "\n".join(subtitle_lines)
        
        return f"""You are an expert Python programming instructor. Generate clean, well-formatted Python code based on the video tutorial.

VIDEO: {title}
DURATION: {duration}s

SUBTITLES (with timestamps):
{subtitle_text}

CRITICAL REQUIREMENT - TIME-ALIGNED CODE:
The video teaches concepts at specific times. Your code MUST follow the same order and structure as the video timeline.

INSTRUCTIONS:
1. Organize code sections to match video timeline order
2. Each major concept in the video should have a corresponding function/section
3. Use descriptive function names that match the video content
4. Add time-reference comments (e.g., # Video 0:30 - String formatting basics)
5. Keep related code together in logical blocks
6. Write COMPLETE, RUNNABLE code with proper structure
7. Use 4-space indentation, follow PEP 8

CODE STRUCTURE PATTERN:
# coding: utf-8
# Video Tutorial: [Topic]

# Imports (if needed)
import module

# Video 0:00-0:30 - Introduction/Setup
def section_1_intro():
    \"\"\"First concept from video\"\"\"
    # Implementation
    pass

# Video 0:30-1:00 - Main concept A
def section_2_concept_a():
    \"\"\"Second concept from video\"\"\"
    # Implementation
    pass

# Video 1:00-1:30 - Main concept B  
def section_3_concept_b():
    \"\"\"Third concept from video\"\"\"
    # Implementation
    pass

# Main execution demonstrating all concepts
if __name__ == "__main__":
    section_1_intro()
    section_2_concept_a()
    section_3_concept_b()

OUTPUT FORMAT:
- PURE Python code ONLY
- NO markdown blocks
- NO explanations outside code
- Follow video timeline order strictly

GENERATE CODE NOW:"""
    
    @staticmethod
    async def generate_code_stream(subtitle_data: Dict[str, Any]) -> AsyncIterator[str]:
        """
        流式生成代码
        
        Args:
            subtitle_data: 字幕数据
            
        Yields:
            代码片段字符串
        """
        import logging
        logger = logging.getLogger(__name__)
        
        prompt = DeepSeekService.build_code_generation_prompt(subtitle_data)
        
        try:
            async with httpx.AsyncClient(timeout=DeepSeekService.TIMEOUT) as client:
                logger.info(f"Calling DeepSeek API with model: {DeepSeekService.MODEL}")
                
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
                                "content": "You are a professional Python code generator. Generate clean, well-formatted code."
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
                    response.raise_for_status()
                    logger.info(f"DeepSeek API responded with status: {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        
                        if line.startswith("data: "):
                            data = line[6:]
                            
                            if data == "[DONE]":
                                logger.info("DeepSeek streaming completed")
                                break
                            
                            try:
                                chunk = json.loads(data)
                                content = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                                
                                if content:
                                    yield content
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse JSON chunk: {e}")
                                continue
                                
        except httpx.HTTPStatusError as e:
            logger.error(f"DeepSeek API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"DeepSeek API returned status {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error("DeepSeek API timeout")
            raise Exception("DeepSeek API timeout")
        except Exception as e:
            logger.error(f"DeepSeek API error: {type(e).__name__} - {str(e)}")
            raise

    @staticmethod
    def build_segment_code_prompt(segment: Dict[str, Any], segment_subtitles: str) -> str:
        """
        为特定时间段生成代码的Prompt
        
        这是三步流程的第二步：根据总结生成代码
        """
        start_time = segment.get("startTime", 0)
        end_time = segment.get("endTime", 0)
        summary = segment.get("summary", "")
        code_task = segment.get("codeTask", "")
        
        return f"""你是一个Python代码生成专家。根据视频内容总结，编写对应的演示代码。

时间段: {start_time}秒 - {end_time}秒
内容总结: {summary}
代码任务: {code_task}

这段字幕内容:
{segment_subtitles}

要求:
1. 编写可运行的Python代码，演示"{summary}"这个知识点
2. 代码要符合"{code_task}"的要求
3. 使用正确的Python语法，4空格缩进
4. 添加清晰的注释解释代码
5. 代码要完整可执行

输出格式（严格遵守）:
<code>
# 视频 {start_time//60}:{start_time%60:02d}-{end_time//60}:{end_time%60:02d} - {summary}

# 在这里编写演示代码
# 代码必须是有效的Python代码，可以直接运行
</code>

示例输入:
内容总结: "讲解f-string的基本语法"
代码任务: "演示如何使用f-string格式化字符串，包括变量插入"

正确输出:
<code>
# 视频 0:45-2:30 - 讲解f-string的基本语法

# 定义变量
name = "张三"
age = 25

# 使用f-string格式化
message = f"我的名字是{{name}}，今年{{age}}岁"
print(message)

# f-string的优势：简洁直观
print(f"明年我就{{age + 1}}岁了")
</code>

错误输出（不要这样做）:
讲师说今天我们学习f-string...（不要复制字幕）

现在生成代码:"""
    
    @staticmethod
    async def generate_segment_code_stream(subtitle_data: Dict[str, Any], segment: Dict[str, Any]) -> AsyncIterator[str]:
        """
        为特定时间段流式生成代码（三步流程的第二步）
        
        Args:
            subtitle_data: 字幕数据
            segment: 时间段信息（包含 summary 和 codeTask）
            
        Yields:
            代码片段字符串
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # 提取该时间段的字幕
        subtitles = subtitle_data.get("subtitles", [])
        start_time = segment.get("startTime", 0)
        end_time = segment.get("endTime", 0)
        
        segment_subtitles_list = [
            sub for sub in subtitles 
            if start_time <= sub.get("startTime", 0) <= end_time
        ]
        
        # 构建字幕文本
        subtitle_lines = []
        for sub in segment_subtitles_list[:30]:  # 最多30条
            subtitle_lines.append(f"[{sub['startTime']:.1f}s] {sub['text']}")
        segment_subtitles = "\n".join(subtitle_lines)
        
        prompt = DeepSeekService.build_segment_code_prompt(segment, segment_subtitles)
        
        try:
            async with httpx.AsyncClient(timeout=DeepSeekService.TIMEOUT) as client:
                topic = segment.get("topic", "Unknown")
                logger.info(f"Generating code for segment: {topic}")
                
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
                                "content": "You are a professional Python code generator. Generate clean, segment-specific code."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "stream": True,
                        "temperature": DeepSeekService.TEMPERATURE,
                        "max_tokens": 1000  # 每段代码更短
                    }
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        
                        if line.startswith("data: "):
                            data = line[6:]
                            
                            if data == "[DONE]":
                                logger.info(f"Segment code generation completed: {topic}")
                                break
                            
                            try:
                                chunk = json.loads(data)
                                content = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                                
                                if content:
                                    yield content
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse JSON chunk: {e}")
                                continue
                                
        except Exception as e:
            logger.error(f"Segment code generation error: {type(e).__name__} - {str(e)}")
            raise

deepseek_service = DeepSeekService()
