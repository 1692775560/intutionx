import httpx
from app.config import get_settings
from typing import Dict, Any

settings = get_settings()

class BibiGPTService:
    """BibiGPT API服务"""
    
    BASE_URL = settings.BIBIGPT_API_URL
    API_KEY = settings.BIBIGPT_API_KEY
    TIMEOUT = settings.BIBIGPT_TIMEOUT
    
    @staticmethod
    async def get_subtitle(video_url: str) -> Dict[str, Any]:
        """
        调用BibiGPT API获取视频字幕
        
        Args:
            video_url: 视频URL
            
        Returns:
            字幕数据字典
            
        Raises:
            Exception: API调用失败
        """
        async with httpx.AsyncClient(timeout=BibiGPTService.TIMEOUT) as client:
            try:
                response = await client.get(
                    f"{BibiGPTService.BASE_URL}/getSubtitle",
                    params={
                        "url": video_url,
                        "enabledSpeaker": "true"
                    },
                    headers={
                        "Authorization": f"Bearer {BibiGPTService.API_KEY}"
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                if not data.get("success"):
                    raise Exception("Failed to extract subtitle from BibiGPT")
                
                detail = data.get("detail", {})
                return BibiGPTService._format_response(detail)
                
            except httpx.HTTPStatusError as e:
                raise Exception(f"BibiGPT API error: {e.response.status_code}")
            except httpx.TimeoutException:
                raise Exception("BibiGPT API timeout")
            except Exception as e:
                raise Exception(f"BibiGPT API failed: {str(e)}")
    
    @staticmethod
    def _format_response(detail: Dict[str, Any]) -> Dict[str, Any]:
        """格式化BibiGPT响应"""
        return {
            "title": detail.get("title", "Unknown"),
            "duration": detail.get("duration", 0),
            "thumbnail": detail.get("cover"),
            "author": detail.get("author"),
            "subtitles": [
                {
                    "startTime": sub.get("startTime", 0),
                    "endTime": sub.get("end", 0),
                    "text": sub.get("text", "")
                }
                for sub in detail.get("subtitlesArray", [])
            ]
        }

bibigpt_service = BibiGPTService()
