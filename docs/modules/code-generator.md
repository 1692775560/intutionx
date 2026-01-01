# Code Generator 模块文档

## 一、模块概述

### 1.1 模块职责
Code Generator 负责将视频转录文本分析并生成可执行代码：
- 分析转录文本，识别代码相关内容
- 提取代码逻辑和结构
- 生成完整可执行的代码
- 支持流式输出

### 1.2 技术方案
使用 **智谱 GLM-4.7** 作为代码生成模型，该模型专门强化了 Agentic Coding 能力。

---

## 二、智谱 API 集成

### 2.1 API 信息

| 属性 | 值 |
|------|-----|
| 端点 | `https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 方法 | POST |
| 认证 | Header: `Authorization: Bearer <api_key>` |
| 模型 | `glm-4.7`（旗舰）或 `glm-4-flash`（快速） |
| 文档 | https://docs.bigmodel.cn/cn/guide/models/text/glm-4.7 |

### 2.2 请求格式

```bash
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -d '{
        "model": "glm-4-flash",
        "messages": [
            {"role": "system", "content": "你是一个代码生成助手..."},
            {"role": "user", "content": "视频转录内容..."}
        ],
        "stream": true,
        "max_tokens": 4096
    }'
```

### 2.3 响应结构

```typescript
// 非流式响应
interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 流式响应 (SSE)
interface ChatCompletionChunk {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: "stop" | "length";
  }>;
}
```

---

## 三、Prompt 设计

### 3.1 System Prompt

```
你是一个专业的代码生成助手。你的任务是分析编程教学视频的转录文本，提取其中的代码逻辑，并生成完整可执行的代码。

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

输出格式：只输出代码，使用 markdown 代码块包裹
```

### 3.2 User Prompt 模板

```
以下是一个编程教学视频的转录文本，请分析并生成对应的代码：

---
视频标题：{title}
视频作者：{author}
---

转录内容：
{transcript}

---

请根据以上内容生成完整可执行的代码。
```

---

## 四、模块接口设计

### 4.1 输入

```typescript
interface CodeGeneratorInput {
  title: string;           // 视频标题
  author: string;          // 视频作者
  transcript: string;      // 完整转录文本
  language?: string;       // 指定编程语言（可选）
  stream?: boolean;        // 是否流式输出
}
```

### 4.2 输出

```typescript
// 非流式
interface CodeGeneratorOutput {
  success: boolean;
  error?: string;
  code: string;            // 生成的代码
  language: string;        // 检测到的编程语言
  tokens_used: number;     // 消耗的 token 数
}

// 流式（通过回调）
type StreamCallback = (chunk: string) => void;
```

---

## 五、实现代码

### 5.1 Python 实现

```python
# code_generator.py

import httpx
import json
from dataclasses import dataclass
from typing import Optional, AsyncGenerator

ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
ZHIPU_API_KEY = "YOUR_API_KEY"  # 从环境变量读取

SYSTEM_PROMPT = """你是一个专业的代码生成助手。你的任务是分析编程教学视频的转录文本，提取其中的代码逻辑，并生成完整可执行的代码。

规则：
1. 仔细分析转录文本，识别所有代码相关的内容
2. 理解视频中讲解的编程概念和逻辑
3. 生成完整、可直接运行的代码
4. 代码需要包含必要的注释，解释关键逻辑
5. 如果视频中有多个代码示例，将它们整合到一个文件中
6. 自动识别编程语言，如果无法确定，默认使用 Python
7. 确保代码语法正确，可以直接执行

输出格式：
- 只输出代码，使用 markdown 代码块包裹
- 在代码开头用注释说明这段代码的功能
- 不要输出额外的解释文字"""


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
{transcript}

---

请根据以上内容生成完整可执行的代码。"""


def extract_code_from_response(content: str) -> tuple[str, str]:
    """从 LLM 响应中提取代码和语言"""
    import re
    
    # 匹配 markdown 代码块
    pattern = r'```(\w+)?\n([\s\S]*?)```'
    matches = re.findall(pattern, content)
    
    if matches:
        language = matches[0][0] or "python"
        code = matches[0][1].strip()
        return code, language
    
    # 如果没有代码块，返回原始内容
    return content.strip(), "python"


async def generate_code(
    title: str,
    author: str,
    transcript: str,
    model: str = "glm-4-flash"
) -> CodeGeneratorResult:
    """
    调用智谱 API 生成代码（非流式）
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
                    error=f"API error: {response.status_code} - {response.text}"
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


async def generate_code_stream(
    title: str,
    author: str,
    transcript: str,
    model: str = "glm-4-flash"
) -> AsyncGenerator[str, None]:
    """
    调用智谱 API 生成代码（流式）
    """
    user_prompt = build_user_prompt(title, author, transcript)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
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
                "stream": True,
            }
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        content = data["choices"][0]["delta"].get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue
```

### 5.2 测试脚本

```python
# test_code_generator.py

import asyncio
from code_generator import generate_code, generate_code_stream

# 模拟从 BibiGPT 获取的转录文本
SAMPLE_TRANSCRIPT = """
今天我们来学习 Python 的斐波那契数列
首先我们定义一个函数叫做 fibonacci
它接收一个参数 n 表示要计算第几个斐波那契数
我们用两个变量 a 和 b 分别初始化为 0 和 1
然后用一个 for 循环迭代 n 次
每次循环中我们让 a 等于 b，b 等于 a 加 b
最后返回 a 就是第 n 个斐波那契数
让我们来测试一下，打印前 10 个斐波那契数
"""

async def test_non_stream():
    print("=== 非流式测试 ===")
    result = await generate_code(
        title="Python 斐波那契数列教程",
        author="编程老师",
        transcript=SAMPLE_TRANSCRIPT
    )
    
    if result.success:
        print(f"✅ Success!")
        print(f"Language: {result.language}")
        print(f"Tokens used: {result.tokens_used}")
        print(f"\nGenerated code:\n{result.code}")
    else:
        print(f"❌ Failed: {result.error}")


async def test_stream():
    print("\n=== 流式测试 ===")
    print("Generated code (streaming):")
    
    async for chunk in generate_code_stream(
        title="Python 斐波那契数列教程",
        author="编程老师",
        transcript=SAMPLE_TRANSCRIPT
    ):
        print(chunk, end="", flush=True)
    
    print("\n✅ Stream completed!")


async def main():
    await test_non_stream()
    await test_stream()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 六、验证步骤

### 6.1 快速验证（curl）✅ 已验证通过

```bash
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -d '{
        "model": "glm-4-flash",
        "messages": [
            {"role": "user", "content": "用 Python 写一个计算斐波那契数列的函数，只返回代码"}
        ],
        "max_tokens": 1024
    }'
```

返回示例：
```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

### 6.2 Python 脚本验证

```bash
cd mora_hackathon_ui
pip install httpx
python test_code_generator.py
```

---

## 七、与 Video Processor 集成

### 7.1 完整流程

```python
# pipeline.py

import asyncio
from video_processor import process_video
from code_generator import generate_code

async def video_to_code(video_url: str):
    """完整的视频转代码流程"""
    
    # Step 1: 处理视频，获取转录
    print("Step 1: Processing video...")
    video_result = await process_video(video_url)
    
    if not video_result.success:
        return {"success": False, "error": f"Video processing failed: {video_result.error}"}
    
    print(f"  ✅ Got transcript: {len(video_result.full_text)} chars")
    
    # Step 2: 生成代码
    print("Step 2: Generating code...")
    code_result = await generate_code(
        title=video_result.metadata.title,
        author=video_result.metadata.author,
        transcript=video_result.full_text
    )
    
    if not code_result.success:
        return {"success": False, "error": f"Code generation failed: {code_result.error}"}
    
    print(f"  ✅ Generated {code_result.language} code")
    
    return {
        "success": True,
        "video": {
            "title": video_result.metadata.title,
            "author": video_result.metadata.author,
            "duration": video_result.metadata.duration,
        },
        "code": code_result.code,
        "language": code_result.language,
    }


if __name__ == "__main__":
    result = asyncio.run(video_to_code("https://www.bilibili.com/video/BV1xx411c7mD"))
    print(result)
```

---

## 八、错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| API Key 无效 | 返回认证错误 |
| 请求超时 | 返回超时错误，建议重试 |
| Token 超限 | 截断转录文本，分段处理 |
| 生成内容为空 | 返回生成失败错误 |
| 无法识别代码 | 返回原始响应，标记为 unknown 语言 |

---

## 九、模型选择建议

| 模型 | 特点 | 适用场景 |
|------|------|---------|
| glm-4.7 | 最强代码能力，支持深度思考 | 复杂代码生成 |
| glm-4-flash | 快速响应，成本低 | P0 MVP 验证 |
| glm-4-plus | 平衡性能和成本 | 生产环境 |

P0 建议使用 `glm-4-flash`，快速验证流程。

---

*文档版本：v1.0*
*最后更新：2026-01-01*
