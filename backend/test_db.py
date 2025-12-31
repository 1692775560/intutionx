import sys
import uuid
from datetime import datetime
from app.database import SessionLocal
from app.models import Session, SessionStatus

try:
    db = SessionLocal()
    
    # 创建测试会话
    test_session = Session(
        id=uuid.uuid4(),
        video_url="https://www.bilibili.com/video/BV1xx411c7mD",
        language="python",
        status=SessionStatus.CREATED.value,  # 使用.value获取字符串值
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(test_session)
    db.commit()
    db.refresh(test_session)
    
    print(f"✅ 成功创建会话: {test_session.id}")
    print(f"   状态: {test_session.status}")
    print(f"   视频URL: {test_session.video_url}")
    
    db.close()
    
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
