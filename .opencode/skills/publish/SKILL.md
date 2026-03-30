# 发布作品技能 (Publish)

自动在快手创作者平台发布图文作品。

## 功能特性

- 连接用户已登录的 Chrome 浏览器（无需重新登录）
- 上传图片到图文发布页面
- 填写作品描述
- 自动点击发布按钮
- 验证发布状态

## 前置要求

### Chrome 调试模式

用户需要在本地启动 Chrome 并开启调试端口：

```bash
# Windows 示例
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

或手动打开 Chrome 后访问：

```
https://cp.kuaishou.com/article/publish/video?tabType=2
```

### 验证连接

```bash
curl http://localhost:9222/json/version
```

## 使用方式

### 命令行

```bash
cd .opencode/skills/publish
bun run src/publish-final.ts "C:/path/to/image.jpg" "作品描述 #话题"
```

参数说明：

- 第一个参数：图片文件路径
- 第二个参数：作品描述内容

### Node.js API

```typescript
import { CDPClient, getPageWebSocketUrl } from "./cdp-client"
import { resolve } from "node:path"

async function publishArticle(imagePath: string, description: string) {
  const client = new CDPClient()
  await client.connect(await getPageWebSocketUrl(9222))

  // ... 实现逻辑见 src/publish-final.ts

  await client.close()
}
```

## 工作流程

```
1. 连接 Chrome (CDP WebSocket)
   ↓
2. 启用 Page 和 DOM 域
   ↓
3. 查找图片上传 input[type=file] (accept="image/*")
   ↓
4. 点击上传按钮 [1282, 389]
   ↓
5. 使用 DOM.setFileInputFiles 上传图片
   ↓
6. 填写描述到 contenteditable 元素
   ↓
7. 滚动并点击发布按钮 [985, 1063]
   ↓
8. 验证发布状态（审核中/已发布）
```

## 关键技术发现

### Chrome 108 兼容性

| 功能                       | 支持状态  | 备注        |
| -------------------------- | --------- | ----------- |
| `DOM.setFileInputFiles`    | ✅ 支持   | 上传文件    |
| `Page.setFileInputFiles`   | ❌ 不支持 | Chrome 120+ |
| `Page.handleFileChooser`   | ❌ 不支持 | Chrome 120+ |
| `Input.dispatchMouseEvent` | ✅ 支持   | 鼠标点击    |

### 页面元素定位

| 元素       | 坐标/选择器         | 说明                    |
| ---------- | ------------------- | ----------------------- |
| 上传按钮   | [1282, 389]         | 触发文件选择器          |
| 图片 input | accept="image/\*"   | 注意区分 video 和 image |
| 描述框     | `[contenteditable]` | 使用 JS 填写            |
| 发布按钮   | [985, 1063]         | 可能需要滚动            |

### 页面 URL

```
图文发布: https://cp.kuaishou.com/article/publish/video?tabType=2
视频发布: https://cp.kuaishou.com/article/publish/video?tabType=1
```

## 文件结构

```
publish/
├── SKILL.md           # 本文档
├── package.json       # 依赖配置
├── src/
│   ├── cdp-client.ts # CDP WebSocket 客户端
│   ├── publish-final.ts # 最终可用脚本
│   └── ...
└── test-img.png      # 测试图片
```

## 故障排除

### 1. 无法连接 Chrome

```bash
# 检查端口是否可用
netstat -an | findstr 9222

# 重启 Chrome 调试模式
taskkill /f /im chrome.exe
start chrome.exe --remote-debugging-port=9222
```

### 2. 图片上传失败

- 确认使用的是 `DOM.setFileInputFiles`（非 `Page.setFileInputFiles`）
- 确认找到的是 `accept="image/*"` 的 input，而非 video 的
- 检查文件路径是否为绝对路径

### 3. 描述填写失败

页面使用 `contenteditable` 而非 `textarea`，需要：

```javascript
element.textContent = description
element.dispatchEvent(new Event("input", { bubbles: true }))
```

### 4. 发布按钮点击无效

- 按钮可能在视口外，需要先滚动
- 使用 `Input.synthesizeScrollGesture` 滚动页面
- 发布按钮坐标 [985, 1063] 基于 1920x1080 屏幕

### 5. 页面元素找不到

页面可能使用 Shadow DOM，可尝试：

```javascript
// 遍历所有 shadow root
document.querySelectorAll("*").forEach((el) => {
  if (el.shadowRoot) {
    // 在 shadowRoot.querySelectorAll() 中查找
  }
})
```

## 发布状态检查

脚本会检查页面文本判断发布结果：

| 页面文本   | 状态                  |
| ---------- | --------------------- |
| "审核中"   | ✅ 发布成功，等待审核 |
| "发布成功" | ✅ 发布成功           |
| "已发布"   | ✅ 已发布             |
| 其他       | ⚠️ 需要人工检查       |
