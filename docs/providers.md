# Providers 配置

## 概述

Providers 是 AI 模型提供商，OpenAiCode 支持多种 AI 提供商。

## 支持的 Providers

| Provider          | SDK                         | 说明                 |
| ----------------- | --------------------------- | -------------------- |
| OpenAI            | @ai-sdk/openai              | GPT-4, GPT-4o, GPT-5 |
| Anthropic         | @ai-sdk/anthropic           | Claude 系列          |
| Google            | @ai-sdk/google              | Gemini 模型          |
| Azure OpenAI      | @ai-sdk/azure               | Azure 托管           |
| Amazon Bedrock    | @ai-sdk/amazon-bedrock      | AWS 托管模型         |
| GitHub Copilot    | @ai-sdk/github-copilot      | Copilot 聊天         |
| xAI               | @ai-sdk/xai                 | Grok 模型            |
| Mistral AI        | @ai-sdk/mistral             | Mistral 模型         |
| Cohere            | @ai-sdk/cohere              | Command 模型         |
| Groq              | @ai-sdk/groq                | 快速推理             |
| Perplexity        | @ai-sdk/perplexity          | 搜索增强             |
| Cerebras          | @ai-sdk/cerebras            | 高速芯片推理         |
| DeepInfra         | @ai-sdk/deepinfra           | 开源模型托管         |
| Together AI       | @ai-sdk/togetherai          | 开源模型托管         |
| OpenAI Compatible | @ai-sdk/openai-compatible   | Ollama, LM Studio 等 |
| OpenRouter        | @openrouter/ai-sdk-provider | 模型聚合             |

## 基本配置

```jsonc
{
  "provider": {
    "openai": {
      "name": "OpenAI",
      "options": {
        "apiKey": "sk-...",
      },
    },
  },
}
```

## Ollama 本地模型

```jsonc
{
  "provider": {
    "ollama": {
      "name": "Ollama 本地模型",
      "npm": "@ai-sdk/openai-compatible",
      "models": {
        "qwen3-coder:30b": {
          "name": "Qwen3 Coder 30B",
          "tool_call": true,
          "limit": { "context": 8192, "output": 2048 },
        },
        "deepseek-r1:32b": {
          "name": "DeepSeek R1 32B",
          "tool_call": true,
          "reasoning": true,
          "limit": { "context": 32000, "output": 8000 },
        },
      },
      "options": {
        "baseURL": "http://localhost:11434/v1",
      },
    },
  },
}
```

## Azure OpenAI

```jsonc
{
  "provider": {
    "azure-openai": {
      "name": "Azure OpenAI",
      "npm": "@ai-sdk/azure",
      "options": {
        "apiKey": "your-azure-key",
        "azureEndpoint": "https://your-resource.openai.azure.com/",
        "azureDeployment": "gpt-4o",
      },
    },
  },
}
```

## Amazon Bedrock

```jsonc
{
  "provider": {
    "bedrock": {
      "name": "Amazon Bedrock",
      "npm": "@ai-sdk/amazon-bedrock",
      "options": {
        "region": "us-east-1",
      },
    },
  },
}
```

## 自定义 Provider

```jsonc
{
  "provider": {
    "custom": {
      "name": "自定义模型",
      "npm": "@ai-sdk/openai-compatible",
      "models": {
        "my-model": {
          "name": "My Model",
          "tool_call": true,
        },
      },
      "options": {
        "baseURL": "https://api.custom.com/v1",
        "apiKey": "your-key",
      },
    },
  },
}
```

## 模型配置选项

| 选项            | 说明               |
| --------------- | ------------------ |
| `name`          | 模型显示名称       |
| `tool_call`     | 是否启用工具调用   |
| `reasoning`     | 是否启用推理模式   |
| `attachment`    | 是否支持文件上传   |
| `modalities`    | 支持的输入输出模式 |
| `limit.context` | 上下文窗口大小     |
| `limit.output`  | 输出最大 token 数  |

## Cloudflare AI Gateway

```jsonc
{
  "provider": {
    "cloudflare": {
      "name": "Cloudflare AI Gateway",
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://gateway.ai.cloudflare.com/v1/account/YOUR_ACCOUNT_ID/gateway/YOUR_GATEWAY_ID",
      },
    },
  },
}
```

需要环境变量：

- `CLOUDFLARE_GATEWAY_ID`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## 相关资源

- [配置帮助](./config.md)
- [Agents 配置](./agents.md)
