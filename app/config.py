from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    """应用配置"""
    
    # 应用基础配置
    APP_NAME: str = "Mora Backend"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    # 数据库配置
    DATABASE_URL: str
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # BibiGPT API配置
    BIBIGPT_API_KEY: str
    BIBIGPT_API_URL: str = "https://api.bibigpt.co/api/v1"
    BIBIGPT_TIMEOUT: int = 60
    
    # DeepSeek API配置
    DEEPSEEK_API_KEY: str
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-coder"
    DEEPSEEK_TIMEOUT: int = 120
    DEEPSEEK_TEMPERATURE: float = 0.3
    
    # 功能配置
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600
    VIDEO_CACHE_TTL: int = 86400
    MAX_VIDEO_DURATION: int = 7200
    
    # 限流配置
    MAX_REQUESTS_PER_MINUTE: int = 10
    
    # CORS配置
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
