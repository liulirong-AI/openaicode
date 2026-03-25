# OpenAiCode API 参考文档

## 目录

- [核心命名空间](#核心命名空间)
- [Session](#session)
- [Agent](#agent)
- [Provider](#provider)
- [Tool](#tool)
- [Config](#config)
- [Database](#database)
- [Bus](#bus)

---

## 核心命名空间

### Instance

项目实例管理

```typescript
import { Instance } from "@opencode-ai/opencode"

await Instance.provide({
  directory: "/path/to/project",
  fn: async () => {
    console.log(Instance.directory)
    console.log(Instance.project)
  },
})
```

**属性**

| 属性        | 类型          | 描述              |
| ----------- | ------------- | ----------------- |
| `directory` | `string`      | 项目目录          |
| `worktree`  | `string`      | Git worktree 目录 |
| `project`   | `ProjectInfo` | 项目信息          |

---

## Session

会话管理

```typescript
import { Session } from "@opencode-ai/opencode"

// 创建会话
const session = await Session.create({})

// 获取会话
const info = await Session.get(sessionID)

// 列出所有会话
for (const s of Session.list()) {
  console.log(s.title)
}

// 更新标题
await Session.setTitle({ sessionID, title: "New Title" })

// 删除会话
await Session.remove(sessionID)
```

### 方法

| 方法       | 参数                                    | 返回           | 描述       |
| ---------- | --------------------------------------- | -------------- | ---------- |
| `create`   | `{parentID?, title?, permission?}`      | `Session.Info` | 创建新会话 |
| `get`      | `SessionID`                             | `Session.Info` | 获取会话   |
| `list`     | `{directory?, roots?, search?, limit?}` | `Generator`    | 列出会话   |
| `setTitle` | `{sessionID, title}`                    | `Session.Info` | 更新标题   |
| `remove`   | `SessionID`                             | `void`         | 删除会话   |
| `share`    | `SessionID`                             | `{url}`        | 分享会话   |
| `unshare`  | `SessionID`                             | `void`         | 取消分享   |
| `fork`     | `{sessionID, messageID?}`               | `Session.Info` | 派生会话   |

### 类型

```typescript
interface Session.Info {
  id: SessionID
  slug: string
  projectID: ProjectID
  workspaceID?: WorkspaceID
  directory: string
  parentID?: SessionID
  title: string
  version: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: FileDiff[]
  }
  share?: { url: string }
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
  permission?: Permission.Ruleset
}
```

---

## Agent

Agent 管理

```typescript
import { Agent } from "@opencode-ai/opencode"

// 获取 Agent 列表
const agents = await Agent.list()

// 运行 Agent
const result = await Agent.run({
  messages: [{ role: "user", content: "Hello" }],
})
```

### 配置

在 `opencode.json` 中配置:

```json
{
  "agent": {
    "build": {
      "model": "anthropic/claude-3",
      "steps": 100,
      "prompt": "You are a coding assistant..."
    },
    "plan": {
      "model": "anthropic/claude-3",
      "permission": {
        "edit": "deny"
      }
    }
  }
}
```

---

## Provider

AI 模型提供商

```typescript
import { Provider } from "@opencode-ai/opencode"

// 列出所有可用提供商
const providers = await Provider.list()

// 获取特定提供商
const anthropic = await Provider.get("anthropic")
```

### 内置提供商

- `anthropic` - Anthropic (Claude)
- `openai` - OpenAI (GPT-4)
- `google` - Google (Gemini)
- `ollama` - Ollama (本地模型)
- `azure` - Azure OpenAI
- `cohere` - Cohere
- `together` - Together AI

### 配置提供商

```json
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "sk-...",
        "baseURL": "https://api.anthropic.com",
        "timeout": 300000
      }
    }
  }
}
```

---

## Tool

工具注册与执行

```typescript
import { Tool } from "@opencode-ai/opencode"

// 工具元数据
interface Tool.Info {
  id: string
  init: (ctx?) => Promise<{
    description: string
    parameters: ZodType
    execute: (args, ctx) => Promise<{
      title: string
      metadata: object
      output: string
    }>
  }>
}
```

### 内置工具

| 工具        | 描述            | 参数                             |
| ----------- | --------------- | -------------------------------- |
| `read`      | 读取文件内容    | `filePath, offset?, limit?`      |
| `write`     | 写入文件内容    | `filePath, content`              |
| `edit`      | 编辑文件        | `filePath, oldString, newString` |
| `glob`      | 查找匹配文件    | `pattern, path?`                 |
| `grep`      | 搜索文件内容    | `pattern, path?, include?`       |
| `bash`      | 执行 Shell 命令 | `command, timeout?`              |
| `webfetch`  | 获取网页内容    | `url`                            |
| `websearch` | 搜索网络        | `query`                          |

---

## Config

配置管理

```typescript
import { Config } from "@opencode-ai/opencode"

// 获取当前配置
const config = await Config.get()

// 配置架构
const ConfigSchema = {
  $schema?: string
  logLevel?: "debug" | "info" | "warn" | "error"
  model?: string
  provider?: Record<string, ProviderConfig>
  agent?: Record<string, AgentConfig>
  mcp?: Record<string, McpConfig>
  permission?: PermissionConfig
  server?: ServerConfig
}
```

### 配置优先级 (低 → 高)

1. 远程 `.well-known/opencode` (组织默认)
2. 全局配置 `~/.config/opencode/opencode.json`
3. 自定义配置 `OPENCODE_CONFIG`
4. 项目配置 `opencode.json`
5. `.opencode/` 目录配置
6. 内联配置 `OPENCODE_CONFIG_CONTENT`
7. 托管配置 (企业版)

---

## Database

数据库操作

```typescript
import { Database } from "@opencode-ai/opencode"

// 在事务中执行
Database.use((db) => {
  db.insert(Table).values(data).run()
})

// 查询
const result = db.select().from(Table).where(...)
```

### 表结构

- `project` - 项目
- `session` - 会话
- `message` - 消息
- `part` - 消息部分
- `todo` - 待办事项

---

## Bus

事件系统

```typescript
import { Bus } from "@opencode-ai/opencode"

// 订阅事件
const unsub = Bus.subscribe(Session.Event.Updated, (event) => {
  console.log("Session updated:", event.properties.info)
})

// 发布事件
await Bus.publish(Session.Event.Created, { info })

// 取消订阅
unsub()
```

### 事件类型

- `session.created` - 会话创建
- `session.updated` - 会话更新
- `session.deleted` - 会话删除
- `session.error` - 会话错误
- `message.updated` - 消息更新

---

## 错误处理

### NotFoundError

```typescript
import { Database } from "@opencode-ai/opencode"

try {
  const session = await Session.get(id)
} catch (e) {
  if (e instanceof Database.NotFoundError) {
    console.log("Session not found:", e.data.message)
  }
}
```

### 自定义错误

```typescript
import { NamedError } from "@opencode-ai/util/error"

const MyError = NamedError.create(
  "MyError",
  z.object({
    code: z.string(),
  }),
)

throw new MyError({ code: "INVALID_INPUT" })
```

---

## 环境变量

| 变量                       | 描述               |
| -------------------------- | ------------------ |
| `OPENCODE_CONFIG`          | 配置文件路径       |
| `OPENCODE_CONFIG_CONTENT`  | 内联配置           |
| `ANTHROPIC_API_KEY`        | Anthropic API 密钥 |
| `OPENAI_API_KEY`           | OpenAI API 密钥    |
| `GOOGLE_GENERATIVE_AI_KEY` | Google AI 密钥     |
