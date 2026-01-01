# sandbox_executor.py
# 代码执行模块 - 使用 E2B 沙盒执行代码

import os
import time
from dataclasses import dataclass
from typing import Optional

E2B_API_KEY = os.getenv("E2B_API_KEY", "e2b_ef74fea3d74873ba65ea43b97caf9cd20e9bb9fe")


@dataclass
class ExecutionResult:
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    status: str = "success"  # success, error, timeout
    execution_time_ms: int = 0


def execute_code(
    code: str,
    language: str = "python",
    timeout: int = 30
) -> ExecutionResult:
    """
    使用 E2B 沙盒执行代码
    """
    # 设置 API Key
    os.environ["E2B_API_KEY"] = E2B_API_KEY
    
    from e2b_code_interpreter import Sandbox
    
    start_time = time.time()
    sbx = None
    
    try:
        # 创建沙盒
        sbx = Sandbox.create()
        
        # 执行代码
        execution = sbx.run_code(code)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        # 检查错误
        if execution.error:
            error_msg = f"{execution.error.name}: {execution.error.value}"
            return ExecutionResult(
                success=False,
                error=error_msg,
                status="error",
                execution_time_ms=execution_time,
            )
        
        # 获取输出
        stdout = "\n".join(execution.logs.stdout) if execution.logs.stdout else ""
        
        return ExecutionResult(
            success=True,
            output=stdout,
            status="success",
            execution_time_ms=execution_time,
        )
        
    except Exception as e:
        execution_time = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        
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
    
    finally:
        if sbx:
            try:
                sbx.kill()
            except:
                pass
