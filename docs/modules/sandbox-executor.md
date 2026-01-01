# Sandbox Executor 模块文档

## 一、模块概述

### 1.1 模块职责
Sandbox Executor 负责在安全隔离的环境中执行 AI 生成的代码：
- 接收生成的代码和语言类型
- 在云端沙盒中安全执行
- 返回执行结果（stdout、stderr、状态）
- 处理超时和错误

### 1.2 技术方案
使用 **E2B Code Interpreter** 作为代码执行沙盒：
- 专为 AI 代码执行设计
- 支持 Python（预装数据分析库）
- 云端执行，安全隔离
- API 简洁易用
- 免费额度：100 小时/月

---

## 二、E2B SDK 集成

### 2.1 服务信息

| 属性 | 值 |
|------|-----|
| 服务 | E2B Code Interpreter |
| SDK | `e2b-code-interpreter` |
| 控制台 | https://e2b.dev/dashboard |
| 文档 | https://e2b.dev/docs |
| 免费额度 | 100 小时/月 |

### 2.2 获取 API Key

1. 访问 https://e2b.dev/dashboard
2. 注册/登录账号
3. 在 Dashboard 中获取 API Key

### 2.3 安装

```bash
pip install e2b-code-interpreter
```

### 2.4 认证配置

```bash
# 设置环境变量
export E2B_API_KEY=your_api_key_here
```

---

## 三、API 使用

### 3.1 基本用法

```python
from e2b_code_interpreter import Sandbox

# 创建沙盒
sbx = Sandbox()

# 执行代码
execution = sbx.run_code("print('Hello from E2B!')")

# 获取输出
print(execution.logs.stdout)  # ['Hello from E2B!']

# 关闭沙盒
sbx.kill()
```

### 3.2 执行结果结构

```python
execution = sbx.run_code(code)

# 标准输出
execution.logs.stdout  # List[str]

# 标准错误
execution.logs.stderr  # List[str]

# 错误信息（如果有）
execution.error        # ExecutionError | None
execution.error.name   # 错误类型
execution.error.value  # 错误信息
execution.error.traceback  # 堆栈跟踪

# 结果（图表、数据等）
execution.results      # List[Result]
```

### 3.3 超时设置

```python
# 创建沙盒时设置超时
sbx = Sandbox(timeout=60)  # 60 秒后自动关闭

# 执行代码时设置超时
execution = sbx.run_code(code, timeout=30)
```

---

## 四、模块接口设计

### 4.1 输入

```typescript
interface SandboxExecutorInput {
  code: string;           // 要执行的代码
  language: string;       // 编程语言 (目前主要支持 python)
  timeout?: number;       // 超时时间（秒），默认 30
}
```

### 4.2 输出

```typescript
interface SandboxExecutorOutput {
  success: boolean;
  output?: string;        // stdout 输出
  error?: string;         // 错误信息
  status: "success" | "error" | "timeout";
  execution_time?: number; // 执行耗时（毫秒）
}
```

---

## 五、实现代码

### 5.1 Python 实现

```python
# sandbox_executor.py

import os
import time
from dataclasses import dataclass
from typing import Optional

E2B_API_KEY = os.getenv("E2B_API_KEY")


@dataclass
class ExecutionResult:
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    status: str = "success"  # success, error, timeout
    execution_time_ms: int = 0


class SandboxExecutor:
    """
    使用 E2B 执行代码的沙盒执行器
    """
    
    def __init__(self, api_key: str = None):
        from e2b_code_interpreter import Sandbox
        
        self.api_key = api_key or E2B_API_KEY
        if not self.api_key:
            raise ValueError("E2B_API_KEY is required")
        
        os.environ["E2B_API_KEY"] = self.api_key
        self.Sandbox = Sandbox
        self.sbx = None
    
    def _ensure_sandbox(self):
        """确保沙盒已创建"""
        if self.sbx is None:
            self.sbx = self.Sandbox(timeout=300)  # 5 分钟超时
    
    def execute(
        self,
        code: str,
        language: str = "python",
        timeout: int = 30
    ) -> ExecutionResult:
        """
        执行代码并返回结果
        
        Args:
            code: 要执行的代码
            language: 编程语言 (目前主要支持 python)
            timeout: 超时时间（秒）
        
        Returns:
            ExecutionResult 对象
        """
        start_time = time.time()
        
        try:
            self._ensure_sandbox()
            
            # 执行代码
            execution = self.sbx.run_code(code, timeout=timeout)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            # 检查是否有错误
            if execution.error:
                error_msg = f"{execution.error.name}: {execution.error.value}"
                if execution.error.traceback:
                    error_msg += f"\n{execution.error.traceback}"
                
                return ExecutionResult(
                    success=False,
                    error=error_msg,
                    status="error",
                    execution_time_ms=execution_time,
                )
            
            # 获取输出
            stdout = "\n".join(execution.logs.stdout) if execution.logs.stdout else ""
            stderr = "\n".join(execution.logs.stderr) if execution.logs.stderr else ""
            
            output = stdout
            if stderr:
                output += f"\n[stderr]\n{stderr}"
            
            return ExecutionResult(
                success=True,
                output=output,
                status="success",
                execution_time_ms=execution_time,
            )
                
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            
            # 判断是否超时
            if "timeout" in error_msg.lower():
                return ExecutionResult(
                    success=False,
                    error=f"Execution timeout after {timeout} seconds",
                    status="timeout",
                    execution_time_ms=execution_time,
                )
            
            return ExecutionResult(
                success=False,
                error=error_msg,
                status="error",
                execution_time_ms=execution_time,
            )
    
    def close(self):
        """释放资源"""
        if self.sbx:
            try:
                self.sbx.kill()
            except Exception:
                pass
            self.sbx = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# 便捷函数
def execute_code(
    code: str,
    language: str = "python",
    timeout: int = 30
) -> ExecutionResult:
    """
    一次性执行代码（自动管理沙盒）
    """
    with SandboxExecutor() as executor:
        return executor.execute(code, language, timeout)
```

### 5.2 测试脚本

```python
# test_sandbox_executor.py

from sandbox_executor import SandboxExecutor, execute_code

def test_basic_execution():
    """测试基本代码执行"""
    print("=== 测试基本代码执行 ===")
    
    code = """
print("Hello from E2B sandbox!")
result = sum(range(1, 11))
print(f"Sum of 1-10: {result}")
"""
    
    result = execute_code(code)
    
    if result.success:
        print(f"✅ Success!")
        print(f"Output:\n{result.output}")
        print(f"Execution time: {result.execution_time_ms}ms")
    else:
        print(f"❌ Failed: {result.error}")


def test_data_analysis():
    """测试数据分析代码"""
    print("\n=== 测试数据分析代码 ===")
    
    code = """
import pandas as pd
import numpy as np

# 创建示例数据
data = {
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, 30, 35, 28],
    'score': [85, 92, 78, 95]
}
df = pd.DataFrame(data)

print("DataFrame:")
print(df)
print(f"\\nAverage age: {df['age'].mean():.1f}")
print(f"Average score: {df['score'].mean():.1f}")
"""
    
    result = execute_code(code)
    
    if result.success:
        print(f"✅ Success!")
        print(f"Output:\n{result.output}")
    else:
        print(f"❌ Failed: {result.error}")


def test_error_handling():
    """测试错误处理"""
    print("\n=== 测试错误处理 ===")
    
    code = """
# 这段代码会报错
print(undefined_variable)
"""
    
    result = execute_code(code)
    
    if result.success:
        print(f"Output: {result.output}")
    else:
        print(f"✅ Error caught correctly!")
        print(f"Status: {result.status}")
        print(f"Error: {result.error}")


def test_sandbox_reuse():
    """测试沙盒复用"""
    print("\n=== 测试沙盒复用 ===")
    
    with SandboxExecutor() as executor:
        # 第一次执行 - 定义变量
        result1 = executor.execute("x = 10\nprint(f'x = {x}')")
        print(f"First: {result1.output.strip()}")
        
        # 第二次执行 - 使用之前定义的变量
        result2 = executor.execute("y = x * 2\nprint(f'y = {y}')")
        print(f"Second: {result2.output.strip()}")
        
        # 第三次执行
        result3 = executor.execute("print(f'x + y = {x + y}')")
        print(f"Third: {result3.output.strip()}")
    
    print("✅ Sandbox reuse works!")


if __name__ == "__main__":
    test_basic_execution()
    test_data_analysis()
    test_error_handling()
    test_sandbox_reuse()
```

---

## 六、验证步骤

### 6.1 获取 E2B API Key

1. 访问 https://e2b.dev
2. 点击 "Get Started" 注册账号
3. 进入 Dashboard
4. 复制 API Key

### 6.2 设置环境变量

```bash
export E2B_API_KEY=e2b_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 6.3 安装依赖

```bash
pip install e2b-code-interpreter
```

### 6.4 快速验证

```python
from e2b_code_interpreter import Sandbox

# 创建沙盒
sbx = Sandbox()

# 执行代码
execution = sbx.run_code("""
print("Hello from E2B!")
import sys
print(f"Python version: {sys.version}")
""")

# 打印输出
for line in execution.logs.stdout:
    print(line)

# 关闭沙盒
sbx.kill()
```

---

## 七、与完整流程集成

### 7.1 Video to Code 完整流程

```python
# pipeline.py

import asyncio
from video_processor import process_video
from code_generator import generate_code
from sandbox_executor import execute_code

async def video_to_code_and_run(video_url: str):
    """完整的视频转代码并执行流程"""
    
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
    
    # Step 3: 执行代码
    print("Step 3: Executing code in E2B sandbox...")
    exec_result = execute_code(
        code=code_result.code,
        language=code_result.language,
        timeout=30
    )
    
    if exec_result.success:
        print(f"  ✅ Code executed successfully")
    else:
        print(f"  ⚠️ Execution failed: {exec_result.error}")
    
    return {
        "success": True,
        "video": {
            "title": video_result.metadata.title,
            "author": video_result.metadata.author,
            "duration": video_result.metadata.duration,
        },
        "code": code_result.code,
        "language": code_result.language,
        "execution": {
            "success": exec_result.success,
            "output": exec_result.output,
            "error": exec_result.error,
            "status": exec_result.status,
        }
    }


if __name__ == "__main__":
    result = asyncio.run(video_to_code_and_run(
        "https://www.bilibili.com/video/BV1xs411Q799"
    ))
    
    print("\n" + "=" * 50)
    print("FINAL RESULT")
    print("=" * 50)
    print(f"Video: {result['video']['title']}")
    print(f"Language: {result['language']}")
    print(f"Execution Status: {result['execution']['status']}")
    if result['execution']['output']:
        print(f"Output:\n{result['execution']['output']}")
```

---

## 八、错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| API Key 无效 | 返回认证错误，提示检查配置 |
| 沙盒创建失败 | 返回错误，可能是配额不足 |
| 代码语法错误 | 返回执行错误，包含 traceback |
| 执行超时 | 返回 timeout 状态 |
| 网络错误 | 返回连接错误，建议重试 |

---

## 九、E2B 特性

### 9.1 预装库

E2B Code Interpreter 沙盒预装了常用的 Python 库：
- pandas
- numpy
- matplotlib
- seaborn
- scikit-learn
- 等等

### 9.2 沙盒复用

同一个沙盒实例可以多次执行代码，变量状态会保留：

```python
sbx = Sandbox()

# 第一次执行
sbx.run_code("x = 10")

# 第二次执行可以访问 x
sbx.run_code("print(x * 2)")  # 输出: 20

sbx.kill()
```

### 9.3 文件操作

```python
# 写入文件
sbx.files.write("/home/user/data.txt", "Hello World")

# 读取文件
content = sbx.files.read("/home/user/data.txt")
```

---

## 十、成本与限制

### 10.1 免费额度

- 100 小时/月的沙盒运行时间
- 对于 P0 MVP 验证足够

### 10.2 限制

| 限制项 | 值 |
|--------|-----|
| 默认沙盒超时 | 5 分钟 |
| 单次执行超时 | 可配置 |
| 支持语言 | Python（主要）、JavaScript |

---

*文档版本：v1.0*
*最后更新：2026-01-01*
