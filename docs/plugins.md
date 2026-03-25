# OpenAiCode 插件开发指南

## 目录

- [概览](#概览)
- [快速开始](#快速开始)
- [插件结构](#插件结构)
- [工具定义](#工具定义)
- [生命周期钩子](#生命周期钩子)
- [完整示例](#完整示例)
- [测试](#测试)

---

## 概览

OpenAiCode 插件系统允许开发者扩展核心功能，包括：

- 自定义工具
- 认证集成
- 消息处理
- 模型提供

---

## 快速开始

### 1. 创建插件项目

```bash
mkdir my-opencode-plugin
cd my-opencode-plugin
bun init -y
npm install @opencode-ai/plugin
```

### 2. 创建入口文件

```typescript
// src/index.ts
import { definePlugin } from "@opencode-ai/plugin"

export default definePlugin({
  name: "my-plugin",
  tools: {
    myTool: {
      description: "A custom tool",
      args: {
        input: z.string(),
      },
      execute: async (args, context) => {
        return `Processed: ${args.input}`
      },
    },
  },
})
```

### 3. 配置 OpenAiCode

在 `opencode.json` 中添加插件：

```json
{
  "plugin": ["file://./src/index.ts"]
}
```

---

## 插件结构

```typescript
import { definePlugin, type Plugin, type Hooks } from "@opencode-ai/plugin"
import z from "zod"

const plugin: Plugin = {
  // 插件名称
  name: "my-plugin",

  // 自定义工具定义
  tool: {
    myTool: {
      description: "Tool description",
      args: {
        // Zod schema 定义参数
      },
      execute: async (args, ctx) => {
        return "result"
      },
    },
  },

  // 生命周期钩子
  hooks: {
    onInit: async (context) => {
      // 初始化时调用
    },
    onMessage: async (message, context) => {
      // 消息处理
    },
  },
}
```

---

## 工具定义

### 参数模式

```typescript
import z from "zod"

// 简单参数
args: {
  filename: z.string(),
}

// 复杂参数
args: {
  options: z.object({
    recursive: z.boolean(),
    depth: z.number().min(1).max(10),
  }),
},
```

### 执行上下文

```typescript
execute: async (args, context) => {
  // 访问项目信息
  const { project, directory, worktree, serverUrl } = context

  // 访问客户端
  const { session, messages, files } = context.client

  // 执行 Bash 命令
  await context.$`ls -la`

  // 写入文件
  await context.client.files.write({
    path: "/path/to/file",
    content: "file content",
  })

  return "result"
}
```

---

## 生命周期钩子

```typescript
hooks: {
  // 初始化钩子
  onInit: async (context) => {
    console.log("Plugin initialized")
  },

  // 消息处理钩子 - 在每条消息后调用
  onMessage: async (message, context) => {
    if (message.role === "user") {
      console.log("User said:", message.content)
    }
  },

  // 会话开始钩子
  onSessionStart: async (session, context) => {
    console.log("Session started:", session.id)
  },

  // 会话结束钩子
  onSessionEnd: async (session, context) => {
    console.log("Session ended:", session.id)
  },

  // 工具调用钩子
  onToolCall: async (tool, args, context) => {
    console.log("Tool called:", tool, args)
  },
}
```

---

## 完整示例

### 文件处理插件

```typescript
import { definePlugin } from "@opencode-ai/plugin"
import z from "zod"
import path from "path"
import fs from "fs/promises"

export default definePlugin({
  name: "file-utilities",
  tools: {
    // 复制文件工具
    copyFile: {
      description: "Copy a file to a new location",
      args: {
        source: z.string(),
        destination: z.string(),
      },
      execute: async (args, context) => {
        const src = path.resolve(context.worktree, args.source)
        const dst = path.resolve(context.worktree, args.destination)

        await fs.copyFile(src, dst)
        return `Copied ${args.source} to ${args.destination}`
      },
    },

    // 批量重命名工具
    batchRename: {
      description: "Rename multiple files using a pattern",
      args: {
        directory: z.string(),
        pattern: z.string(),
        replacement: z.string(),
      },
      execute: async (args, context) => {
        const dir = path.resolve(context.worktree, args.directory)
        const files = await fs.readdir(dir)

        const results = []
        for (const file of files) {
          if (args.pattern.test(file)) {
            const newName = file.replace(args.pattern, args.replacement)
            await fs.rename(path.join(dir, file), path.join(dir, newName))
            results.push(`${file} -> ${newName}`)
          }
        }

        return results.join("\n")
      },
    },
  },

  hooks: {
    onSessionEnd: async (session, context) => {
      // 清理临时文件
      const tempDir = path.join(context.worktree, ".opencode-temp")
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch {
        // ignore
      }
    },
  },
})
```

### 认证集成插件

```typescript
import { definePlugin } from "@opencode-ai/plugin"

export default definePlugin({
  name: "custom-auth",
  auth: {
    // 提供自定义认证逻辑
    validate: async (credentials, context) => {
      // 验证逻辑
      return { valid: true, user: { id: "user-id" } }
    },
  },
})
```

---

## 测试

### 本地测试插件

```bash
# 在包含插件的目录中运行 OpenAiCode
cd /path/to/your/project
opencode
```

### 单元测试

```typescript
import { describe, expect, test } from "bun:test"
import myPlugin from "./src/index"

describe("My Plugin", () => {
  test("tool executes correctly", async () => {
    const result = await myPlugin.tools.myTool.execute(
      { input: "test" },
      {
        directory: "/test",
        worktree: "/test",
        project: {} as any,
        serverUrl: new URL("http://localhost:4096"),
        $: {} as any,
      },
    )

    expect(result).toBe("Processed: test")
  })
})
```

---

## 调试

### 开启调试日志

```bash
OPENCODE_DEBUG=plugin opencode
```

### 常见问题

**插件不加载**

1. 检查 `opencode.json` 中的路径是否正确
2. 确认插件没有语法错误
3. 查看调试输出

**工具参数错误**

1. 确保 Zod schema 正确定义
2. 检查参数类型是否匹配

---

## 发布插件

### 1. 打包

```bash
npm publish
```

### 2. 安装

```json
{
  "plugin": ["my-plugin@1.0.0"]
}
```

---

## API 参考

### definePlugin

```typescript
function definePlugin(config: PluginConfig): Plugin
```

### PluginConfig

```typescript
interface PluginConfig {
  name: string
  version?: string
  tools?: Record<string, ToolDefinition>
  auth?: AuthConfig
  hooks?: Hooks
}
```

### ToolDefinition

```typescript
interface ToolDefinition {
  description: string
  args: Record<string, ZodType>
  execute: (args: any, context: ToolContext) => Promise<string>
}
```

### ToolContext

```typescript
interface ToolContext {
  directory: string
  worktree: string
  project: Project
  serverUrl: URL
  client: OpencodeClient
  $: BunProc
}
```
