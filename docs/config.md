# OpenAiCode 配置指南

## 配置优先级顺序

配置加载顺序（从低到高）：

1. **远程配置** - `.well-known/opencode` (组织默认配置)
2. **全局配置** - `~/.config/opencode/opencode.jsonc`
3. **自定义配置** - `OPENCODE_CONFIG` 环境变量
4. **项目配置** - `opencode.jsonc`
5. **本地配置** - `.opencode/` 目录
6. **内联配置** - `OPENCODE_CONFIG_CONTENT` 环境变量
7. **托管配置** - 企业版管理配置（最高优先级）

## 基本配置结构

```jsonc
{
  // AI 模型提供商配置
  "provider": {
    "provider_name": {
      "name": "显示名称",
      "npm": "@ai-sdk/openai-compatible",
      "models": {
        "model_name": {
          "name": "模型名称",
          "tool_call": true,
          "reasoning": true,
          "attachment": true,
          "limit": { "context": 8192, "output": 2048 },
          "modalities": { "input": ["text"], "output": ["text"] },
        },
      },
      "options": {
        "baseURL": "https://api.example.com/v1",
        "apiKey": "your-api-key",
      },
    },
  },

  // Agent 配置
  "agent": {},

  // 权限配置
  "permission": {},

  // 工具配置
  "tools": {},

  // MCP 服务器配置
  "mcp": {},
}
```

## 环境变量

| 变量                               | 说明               |
| ---------------------------------- | ------------------ |
| `OPENCODE_CONFIG`                  | 自定义配置文件路径 |
| `OPENCODE_CONFIG_CONTENT`          | 内联配置内容       |
| `OPENCODE_TEST_MANAGED_CONFIG_DIR` | 测试用托管配置目录 |

## 详见

- [Agents 配置](./agents.md)
- [Commands 配置](./commands.md)
- [Providers 配置](./providers.md)
- [Themes 配置](./themes.md)
