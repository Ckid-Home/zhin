# 🏛️ 官方资源

Zhin.js 官方维护的插件、适配器和工具集合。

## 📦 官方插件

由 Zhin.js 团队官方维护的高质量插件。

### [🧩 官方插件列表](./plugins.md)
查看所有官方插件的详细信息，包括功能介绍、使用方法和配置选项。

**核心插件**：
- `@zhin.js/http` - HTTP 服务器和 API 支持
- `@zhin.js/console` - Web 控制台管理界面
- `@zhin.js/database` - 数据库 ORM 支持
- `@zhin.js/logger` - 高级日志系统

**功能插件**：
- `@zhin.js/cron` - 定时任务调度
- `@zhin.js/cache` - 缓存管理
- `@zhin.js/auth` - 权限认证系统
- `@zhin.js/analytics` - 数据分析和统计

## 🔌 官方适配器

支持主流聊天平台的官方适配器。

### [🌐 官方适配器列表](./adapters.md)
查看所有官方适配器的详细信息，包括平台支持、功能特性和配置指南。

**即时通讯平台**：
- `@zhin.js/adapter-icqq` - QQ 机器人（基于 ICQQ）
- `@zhin.js/adapter-kook` - KOOK 机器人
- `@zhin.js/adapter-discord` - Discord 机器人
- `@zhin.js/adapter-telegram` - Telegram 机器人

**开放协议**：
- `@zhin.js/adapter-onebot11` - OneBot v11 协议
- `@zhin.js/adapter-process` - 控制台适配器（开发用）

**企业平台**：
- `@zhin.js/adapter-wechat-mp` - 微信公众号
- `@zhin.js/adapter-lark` - 飞书机器人

## 🛠️ 开发工具

官方提供的开发和部署工具。

### CLI 工具
- `@zhin.js/cli` - 命令行工具，提供项目管理和构建功能
- `create-zhin-app` - 项目脚手架，快速创建新项目

### 开发辅助
- `@zhin.js/types` - TypeScript 类型定义
- `@zhin.js/eslint-config` - ESLint 配置预设
- `@zhin.js/tsconfig` - TypeScript 配置预设

### 编辑器支持
- `zhin-vscode` - VS Code 扩展（语法高亮、调试支持）

## 📊 质量保证

所有官方资源都经过严格的质量控制：

### ✅ 质量标准
- **100% TypeScript** - 完整的类型支持
- **全面测试** - 单元测试覆盖率 > 90%
- **文档完善** - 详细的使用文档和示例
- **持续维护** - 定期更新和 Bug 修复

### 🔄 版本管理
- **语义化版本** - 遵循 SemVer 规范
- **向后兼容** - 主版本内保持 API 稳定
- **升级指南** - 提供详细的版本升级指导

### 🛡️ 安全保证
- **安全审计** - 定期安全漏洞扫描
- **依赖更新** - 及时更新第三方依赖
- **最佳实践** - 遵循安全编码规范

## 🌟 特色功能

### 🎨 Schema 配置系统
所有官方插件和适配器都支持 Schema 配置系统：
- 类型安全的配置定义
- Web 界面可视化编辑
- 实时配置验证和热重载

### ⚡ 热重载支持
官方资源完全支持热重载：
- 配置变更立即生效
- 插件无缝升级
- 状态保持不丢失

### 🌐 国际化支持
多语言支持：
- 中文（简体/繁体）
- English
- 日本語
- 한국어

## 📚 使用指南

### 安装官方包

```bash
# 安装官方插件
pnpm add @zhin.js/http @zhin.js/console

# 安装官方适配器
pnpm add @zhin.js/adapter-icqq

# 安装开发工具
pnpm add -D @zhin.js/cli
```

### 配置使用

```typescript
// zhin.config.ts
export default defineConfig({
  plugins: [
    '@zhin.js/http',
    '@zhin.js/console',
    // 其他官方插件...
  ],
  
  bots: [
    {
      name: 'qq-bot',
      context: '@zhin.js/adapter-icqq',
      // 适配器配置...
    }
  ]
});
```

## 🚀 版本发布

### 发布周期
- **主版本** - 每年 1-2 次，包含重大更新
- **次版本** - 每月 1-2 次，包含新功能
- **修订版本** - 每周 1-2 次，包含 Bug 修复

### 发布通知
- [GitHub Releases](https://github.com/zhinjs/zhin/releases) - 详细的更新日志
- [更新日志](https://github.com/zhinjs/zhin/blob/main/CHANGELOG.md) - 完整的变更记录

## 🤝 贡献指南

想要为官方资源做贡献？

### 贡献方式
- 🐛 [报告 Bug](https://github.com/zhinjs/zhin/issues/new?template=bug_report.md)
- 💡 [功能建议](https://github.com/zhinjs/zhin/issues/new?template=feature_request.md)
- 📝 [文档改进](https://github.com/zhinjs/zhin/pulls)
- 🔧 [代码贡献](https://github.com/zhinjs/zhin/pulls)

### 贡献要求
- 遵循代码规范
- 添加相应测试
- 更新相关文档
- 通过 CI 检查

## 📞 联系我们

- 🌐 [官方网站](https://zhin.dev)
- 📧 [邮件联系](mailto:contact@zhin.dev)
- 💬 [社区讨论](https://github.com/zhinjs/zhin/discussions)
- 🐛 [问题反馈](https://github.com/zhinjs/zhin/issues)

---

💫 **选择官方资源，享受最佳的 Zhin.js 开发体验！**