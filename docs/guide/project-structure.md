# 📁 项目结构

了解 Zhin.js 项目的标准结构和组织方式。

## 🏗️ 标准项目结构

```
my-zhin-bot/
├── src/                    # 📝 源代码目录
│   ├── index.ts           # 🎯 主入口文件
│   └── plugins/           # 🧩 插件目录
│       ├── basic.ts       # 基础功能插件
│       ├── admin.ts       # 管理功能插件
│       └── fun.ts         # 娱乐功能插件
├── lib/                   # 📦 构建输出目录
├── data/                  # 💾 数据存储目录
│   ├── config/           # 配置文件
│   ├── storage/          # 持久化数据
│   └── logs/             # 日志文件
├── zhin.config.ts        # ⚙️ 机器人配置文件
├── package.json          # 📋 项目依赖配置
├── tsconfig.json         # 🎯 TypeScript 配置
├── .env.example          # 🔐 环境变量示例
├── .gitignore           # 🚫 Git 忽略规则
└── README.md            # 📖 项目说明文档
```

## 📂 目录详解

### `src/` - 源代码目录
- **`index.ts`** - 应用入口，包含启动逻辑
- **`plugins/`** - 插件目录，每个 `.ts` 文件都是一个插件

### `data/` - 数据目录
- **`config/`** - 运行时配置文件
- **`storage/`** - 持久化数据存储
- **`logs/`** - 日志文件存储

### `lib/` - 构建输出
- 编译后的 JavaScript 文件
- 生产环境使用的代码

## 🎯 配置文件说明

### `zhin.config.ts` - 核心配置
```typescript
import { defineConfig } from 'zhin.js'

export default defineConfig(async (env) => {
  return {
    bots: [
      {
        name: 'my-bot',
        context: 'process'
      }
    ],
    plugin_dirs: ['./src/plugins', 'node_modules'],
    plugins: ['adapter-process', 'http', 'console'],
    debug: env.DEBUG === 'true'
  }
})
```

### `package.json` - 依赖管理
```json
{
  "name": "my-zhin-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "zhin dev",
    "build": "zhin build",
    "start": "zhin start"
  },
  "dependencies": {
    "zhin.js": "workspace:*"
  }
}
```

## 🧩 插件组织

### 按功能分类
```
src/plugins/
├── basic.ts      # 基础命令和功能
├── admin.ts      # 管理功能
├── fun.ts        # 娱乐功能
├── utils.ts      # 工具函数
└── api.ts        # API 相关
```

### 按模块分类
```
src/plugins/
├── commands/     # 命令插件
├── services/     # 服务插件
├── middleware/   # 中间件插件
└── adapters/     # 适配器插件
```

## 📝 最佳实践

1. **保持结构清晰** - 按功能或模块组织文件
2. **命名规范** - 使用描述性的文件名
3. **配置分离** - 将配置放在专门的目录
4. **文档完整** - 为每个目录添加说明

## 🔗 相关链接

- [快速开始](./quick-start.md)
- [配置说明](./configuration.md)
- [基本概念](./concepts.md)
