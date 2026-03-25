# OpenAiCode CLI 命令参考

## 目录

- [基础命令](#基础命令)
- [会话命令](#会话命令)
- [开发命令](#开发命令)
- [服务器命令](#服务器命令)
- [插件命令](#插件命令)
- [账户命令](#账户命令)
- [调试命令](#调试命令)

---

## 基础命令

### help

显示帮助信息

```bash
opencode help [command]
```

### version

显示版本

```bash
opencode --version
```

### upgrade

升级 OpenAiCode

```bash
opencode upgrade
# 指定版本
opencode upgrade 1.2.27
# 检查更新但不安装
opencode upgrade --check
```

### uninstall

卸载 OpenAiCode

```bash
opencode uninstall
```

---

## 会话命令

### 会话管理

```bash
# 创建新会话
opencode

# 指定目录启动
opencode /path/to/project

# 附加到运行中的服务器
opencode attach http://localhost:4096

# 列出所有会话
opencode session list

# 列出根会话
opencode session roots

# 搜索会话
opencode session search "query"

# 导出会话
opencode export --session <id> --format markdown

# 导入会话
opencode import <file>
```

### 会话操作

```bash
# 重命名会话
opencode session rename "New Title"

# 删除会话
opencode session delete

# 分享会话
opencode session share

# 取消分享
opencode session unshare

# 派生会话
opencode session fork

# 归档会话
opencode session archive

# 压缩会话
opencode session compact
```

---

## 开发命令

### run

运行开发服务器

```bash
# 默认端口
opencode serve

# 指定端口
opencode serve --port 8080

# 允许远程连接
opencode serve --hostname 0.0.0.0

# 启用 mDNS
opencode serve --mdns
```

### web

启动 Web 界面

```bash
opencode web
# 指定端口
opencode web --port 3000
```

### tui

启动 TUI

```bash
opencode tui

# 附加到运行中的服务器
opencode tui attach http://localhost:4096
```

### spawn

分离模式启动

```bash
opencode spawn
```

---

## 服务器命令

### serve

启动 API 服务器

```bash
# 基本用法
opencode serve

# 指定端口
opencode serve --port 4096

# 指定主机
opencode serve --hostname localhost

# 启用 mDNS 发现
opencode serve --mdns

# 自定义 mDNS 域
opencode serve --mdns-domain myhost.local

# 启用 CORS
opencode serve --cors "https://example.com"

# 设置密码
opencode serve --password secret
```

### stats

显示统计信息

```bash
opencode stats
```

---

## 插件命令

### mcp

MCP 服务器管理

```bash
# 列出可用 MCP 服务器
opencode mcp list

# 添加本地 MCP 服务器
opencode mcp add local --command "npx" --args "server-name"

# 添加远程 MCP 服务器
opencode mcp add remote --url https://mcp.example.com

# 配置 OAuth
opencode mcp oauth --server <name> --client-id <id>

# 启用/禁用服务器
opencode mcp enable <name>
opencode mcp disable <name>

# 删除服务器
opencode mcp remove <name>
```

---

## 账户命令

### account

账户管理

```bash
# 登录
opencode account login

# 登出
opencode account logout

# 显示当前账户
opencode account whoami

# 管理组织
opencode account org list
opencode account org switch <org-id>
```

---

## 调试命令

### debug

调试工具

```bash
# 调试配置
opencode debug config

# 调试 Agent
opencode debug agent

# 调试文件
opencode debug file <path>

# 调试 snapshot
opencode debug snapshot

# 调试 LSP
opencode debug lsp

# 调试 skill
opencode debug skill
```

### db

数据库操作

```bash
# 生成迁移
opencode db generate --name <name>

# 应用迁移
opencode db migrate

# 重置数据库
opencode db reset

# 查看数据库状态
opencode db status
```

---

## GitHub 集成命令

### github

```bash
# 登录
opencode github login

# 创建 PR
opencode github pr create

# 列 PR
opencode github pr list

# 查看 PR
opencode github pr view <pr-number>

# 审查 PR
opencode github pr review <pr-number>
```

### pr

PR 操作

```bash
# 创建 PR
opencode pr create

# 列出 PR
opencode pr list

# 查看 PR
opencode pr view <number>
```

### import

导入 GitHub 问题

```bash
opencode import issue <owner>/<repo> <issue-number>
```

---

## 模型命令

### models

模型管理

```bash
# 列出可用模型
opencode models list

# 显示当前模型
opencode models current

# 设置默认模型
opencode models default <provider>/<model>
```

### providers

提供商管理

```bash
# 列出提供商
opencode providers list

# 显示提供商详情
opencode providers show <provider>
```

---

## 选项

### 全局选项

| 选项        | 描述     |
| ----------- | -------- |
| `--help`    | 显示帮助 |
| `--version` | 显示版本 |
| `--debug`   | 启用调试 |

### 环境变量

| 变量                      | 描述         |
| ------------------------- | ------------ |
| `OPENCODE_CONFIG`         | 配置文件路径 |
| `OPENCODE_CONFIG_CONTENT` | 内联配置     |
| `OPENCODE_DEBUG`          | 调试模式     |
