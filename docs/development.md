# OpenAiCode 代码贡献指南

## 目录

- [开发环境](#开发环境)
- [代码风格](#代码风格)
- [测试](#测试)
- [提交规范](#提交规范)
- [审核流程](#审核流程)

---

## 开发环境

### 前置要求

- Bun 1.3+
- Node.js 18+ (用于 Tauri 构建)
- Rust (用于 Tauri 构建)

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/anomalyco/opencode.git
cd opencode

# 安装依赖
bun install

# 启动开发
bun dev

# 运行测试
bun test

# 类型检查
cd packages/opencode && bun typecheck
```

### 目录结构

```
packages/
├── opencode/      # 核心 CLI 和 Agent
├── app/          # Web UI
├── desktop/      # 桌面应用
├── console/      # SaaS 控制台
├── plugin/       # 插件 SDK
└── util/         # 工具函数
```

---

## 代码风格

### 命名规范

- **文件**: kebab-case
- **类/类型**: PascalCase
- **函数/变量**: camelCase
- **数据库**: snake_case

### 函数设计

- 保持函数短小，单一职责
- 使用命名空间组织相关函数
- 避免不必要的解构

```typescript
// ✅ 推荐
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// ❌ 避免
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### 错误处理

- 优先使用 `.catch()` 而非 try/catch
- 统一使用 Effect 库的 typed errors

```typescript
// ✅ 推荐
await someAsyncFunction().catch((err) => {
  log.error(err)
})

// ❌ 避免
try {
  await someAsyncFunction()
} catch (e) {
  log.error(e)
}
```

### 类型安全

- 避免 `any` 类型
- 使用 Zod 进行运行时验证
- 使用 branded types 防止 ID 混淆

```typescript
// ✅ 推荐
const sessionID = z.string().brand<"SessionID">()
type SessionID = z.infer<typeof sessionID>

// ❌ 避免
const sessionID: string
```

---

## 测试

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定包
cd packages/opencode && bun test

# 运行特定测试文件
bun test test/session/session.test.ts
```

### 测试结构

```
test/
├── unit/          # 单元测试
├── integration/   # 集成测试
├── e2e/          # 端到端测试
└── fixture/      # 测试工具
```

### 编写测试

```typescript
import { describe, expect, test } from "bun:test"
import { tmpdir } from "./fixture/fixture"
import { Instance } from "../src/project/instance"

test("example", async () => {
  await using tmp = await tmpdir()

  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      expect(true).toBe(true)
    },
  })
})
```

---

## 提交规范

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `refactor`: 重构
- `test`: 测试
- `chore`: 维护

### 示例

```
feat(session): add fork session capability

Add ability to fork sessions from existing sessions.
Closes #123
```

---

## 审核流程

### PR 要求

1. **关联 Issue**: 所有 PR 必须关联 Issue
2. **保持小而专注**: 尽量保持 PR 小
3. **包含测试**: 新功能需包含测试
4. **通过检查**: 通过类型检查和 lint

### 检查清单

- [ ] 关联 Issue
- [ ] 类型检查通过 `bun typecheck`
- [ ] 测试通过 `bun test`
- [ ] 代码格式化 `bun fmt`
- [ ] 更新文档 (如有需要)

---

## 常见任务

### 添加新工具

1. 在 `src/tool/` 创建新工具文件
2. 在 `src/tool/registry.ts` 注册
3. 添加单元测试
4. 更新文档

### 添加新 Provider

1. 在 `models.dev` 添加模型定义
2. 在 `src/provider/` 添加 SDK 适配 (如需要)

### 添加数据库迁移

```bash
cd packages/opencode
bun run db generate --name <migration-name>
```

---

## 故障排除

### 测试失败

```bash
# 清理缓存
rm -rf node_modules/.cache

# 运行单个测试
bun test --watch test/file.test.ts
```

### 类型错误

```bash
# 检查类型
cd packages/opencode && bun typecheck
```

### 性能问题

```bash
# 查看性能分析
OPENCODE_PROFILE=1 bun dev
```
