# OpenAiCode Browser 自动化技术设计文档

## 1. 概述

本文档描述如何在 OpenAiCode 中实现浏览器自动化功能，参考 gstack browse 的架构设计。

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenAiCode Agent                                                  │
│                                                                 │
│  "browse goto https://example.com"                               │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐    HTTP POST     ┌──────────────┐                │
│  │ browse    │ ──────────────── │ Bun HTTP     │                │
│  │ tool      │  localhost:rand  │ server       │                │
│  │           │  Bearer token    │              │                │
│  │           │ ◄──────────────  │  Playwright  │──── Chromium   │
│  └──────────┘  plain text       │  API calls   │   (headless)   │
│   (内置工具)                     └──────────────┘                │
│   0 token 开销                    persistent daemon              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块结构

```
packages/opencode/src/
└── browser/
    ├── index.ts           # 导出所有模块
    ├── config.ts          # 配置管理（状态文件路径、日志路径）
    ├── buffers.ts         # Console/Network/Dialog 环形缓冲区
    ├── browser-manager.ts # Chromium 生命周期管理
    ├── server.ts          # HTTP 服务器
    ├── commands.ts        # 命令定义（只读/写入/元命令）
    ├── read-commands.ts   # 读取命令实现
    ├── write-commands.ts # 写入命令实现
    ├── meta-commands.ts  # 元命令实现（截图、标签页等）
    ├── snapshot.ts        # Snapshot 系统（@ref 映射）
    └── platform.ts       # 平台特定代码

packages/opencode/src/tool/
└── browse.ts              # OpenAiCode 工具定义
```

## 3. 命令系统

### 3.1 命令分类

| 分类            | 命令                                                                                        | 说明       |
| --------------- | ------------------------------------------------------------------------------------------- | ---------- |
| **Navigation**  | `goto`, `back`, `forward`, `reload`, `url`                                                  | 页面导航   |
| **Reading**     | `text`, `html`, `links`, `forms`, `accessibility`                                           | 内容提取   |
| **Interaction** | `click`, `fill`, `select`, `hover`, `type`, `press`, `scroll`, `wait`, `viewport`, `upload` | 页面交互   |
| **Inspection**  | `js`, `eval`, `css`, `attrs`, `is`, `console`, `network`, `cookies`, `storage`, `perf`      | 检查调试   |
| **Visual**      | `screenshot`, `pdf`, `responsive`                                                           | 可视化输出 |
| **Meta**        | `tabs`, `tab`, `newtab`, `closetab`, `snapshot`, `diff`, `chain`, `handoff`, `resume`       | 元操作     |

### 3.2 命令参数

所有命令通过工具的参数传递，格式为：

- `command`: 主命令 (string)
- `args`: 命令参数 (string[])

```typescript
// 示例调用
await browseTool.execute(
  {
    command: "goto",
    args: ["https://example.com"],
  },
  ctx,
)
```

## 4. Snapshot 系统

### 4.1 Ref 机制

1. `page.locator(scope).ariaSnapshot()` 返回 YAML 风格的可访问性树
2. 解析器为每个元素分配 refs (`@e1`, `@e2`, ...)
3. 为每个 ref 构建 Playwright Locator (使用 `getByRole` + nth-child)
4. 后续命令如 `click @e3` 通过查找 Locator 执行点击

### 4.2 Ref 过期检测

- SPA 可能无导航修改 DOM (React router, 模态框)
- `resolveRef()` 执行 `count()` 检查
- 元素数量为 0 时抛出错误，提示重新运行 `snapshot`

### 4.3 扩展 Snapshot 特性

| 标志 | 说明                                                  |
| ---- | ----------------------------------------------------- |
| `-i` | 返回交互式 refs（可点击元素）                         |
| `-c` | 包含 CSS refs（无 ARIA 的可交互元素）                 |
| `-D` | 与上一次 snapshot 对比，返回 diff                     |
| `-a` | 截图并标注 ref 位置                                   |
| `-C` | 扫描非 ARIA 可交互元素（`cursor:pointer`, `onclick`） |

## 5. 生命周期管理

### 5.1 启动流程

1. **首次调用**: CLI 检查 `.opencode/browse.json`
2. **无状态文件**: 启动 Bun HTTP 服务器
3. **服务器**: 通过 Playwright 启动 headless Chromium
4. **端口分配**: 随机 10000-60000
5. **认证**: 生成 UUID 作为 Bearer Token
6. **状态文件**: 写入 `.opencode/browse.json`

### 5.2 后续调用

1. CLI 读取状态文件
2. HTTP POST 请求 + Bearer Token
3. 服务器处理命令，返回纯文本
4. CLI 打印到 stdout

### 5.3 空闲关闭

- 默认 30 分钟无活动后自动关闭
- 可通过 `BROWSE_IDLE_TIMEOUT` 环境变量配置
- 清理状态文件

### 5.4 崩溃处理

- Chromium 断开连接时服务器立即退出
- CLI 检测到后自动启动新服务器
- 不隐藏失败，快速失败

## 6. 与 OpenAiCode 集成

### 6.1 工具定义

```typescript
// packages/opencode/src/tool/browse.ts
export const BrowseTool: Tool.Definition = {
  id: "browse",
  description: "Control a headless browser for web automation, testing, and data extraction",
  parameters: z.object({
    command: z.string().describe("Command: goto, click, snapshot, screenshot, text, etc."),
    args: z.array(z.string()).optional().describe("Command arguments"),
  }),
  execute: async (params, ctx) => {
    const result = await BrowserClient.execute(params.command, params.args ?? [])
    return result
  },
}
```

### 6.2 权限控制

- 使用 OpenAiCode 现有的权限系统
- `browse.goto` 需要网络权限
- `browse.screenshot` 需要文件写入权限

### 6.3 输出处理

- 纯文本输出，直接返回
- 大输出使用 `Truncate` 模块截断
- 截图保存到文件，返回文件路径

## 7. 依赖管理

### 7.1 新增依赖

```json
{
  "dependencies": {
    "playwright": "^1.58.2"
  }
}
```

### 7.2 现有依赖

- `packages/app` 已安装 `@playwright/test`
- 可共享 Chromium 安装

## 8. 实现计划

| 阶段     | 任务                 | 工作量 |
| -------- | -------------------- | ------ |
| 1        | 添加 playwright 依赖 | 0.5d   |
| 2        | 实现 BrowserManager  | 2d     |
| 3        | 实现 HTTP Server     | 1d     |
| 4        | 实现命令模块         | 2d     |
| 5        | 实现 Snapshot 系统   | 1d     |
| 6        | 创建 OpenAiCode 工具 | 0.5d   |
| 7        | 集成测试             | 1d     |
| **总计** |                      | **8d** |

## 9. 参考资料

- gstack browse 源码: `D:\AIcode\gstack-main\browse\src\`
- gstack BROWSER.md: 详细技术文档
- Playwright API: https://playwright.dev/
