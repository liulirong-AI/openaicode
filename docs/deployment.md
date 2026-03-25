# OpenAiCode 部署指南

## 目录

- [本地开发部署](#本地开发部署)
- [生产环境部署](#生产环境部署)
- [桌面应用构建](#桌面应用构建)
- [控制台部署](#控制台部署)
- [Docker 部署](#docker-部署)

---

## 本地开发部署

### 前置要求

- Bun 1.3+
- Node.js 18+ (用于 Tauri)
- Rust toolchain (用于 Tauri)

### 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器 (默认端口 4096)
bun dev

# 为不同目录运行
bun dev <directory-path>

# 启动 API 服务器
bun dev serve

# 启动 Web 界面
bun dev web
```

### 开发端口配置

- **API 服务器**: 默认 `4096`，可通过 `--port` 参数修改
- **Web 开发服务器**: 默认 `5173`
- **桌面应用**: 默认 `1420`

---

## 生产环境部署

### CLI 部署

#### 从源码构建

```bash
# 构建单一平台 (当前系统)
cd packages/opencode
bun run script/build.ts --single

# 构建所有平台
bun run script/build.ts
```

构建产物位于 `packages/opencode/dist/` 目录。

#### 安装

```bash
# Linux/macOS
curl -fsSL https://opencode.ai/install | bash

# Windows (Scoop)
scoop install opencode

# Windows (Chocolatey)
choco install opencode

# npm/bun/pnpm/yarn
npm i -g opencode-ai
```

### 服务模式部署

```bash
# 启动 API 服务器
opencode serve --port 4096 --hostname 0.0.0.0

# 启用 mDNS 发现
opencode serve --mdns

# 自定义域名
opencode serve --mdns-domain custom.local
```

---

## 桌面应用构建

### Tauri 构建

```bash
# 开发模式
cd packages/desktop
bun run tauri dev

# 生产构建
bun run tauri build
```

### 构建产物

| 平台    | 格式                        |
| ------- | --------------------------- |
| macOS   | `.dmg`, `.app`              |
| Windows | `.exe`, `.msi`              |
| Linux   | `.deb`, `.rpm`, `.AppImage` |

---

## 控制台部署

控制台是 SaaS 版本的后端服务，使用 Cloudflare Workers + SST 部署。

### 前置要求

- Cloudflare 账户
- SST CLI (`npm i -g sst`)

### 部署步骤

```bash
# 开发环境
cd packages/console/core
npm run db-dev
npm run shell-dev

# 生产环境
cd packages/console/core
npm run db-prod
npm run shell-prod
```

### 数据库

- **开发**: PlanetScale (MySQL)
- **生产**: 单独配置的 MySQL 实例

---

## Docker 部署

### Dockerfile 示例

```dockerfile
FROM oven/bun:1.3

WORKDIR /app

# 复制构建产物
COPY dist/opencode-linux-x64/bin/opencode /usr/local/bin/opencode

# 创建非 root 用户
RUN useradd -m -u 1000 opencode && \
    chown -R opencode:opencode /app
USER opencode

# 默认启动命令
ENTRYPOINT ["opencode"]
CMD ["serve", "--port", "4096"]
```

### 构建运行

```bash
docker build -t opencode .
docker run -d -p 4096:4096 opencode
```

---

## 环境变量

| 变量                          | 说明               | 默认值  |
| ----------------------------- | ------------------ | ------- |
| `OPENCODE_CONFIG`             | 配置文件路径       | -       |
| `OPENCODE_CONFIG_CONTENT`     | 内联配置内容       | -       |
| `OPENCODE_PERMISSION`         | 权限配置 JSON      | -       |
| `OPENCODE_DISABLE_AUTOUPDATE` | 禁用自动更新       | `false` |
| `ANTHROPIC_API_KEY`           | Anthropic API 密钥 | -       |
| `OPENAI_API_KEY`              | OpenAI API 密钥    | -       |

---

## 故障排除

### 端口占用

```bash
# 查看端口占用
lsof -i :4096

# 终止进程
kill <PID>
```

### 数据库问题

```bash
# 删除数据库文件 (开发环境)
rm ~/.local/share/opencode/opencode.db
```

### 权限问题

```bash
# Linux: 赋予执行权限
chmod +x /usr/local/bin/opencode
```

---

## 版本信息

- 当前版本: 查看 `packages/opencode/package.json`
- 发布周期: 语义化版本
- 支持平台: Linux (x64, arm64), macOS (x64, arm64), Windows (x64, arm64)
