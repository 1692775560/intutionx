# UI 重设计规划文档

## 一、设计对比分析

### 1.1 当前 UI vs Figma 设计

| 元素 | 当前 UI | Figma 设计 | 需要修改 |
|------|---------|-----------|---------|
| **首页布局** | 紫粉渐变风格 | 简洁白色背景 + 黑色主色调 | ✅ |
| **Logo** | 紫色渐变圆形 | 黑色 Mora 文字 + 图标 | ✅ |
| **输入框** | 简单输入框 | 圆角卡片 + 打字机效果 placeholder | ✅ |
| **功能按钮** | 紫粉渐变高亮 | 白色背景 + 黑色边框，选中蓝色 | ✅ |
| **工作区布局** | 左右分栏 | 左侧可调整宽度 + 圆角卡片 | ✅ |
| **视频播放器** | 黑色背景 + 播放图标 | 圆角卡片 + 视频标题覆盖层 | ✅ |
| **代码面板** | 绿色代码 | 深色主题 #1e1e1e + 灰色代码 | ✅ |
| **执行结果** | 蓝色代码 | 白色背景 + 灰色代码 | ✅ |
| **Chat 窗口** | 固定位置浮窗 | 可拖拽 + 可调整大小 | ✅ |
| **Header** | 紫色渐变 | 白色背景 + 简洁按钮 | ✅ |

### 1.2 Figma 设计特点

1. **配色方案**
   - 主色：黑色 (#000000)
   - 背景：白色 (#ffffff) / 浅灰 (#f7f7f8)
   - 强调色：蓝色 (#2D8CFF) - 仅用于选中状态
   - 文字：深灰 (#333333) / 浅灰 (#717182)

2. **圆角设计**
   - 卡片：24px (rounded-2xl / rounded-3xl)
   - 按钮：full (rounded-full) 或 lg (rounded-lg)
   - 输入框：16px (rounded-2xl)

3. **阴影效果**
   - 卡片：shadow-sm / shadow-lg
   - 悬停：hover:shadow-md

4. **动画效果**
   - 打字机效果 placeholder
   - hover:scale-105 按钮缩放
   - 渐入动画 animate-fade-in

---

## 二、修改计划

### 2.1 Home.tsx 修改

#### Header
```diff
- 紫粉渐变 Logo
+ 黑色 Mora 文字 Logo
- Upgrade 按钮
+ Sign In + Try for Free 按钮
```

#### Hero Section
```diff
- 紫粉渐变标题
+ 黑色标题 "Hello, I'm Mora"
- 紫色背景输入区
+ 白色卡片 + 阴影
- 静态 placeholder
+ 打字机效果 placeholder
```

#### 功能按钮
```diff
- 紫粉渐变选中状态
+ 蓝色 (#2D8CFF) 选中状态
- 灰色边框未选中
+ 白色背景 + 灰色边框未选中
```

#### 移除元素
- 移除 "Trusted by developers" 部分
- 移除 "Powerful Capabilities" 部分
- 移除 "Creator Build" 部分
- 移除 Stats 部分
- 移除 CTA 部分

#### 新增元素
- Recent Projects 区域
- Inspiration Discovery 画廊（可选，P1）

### 2.2 Workspace.tsx 修改

#### Header
```diff
- 白色背景 + Back 按钮
+ 简洁 Header + Chat/Export 按钮
```

#### 左侧面板
```diff
- 固定宽度
+ 可调整宽度 (Resizable)
- 黑色视频区域
+ 圆角卡片 + 视频标题覆盖层
- 白色思考过程
+ 灰色背景 + 白色卡片
```

#### 右侧面板
```diff
- 白色代码区域 + 绿色代码
+ 深色代码区域 (#1e1e1e) + 灰色代码
- 白色执行结果 + 蓝色代码
+ 白色执行结果 + 灰色代码
```

#### Chat 窗口
```diff
- 固定位置
+ 可拖拽位置
- 固定大小
+ 可调整大小 (Resizable)
- 紫色渐变 Header
+ 灰色 Header
```

---

## 三、实施步骤

### Phase 1: 基础样式更新 ✅ 已完成
1. ✅ 更新 Home.tsx - 简洁白色风格 + 打字机效果
2. ✅ 更新 Workspace.tsx - 深色代码面板 + 可调整布局

### Phase 2: 组件优化 ✅ 已完成
1. ✅ 添加打字机效果 placeholder
2. ✅ 添加 Resizable 组件（左侧面板 + Chat 窗口）
3. ✅ 优化 Chat 窗口拖拽

### Phase 3: 细节完善
- [ ] 添加更多动画效果
- [ ] 优化响应式布局
- [ ] 测试和调整

---

## 四、依赖安装

需要安装的新依赖：
```bash
pnpm add re-resizable
```

---

## 五、文件修改清单

| 文件 | 修改类型 | 优先级 |
|------|---------|--------|
| `client/src/index.css` | 更新全局样式 | P0 |
| `client/src/pages/Home.tsx` | 重构首页 | P0 |
| `client/src/pages/Workspace.tsx` | 重构工作区 | P0 |

---

*创建时间：2026-01-01*
