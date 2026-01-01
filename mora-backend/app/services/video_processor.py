import re
from typing import Optional

class VideoProcessor:
    """视频处理器"""
    
    YOUTUBE_REGEX = r'^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+'
    BILIBILI_REGEX = r'^(https?://)?(www\.)?bilibili\.com/(video|bangumi)/.+'
    TIKTOK_REGEX = r'^(https?://)?(www\.)?(tiktok\.com|vm\.tiktok\.com)/.+'
    
    @staticmethod
    def is_valid_url(url: str) -> bool:
        """验证URL是否为支持的视频平台"""
        patterns = [
            VideoProcessor.YOUTUBE_REGEX,
            VideoProcessor.BILIBILI_REGEX,
            VideoProcessor.TIKTOK_REGEX,
        ]
        return any(re.match(pattern, url, re.IGNORECASE) for pattern in patterns)
    
    @staticmethod
    def get_platform(url: str) -> Optional[str]:
        """识别视频平台"""
        if re.match(VideoProcessor.YOUTUBE_REGEX, url, re.IGNORECASE):
            return "youtube"
        elif re.match(VideoProcessor.BILIBILI_REGEX, url, re.IGNORECASE):
            return "bilibili"
        elif re.match(VideoProcessor.TIKTOK_REGEX, url, re.IGNORECASE):
            return "tiktok"
        return None
    
    @staticmethod
    def validate_duration(duration: int, max_duration: int) -> bool:
        """验证视频时长"""
        return 0 < duration <= max_duration
    
    @staticmethod
    def extract_code_from_tags(text: str) -> str:
        """
        从<code>标记中提取代码
        
        Args:
            text: 包含<code>标记的文本
            
        Returns:
            提取的代码
        """
        import re
        
        # 提取<code>...</code>之间的内容
        pattern = r'<code>(.*?)</code>'
        matches = re.findall(pattern, text, re.DOTALL)
        
        if matches:
            # 合并所有匹配的代码块
            code = '\n\n'.join(matches)
            return code.strip()
        
        # 如果没有<code>标记，返回原文本
        return text
    
    @staticmethod
    def validate_python_syntax(code: str) -> tuple[bool, str]:
        """
        验证Python代码语法
        
        Args:
            code: Python代码
            
        Returns:
            (是否有效, 错误信息)
        """
        import ast
        
        try:
            ast.parse(code)
            return True, ""
        except SyntaxError as e:
            return False, f"Syntax error at line {e.lineno}: {e.msg}"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def clean_code(code: str) -> str:
        """
        清理生成的代码，移除markdown和格式问题
        
        Args:
            code: 原始生成的代码
            
        Returns:
            清理后的代码
        """
        # Remove markdown code blocks
        code = re.sub(r'^```python\s*\n', '', code, flags=re.MULTILINE)
        code = re.sub(r'^```\s*\n', '', code, flags=re.MULTILINE)
        code = re.sub(r'\n```\s*$', '', code)
        code = re.sub(r'^```$', '', code, flags=re.MULTILINE)
        
        # Remove extra blank lines (more than 2 consecutive)
        code = re.sub(r'\n{3,}', '\n\n', code)
        
        # Ensure it starts with proper encoding
        if not code.strip().startswith('#'):
            code = '# coding: utf-8\n\n' + code
        
        # Remove trailing whitespace from each line
        lines = code.split('\n')
        lines = [line.rstrip() for line in lines]
        code = '\n'.join(lines)
        
        # Ensure ends with newline
        if not code.endswith('\n'):
            code += '\n'
        
        return code.strip() + '\n'
