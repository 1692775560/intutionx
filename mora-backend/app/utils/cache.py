import redis
import json
from typing import Optional, Any
from app.config import get_settings

settings = get_settings()

redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_keepalive=True
)

class Cache:
    """Redis缓存工具类"""
    
    @staticmethod
    def get(key: str) -> Optional[Any]:
        """获取缓存"""
        try:
            value = redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error for key {key}: {e}")
            return None
    
    @staticmethod
    def set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存"""
        try:
            ttl = ttl or settings.CACHE_TTL
            serialized = json.dumps(value, ensure_ascii=False)
            redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            print(f"Cache set error for key {key}: {e}")
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """删除缓存"""
        try:
            redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error for key {key}: {e}")
            return False
    
    @staticmethod
    def exists(key: str) -> bool:
        """检查key是否存在"""
        try:
            return redis_client.exists(key) > 0
        except Exception as e:
            print(f"Cache exists error for key {key}: {e}")
            return False

class CacheKeys:
    """缓存key命名规范"""
    
    @staticmethod
    def video_subtitle(video_url: str) -> str:
        """视频字幕缓存key"""
        return f"video:{video_url}:subtitle"
    
    @staticmethod
    def session_result(session_id: str) -> str:
        """会话结果缓存key"""
        return f"session:{session_id}:result"
