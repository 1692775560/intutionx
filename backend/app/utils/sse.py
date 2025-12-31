import json
from typing import Any, Dict

def sse_event(event_type: str, data: Dict[str, Any]) -> str:
    """
    格式化SSE事件
    
    Args:
        event_type: 事件类型（thought, code, timeline等）
        data: 事件数据
        
    Returns:
        格式化的SSE消息字符串
    """
    json_data = json.dumps(data, ensure_ascii=False)
    return f"event: {event_type}\ndata: {json_data}\n\n"
