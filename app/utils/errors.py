from enum import Enum
from typing import Dict

class ErrorCode(str, Enum):
    """错误码枚举"""
    
    INVALID_VIDEO_URL = "1001"
    VIDEO_TOO_LONG = "1002"
    UNSUPPORTED_PLATFORM = "1003"
    
    BIBIGPT_API_ERROR = "2001"
    NO_SUBTITLE = "2002"
    DEEPSEEK_API_ERROR = "2003"
    
    AI_GENERATION_FAILED = "3001"
    DATABASE_ERROR = "3002"
    CACHE_ERROR = "3003"
    
    INTERNAL_ERROR = "5001"

ERROR_MESSAGES: Dict[ErrorCode, str] = {
    ErrorCode.INVALID_VIDEO_URL: "视频URL不支持，请使用YouTube/Bilibili/TikTok链接",
    ErrorCode.VIDEO_TOO_LONG: "视频时长超过2小时，暂不支持",
    ErrorCode.UNSUPPORTED_PLATFORM: "不支持的视频平台",
    ErrorCode.BIBIGPT_API_ERROR: "字幕提取失败，请稍后重试",
    ErrorCode.NO_SUBTITLE: "该视频没有可用字幕",
    ErrorCode.DEEPSEEK_API_ERROR: "代码生成失败，请重试",
    ErrorCode.AI_GENERATION_FAILED: "AI生成失败",
    ErrorCode.DATABASE_ERROR: "数据库操作失败",
    ErrorCode.CACHE_ERROR: "缓存操作失败",
    ErrorCode.INTERNAL_ERROR: "服务器内部错误",
}

def get_error_message(code: ErrorCode) -> str:
    """获取错误消息"""
    return ERROR_MESSAGES.get(code, "Unknown error")
