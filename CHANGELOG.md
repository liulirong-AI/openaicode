# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-30

### Added

#### Publish Skill (快手发布技能)

- `.opencode/skills/publish/` - 新增快手图文自动发布技能
- `cdp-client.ts` - Chrome DevTools Protocol WebSocket 客户端
- 支持通过 CDP 连接用户已登录的 Chrome 浏览器
- 图片上传自动化（支持 Chrome 108）
- 作品描述自动填写
- 发布按钮自动点击

#### Browse Skill 增强

- `.opencode/skills/browse/src/cdp-client.ts` - CDP 客户端复用
- `browser-manager.ts` - 浏览器管理增强
- `cli.ts` - 命令行界面改进

### Enhanced

- `packages/opencode/src/tool/browse.ts` - 浏览工具功能增强
- `packages/opencode/src/skill/service-manager.ts` - 服务管理改进
- `AGENTS.md` - 添加发布技能使用说明

### Fixed

- 构建配置优化
- TypeScript 类型支持改进

---

## [0.1.0] - 2025-01-01

### Added

- Initial fork from OpenCode
- Browse skill for headless browser automation
- gstack skills integration
- Local Ollama model support
