# Commands 配置

## 概述

Commands 是可以由 AI 助手调用的可执行命令。

## Command 目录结构

```
.opencode/
├── command/
│   ├── commit.md     # Git Commit 命令
│   ├── learn.md      # 学习命令
│   ├── issues.md     # Issues 管理
│   ├── ai-deps.md   # AI 依赖管理
│   ├── spellcheck.md # 拼写检查
│   └── rmslop.md    # 代码清理
```

## Command 定义

在 `.opencode/command/` 目录中创建 `.md` 文件来定义 Command：

```markdown
---
description: 命令描述
model: provider/model-name
subtask: true
---

# Command 指令

在这里编写命令的具体指令...
```

## Command 元数据

| 字段          | 说明             | 必填 |
| ------------- | ---------------- | ---- |
| `description` | Command 功能描述 | 是   |
| `model`       | 使用的模型       | 否   |
| `subtask`     | 是否允许子任务   | 否   |

## 示例

### Commit Command

```markdown
---
description: Git commit and push
model: opencode/kimi-k2.5
subtask: true
---

commit and push

确保包含以下前缀之一：

- docs: 文档更新
- tui: TUI 相关
- core: 核心功能
- ci: CI/CD
- ignore: 忽略文件
- wip: 进行中的工作

## GIT DIFF

!`git diff`

## GIT STATUS

!`git status --short`
```

### Learn Command

```markdown
---
description: Learn from code example
model: opencode/gpt-4o
subtask: false
---

从提供的代码示例中学习并记住特定的代码模式。
```

### Issues Command

```markdown
---
description: GitHub Issues 管理
model: opencode/kimi-k2.5
subtask: true
---

管理 GitHub Issues。
```

## 可用变量

在 Command 中可以使用以下变量：

- `!` 执行 Shell 命令
- `$FILE` 当前文件内容
- `$SELECTION` 选中的代码
- `$PROJECT` 项目信息

## 相关资源

- [配置帮助](./config.md)
- [Agents 配置](./agents.md)
