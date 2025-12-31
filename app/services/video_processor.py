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
