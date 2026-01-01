# code_generator.py
# 代码生成模块 - 使用智谱 GLM API 生成代码

import httpx
import os
import re
from dataclasses import dataclass
from typing import Optional

ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "f9905f5fb666420eaeb852feea554065.BjTiMGXjCaeipExE")
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

SYSTEM_PROMPT = """你是一个专业的代码生成助手。你的任务是分析编程教学视频的转录文本，提取其中的代码逻辑，并生成完整可执行的代码。

规则：
1. 仔细分析转录文本，识别所有代码相关的内容
2. 理解视频中讲解的编程概念和逻辑
3. 生成完整、可直接运行的代码示例
4. 代码需要包含必要的注释
5. 如果视频是介绍性内容没有具体代码，生成一个符合视频主题的入门示例代码

重要约束（必须遵守）：
- 代码必须是纯 Python，可以在 Linux 沙盒环境中独立运行
- 不要依赖外部文件（如读取本地文件、VBS脚本等）
- 不要使用需要 GUI 的库（如 tkinter、pygame）
- 不要使用需要网络请求的代码（除非是演示 requests 库用法）
- 不要生成需要用户输入的代码（如 input()）
- 代码执行后必须有 print 输出，展示运行结果
- 如果视频内容是关于软件安装/激活/破解等，请忽略这些内容，改为生成该软件/语言的入门示例代码

输出格式：只输出代码，使用 markdown 代码块包裹"""


@dataclass
class CodeGeneratorResult:
    success: bool
    error: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None
    tokens_used: int = 0


def build_user_prompt(title: str, author: str, transcript: str) -> str:
    return f"""以下是一个编程教学视频的转录文本，请分析并生成对应的代码：

---
视频标题：{title}
视频作者：{author}
---

转录内容：
{transcript[:4000]}

---

请根据以上内容生成完整可执行的 Python 代码。"""


def extract_code_from_response(content: str) -> tuple:
    """从 LLM 响应中提取代码和语言"""
    pattern = r'```(\w+)?\n([\s\S]*?)```'
    matches = re.findall(pattern, content)
    
    if matches:
        language = matches[0][0] or "python"
        code = matches[0][1].strip()
        return code, language
    
    return content.strip(), "python"


async def generate_code(
    title: str,
    author: str,
    transcript: str,
    model: str = "glm-4-flash"
) -> CodeGeneratorResult:
    """
    调用智谱 API 生成代码
    """
    try:
        user_prompt = build_user_prompt(title, author, transcript)
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.7,
                }
            )
            
            if response.status_code != 200:
                return CodeGeneratorResult(
                    success=False,
                    error=f"API error: {response.status_code}"
                )
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            code, language = extract_code_from_response(content)
            tokens_used = data.get("usage", {}).get("total_tokens", 0)
            
            return CodeGeneratorResult(
                success=True,
                code=code,
                language=language,
                tokens_used=tokens_used,
            )
            
    except Exception as e:
        return CodeGeneratorResult(
            success=False,
            error=str(e)
        )
