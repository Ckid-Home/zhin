# @zhin.js/cli

Zhin 机器人框架的全功能命令行工具，提供项目创建、开发调试、插件构建、进程管理等完整开发流程支持。

## 核心功能

- 🧩 **插件开发**: 快速创建插件包，自动配置依赖
- 🔥 **开发模式**: 热重载开发服务器，实时代码更新
- 📦 **插件构建**: 构建独立插件包（app + client）
- 🛠️ **进程管理**: 生产环境启动、停止、重启、后台运行
- ⚙️ **多运行时**: 支持 Node.js 和 Bun 运行时

> **注意**: 项目初始化功能已移至 `create-zhin-app`，请使用 `npm create zhin-app` 创建新项目。

## 命令详解

### new - 创建插件

创建新的插件包，自动添加到项目依赖：

```bash
zhin new [plugin-name] [options]
```

**选项：**
- `--skip-install`: 跳过依赖安装

**生成的插件结构：**
```
plugins/my-plugin/
├── app/                    # 插件逻辑代码
│   └── index.ts           # 插件入口
├── client/                 # 客户端页面
│   ├── index.tsx          # 页面入口
│   └── pages/             # React 组件
│       └── index.tsx
├── lib/                    # app 构建输出
├── dist/                   # client 构建输出
├── package.json           # 插件配置
├── tsconfig.json          # TypeScript 根配置
├── tsconfig.app.json      # app 构建配置
├── tsconfig.client.json   # client 构建配置
├── README.md              # 插件文档
└── CHANGELOG.md           # 变更日志
```

**自动配置：**
- ✅ 创建完整的 npm 包结构
- ✅ 配置 TypeScript 编译
- ✅ 自动添加到根 `package.json` 依赖（`workspace:*`）
- ✅ 自动安装依赖
- ✅ 生成示例代码（命令、页面）

**使用示例：**
```bash
# 交互式创建
zhin new

# 直接指定名称
zhin new my-awesome-plugin

# 跳过依赖安装
zhin new my-plugin --skip-install
```

### dev - 开发模式

启动开发服务器，支持热重载和实时调试：

```bash
zhin dev [options]
```

**特性：**
- 🔥 **热模块替换 (HMR)**: 代码修改即时生效
- 🔍 **实时监控**: 自动检测文件变化
- 🛠️ **调试友好**: 详细错误信息和堆栈跟踪
- 📊 **性能监控**: 实时性能统计

**选项：**
- `-p, --port [port]`: HTTP 服务端口，默认 8086
- `--verbose`: 显示详细日志输出
- `--bun`: 使用 bun 运行时（默认使用 tsx）

**环境变量：**
```bash
NODE_ENV=development
ZHIN_DEV_MODE=true
HTTP_PORT=8086
ZHIN_VERBOSE=false
```

### start - 生产启动

生产环境启动机器人，支持前台和后台运行：

```bash
zhin start [options]
```

**特性：**
- 🚀 **高性能**: 基于编译后的 JavaScript 运行
- 🔄 **自动重启**: 支持配置热更新重启 (exit code 51)
- 📝 **日志管理**: 支持日志文件输出
- 🛡️ **进程管理**: 完善的进程生命周期管理

**选项：**
- `-d, --daemon`: 后台运行模式
- `--log-file [file]`: 指定日志文件路径
- `--bun`: 使用 bun 运行时（默认使用 node）

**使用示例：**
```bash
# 前台运行
zhin start

# 后台运行
zhin start --daemon

# 后台运行并记录日志
zhin start --daemon --log-file ./logs/bot.log

# 使用 bun 运行时
zhin start --bun
```

### restart - 重启服务

重启生产模式下运行的机器人：

```bash
zhin restart
```

**功能：**
- 🔄 检测运行中的进程
- 📋 读取 PID 文件
- ⚡ 发送重启信号
- 🛠️ 自动故障处理

### stop - 停止服务

停止运行中的机器人进程：

```bash  
zhin stop
```

**功能：**
- 🛑 优雅停止进程
- 🔍 自动检测运行状态
- 🧹 清理 PID 文件
- 📝 详细停止日志

### build - 构建插件

构建 `plugins/` 目录下的插件包：

```bash
zhin build [plugin] [options]
```

**参数：**
- `[plugin]`: 可选，指定要构建的插件名称（不指定则构建所有插件）

**选项：**
- `--clean`: 构建前清理输出目录（`lib/` 和 `dist/`）

**功能：**
- 📦 构建插件的 app 代码（TypeScript → lib/）
- � 构建插件的 client 页面（TypeScript → dist/）
- �🎯 完整的类型检查
- 🗂️ 自动组织输出文件
- ⚡ 并行构建优化

**使用示例：**
```bash
# 构建所有插件
zhin build

# 只构建特定插件
zhin build my-plugin

# 清理后构建
zhin build --clean

# 清理后构建特定插件
zhin build my-plugin --clean
```

**注意：**
- ❌ 不用于构建主应用（app 本身不需要构建）
- ✅ 只构建 `plugins/` 目录下的独立插件包
- ✅ 每个插件使用自己的 `package.json` 中的 `build` 脚本

## 完整工作流程

### 1. 创建新项目

```bash
# 使用 create-zhin-app（推荐）
npm create zhin-app my-awesome-bot
# 或
pnpm create zhin-app my-awesome-bot

cd my-awesome-bot
```

### 2. 开发阶段

```bash
# 开发模式启动（支持热重载）
pnpm dev
# 或
zhin dev

# 详细日志模式
zhin dev --verbose

# 自定义端口
zhin dev --port 8080
```

### 3. 创建插件

```bash
# 创建新插件
zhin new my-awesome-plugin

# 插件会自动添加到 package.json 依赖
# 在配置文件中启用插件
# 编辑 zhin.config.ts，添加到 plugins 数组：
# plugins: ['adapter-process', 'http', 'console', 'my-awesome-plugin']
```

### 4. 构建插件

```bash
# 构建所有插件
pnpm build
# 或
zhin build

# 只构建特定插件
zhin build my-awesome-plugin

# 清理后构建
zhin build --clean
```

### 5. 生产部署

```bash
# 确保插件已构建
pnpm build

# 前台测试
pnpm start
# 或
zhin start

# 后台部署
pnpm daemon
# 或
zhin start --daemon --log-file ./logs/production.log
```

### 6. 运维管理

```bash
# 重启服务
zhin restart

# 停止服务  
pnpm stop
# 或
zhin stop

# 重新构建插件并重启
pnpm build && zhin restart
```

## 高级配置

### 多环境配置

```javascript
// zhin.config.ts
import { defineConfig } from 'zhin.js';

export default defineConfig(async (env) => {
  const isProduction = env.NODE_ENV === 'production';
  
  return {
    bots: [
      {
        context: 'process',
        name: `${process.pid}`,
      }
    ],
    plugin_dirs: [
      './src/plugins',
      ...(isProduction ? [] : ['./dev-plugins'])
    ],
    plugins: [
      'adapter-process',
      'http',
      'console',
      'test-plugin'
    ],
    debug: !isProduction
  };
});
```

### 环境变量文件

支持自动加载环境变量文件：
- `.env` - 通用环境变量
- `.env.development` - 开发环境专用
- `.env.production` - 生产环境专用

### 进程管理

**自动重启机制：**
```typescript
// 在插件中触发重启
process.exit(51); // 特殊退出码，会触发自动重启
```

**PID 文件管理：**
- 开发模式：`.zhin-dev.pid`
- 生产模式：`.zhin.pid`

## 故障排查

### 常见问题

1. **tsx/bun 未安装**
   ```bash
   # 安装 tsx (Node.js 运行时)
   npm install -D tsx
   
   # 安装 bun
   curl -fsSL https://bun.sh/install | bash
   ```

2. **端口占用**
   ```bash
   # 检查端口占用
   lsof -i :8086
   
   # 使用不同端口
   zhin dev --port 8087
   ```

3. **权限问题**
   ```bash
   # 确保项目目录权限
   chmod -R 755 ./my-bot
   ```

## 依赖项

### 核心依赖
- `commander` - 命令行参数解析
- `inquirer` - 交互式命令行界面  
- `fs-extra` - 增强文件系统操作
- `chalk` - 彩色终端输出
- `ora` - 优雅的加载指示器
- `cross-spawn` - 跨平台进程管理
- `dotenv` - 环境变量管理

### 开发依赖  
- `typescript` - TypeScript 编译器
- `@types/*` - TypeScript 类型定义

## 许可证

MIT License