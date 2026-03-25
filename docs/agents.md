# Agents 配置

## 概述

Agents 是可配置的 AI 助手，可以执行特定任务。

## Agent 目录结构

```
.opencode/
├── agent/
│   ├── triage.md      # 问题分类 Agent
│   ├── docs.md        # 文档生成 Agent
│   ├── translator.md  # 翻译 Agent
│   └── duplicate-pr.md # 重复 PR 检测 Agent
```

## Agent 定义

在 `.opencode/agent/` 目录中创建 `.md` 文件来定义 Agent：

```markdown
---
description: Agent 描述
model: provider/model-name
subtask: true
---

# Agent 指令

在这里编写 Agent 的具体指令...
```

## Agent 元数据

| 字段          | 说明           | 必填 |
| ------------- | -------------- | ---- |
| `description` | Agent 功能描述 | 是   |
| `model`       | 使用的模型     | 否   |
| `subtask`     | 是否允许子任务 | 否   |

## 示例

### GitHub Triage Agent

```markdown
---
description: 自动分类 GitHub issues
model: opencode/kimi-k2.5
subtask: true
---

分析 GitHub issues 并进行分类。

## 分类标签

- bug: 报告的 Bug
- enhancement: 功能增强
- documentation: 文档相关
- question: 问题咨询

## 执行步骤

1. 分析 issue 内容
2. 确定合适的标签
3. 添加适当的标签和评论
```

### Translator Agent

```markdown
---
description: 翻译文档和代码注释
model: opencode/gpt-4o
subtask: false
---

将文档翻译成目标语言。
```

## 相关资源

- [配置帮助](./config.md)
- [Commands 配置](./commands.md)
