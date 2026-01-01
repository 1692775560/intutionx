# image_service.py
# 项目封面图片服务 - 使用 AI 生成

import httpx
import os
import base64

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# 默认图片（生成失败时使用）
DEFAULT_IMAGES = {
    "deep-research": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    "video-to-code": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
}


async def generate_project_image(keyword: str, project_type: str = "deep-research") -> str:
    """使用 Gemini 3 Pro 生成项目封面图片"""
    try:
        # 构建生成图片的 prompt
        if project_type == "deep-research":
            prompt = f"Generate a minimalist, modern tech illustration representing '{keyword}'. Style: clean gradient background, abstract geometric shapes, professional look, suitable as a project thumbnail. No text in the image."
        else:
            prompt = f"Generate a coding/programming themed illustration for '{keyword}'. Style: dark theme with code elements, modern tech aesthetic, suitable as a project thumbnail. No text in the image."
        
        print(f"[ImageService] 开始生成图片: keyword={keyword}, type={project_type}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://mora.app",
                    "X-Title": "Mora",
                },
                json={
                    "model": "google/gemini-3-pro-image-preview",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "modalities": ["image", "text"],  # 必须指定 modalities 才能生成图片
                }
            )
            
            print(f"[ImageService] API 响应状态: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[ImageService] 完整响应: {data}")
                
                # 解析响应，获取图片
                choices = data.get("choices", [])
                if choices:
                    message = choices[0].get("message", {})
                    
                    # 首先检查 images 字段（OpenRouter 标准格式）
                    images = message.get("images", [])
                    if images:
                        for img in images:
                            if isinstance(img, dict):
                                # 格式: {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
                                if img.get("type") == "image_url":
                                    image_url = img.get("image_url", {}).get("url", "")
                                    if image_url:
                                        print(f"[ImageService] 成功生成图片 (images array)")
                                        return image_url
                                # 直接的 image_url 格式
                                elif "image_url" in img:
                                    image_url = img.get("image_url", {}).get("url", "")
                                    if image_url:
                                        print(f"[ImageService] 成功生成图片 (images.image_url)")
                                        return image_url
                    
                    content = message.get("content", [])
                    
                    print(f"[ImageService] content 类型: {type(content)}")
                    
                    # 检查是否有图片内容
                    if isinstance(content, list):
                        for idx, item in enumerate(content):
                            if isinstance(item, dict):
                                # 检查 data 字段（OpenRouter/Gemini 格式）
                                if "data" in item:
                                    b64_data = item["data"]
                                    if b64_data and len(b64_data) > 1000:  # 确保是图片数据
                                        image_url = f"data:image/png;base64,{b64_data}"
                                        print(f"[ImageService] 成功生成图片 (data field)")
                                        return image_url
                                
                                # 检查 inline_data 格式 (Gemini 原生格式)
                                if "inline_data" in item:
                                    inline_data = item["inline_data"]
                                    mime_type = inline_data.get("mime_type", "image/png")
                                    b64_data = inline_data.get("data", "")
                                    if b64_data:
                                        image_url = f"data:{mime_type};base64,{b64_data}"
                                        print(f"[ImageService] 成功生成图片 (inline_data)")
                                        return image_url
                                
                                # 检查 image_url 格式 (OpenAI 格式)
                                if item.get("type") == "image_url":
                                    image_url = item.get("image_url", {}).get("url", "")
                                    if image_url:
                                        print(f"[ImageService] 成功生成图片 (image_url)")
                                        return image_url
                                        
                                # 检查 image 格式
                                if item.get("type") == "image":
                                    image_data = item.get("source", {}).get("data", "")
                                    media_type = item.get("source", {}).get("media_type", "image/png")
                                    if image_data:
                                        image_url = f"data:{media_type};base64,{image_data}"
                                        print(f"[ImageService] 成功生成图片 (image)")
                                        return image_url
                    
                    elif isinstance(content, str):
                        # 可能是 base64 图片
                        if content.startswith("data:image"):
                            print(f"[ImageService] 成功生成图片 (base64 string)")
                            return content
                        # 检查是否是纯 base64 数据（没有 data: 前缀）
                        elif len(content) > 1000 and content.replace('\n', '').replace(' ', ''):
                            # 尝试作为 base64 图片处理
                            try:
                                import base64
                                # 验证是否是有效的 base64
                                base64.b64decode(content[:100])
                                image_url = f"data:image/png;base64,{content}"
                                print(f"[ImageService] 成功生成图片 (raw base64)")
                                return image_url
                            except:
                                pass
                
                # 检查是否有 parts 格式（Gemini 特有）
                if choices:
                    message = choices[0].get("message", {})
                    parts = message.get("parts", [])
                    for part in parts:
                        if isinstance(part, dict):
                            if "inline_data" in part:
                                inline_data = part["inline_data"]
                                mime_type = inline_data.get("mime_type", "image/png")
                                b64_data = inline_data.get("data", "")
                                if b64_data:
                                    image_url = f"data:{mime_type};base64,{b64_data}"
                                    print(f"[ImageService] 成功生成图片 (parts inline_data)")
                                    return image_url
                
                print(f"[ImageService] 未能从响应中提取图片")
            else:
                print(f"[ImageService] API 错误: {response.text}")
                
    except Exception as e:
        print(f"[ImageService] 生成图片失败: {e}")
        import traceback
        traceback.print_exc()
    
    # 返回默认图片
    print(f"[ImageService] 使用默认图片")
    return DEFAULT_IMAGES.get(project_type, DEFAULT_IMAGES["deep-research"])


def get_project_image(keyword: str, project_type: str = "deep-research") -> str:
    """同步版本 - 返回默认图片，实际生成在异步函数中"""
    return DEFAULT_IMAGES.get(project_type, DEFAULT_IMAGES["deep-research"])
