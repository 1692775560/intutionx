#!/usr/bin/env python3
"""
完整流程测试：Video → Code → Execute
"""

import asyncio
from video_processor import process_video
from code_generator import generate_code
from sandbox_executor import execute_code


async def test_full_pipeline(video_url: str):
    """测试完整的 Video to Code 流程"""
    
    print("=" * 60)
    print("MORA - Video to Code Pipeline Test")
    print("=" * 60)
    print(f"\n📹 Video URL: {video_url}\n")
    
    # Step 1: 处理视频
    print("Step 1: Processing video with BibiGPT...")
    video_result = await process_video(video_url)
    
    if not video_result.success:
        print(f"❌ Video processing failed: {video_result.error}")
        return
    
    print(f"  ✅ Title: {video_result.metadata.title}")
    print(f"  ✅ Author: {video_result.metadata.author}")
    print(f"  ✅ Duration: {video_result.metadata.duration}s")
    print(f"  ✅ Transcript: {len(video_result.full_text)} chars")
    
    # Step 2: 生成代码
    print("\nStep 2: Generating code with Zhipu GLM...")
    code_result = await generate_code(
        title=video_result.metadata.title,
        author=video_result.metadata.author,
        transcript=video_result.full_text
    )
    
    if not code_result.success:
        print(f"❌ Code generation failed: {code_result.error}")
        return
    
    print(f"  ✅ Language: {code_result.language}")
    print(f"  ✅ Tokens used: {code_result.tokens_used}")
    print(f"  ✅ Code length: {len(code_result.code)} chars")
    
    print("\n" + "-" * 40)
    print("Generated Code:")
    print("-" * 40)
    print(code_result.code)
    print("-" * 40)
    
    # Step 3: 执行代码
    print("\nStep 3: Executing code in E2B sandbox...")
    exec_result = execute_code(code_result.code, code_result.language)
    
    if exec_result.success:
        print(f"  ✅ Execution successful!")
        print(f"  ✅ Time: {exec_result.execution_time_ms}ms")
        print("\n" + "-" * 40)
        print("Execution Output:")
        print("-" * 40)
        print(exec_result.output)
    else:
        print(f"  ⚠️ Execution failed: {exec_result.error}")
        print(f"  Status: {exec_result.status}")
    
    print("\n" + "=" * 60)
    print("Pipeline Complete!")
    print("=" * 60)


async def test_individual_modules():
    """单独测试各个模块"""
    
    print("\n" + "=" * 60)
    print("Individual Module Tests")
    print("=" * 60)
    
    # Test 1: Video Processor
    print("\n[Test 1] Video Processor")
    video_result = await process_video("https://www.bilibili.com/video/BV1xs411Q799")
    if video_result.success:
        print(f"  ✅ Got video: {video_result.metadata.title[:50]}...")
    else:
        print(f"  ❌ Failed: {video_result.error}")
    
    # Test 2: Code Generator
    print("\n[Test 2] Code Generator")
    code_result = await generate_code(
        title="Python 入门教程",
        author="测试",
        transcript="今天我们来学习 Python 的基础语法，首先是 print 函数，可以用来输出内容"
    )
    if code_result.success:
        print(f"  ✅ Generated {code_result.language} code ({len(code_result.code)} chars)")
    else:
        print(f"  ❌ Failed: {code_result.error}")
    
    # Test 3: Sandbox Executor
    print("\n[Test 3] Sandbox Executor")
    exec_result = execute_code('print("Hello from E2B!")\nprint(1 + 2 + 3)')
    if exec_result.success:
        print(f"  ✅ Output: {exec_result.output.strip()}")
    else:
        print(f"  ❌ Failed: {exec_result.error}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # 使用命令行参数指定视频 URL
        video_url = sys.argv[1]
    else:
        # 默认测试视频
        video_url = "https://www.bilibili.com/video/BV1xs411Q799"
    
    print("\n🚀 Running individual module tests first...\n")
    asyncio.run(test_individual_modules())
    
    print("\n\n🚀 Running full pipeline test...\n")
    asyncio.run(test_full_pipeline(video_url))
