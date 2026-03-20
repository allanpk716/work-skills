# Phase 14: Installer Foundation - Research

**Researched:** 2026-03-20
**Domain:** Node.js CLI Tool Development (npm/npx executable packages)
**Confidence:** HIGH

## Summary

本阶段研究如何创建一个独立的 npm 安装器包,使用户可以通过 `npx @allanpk716/work-skills-setup` 命令运行安装器。研究涵盖了 npm 包的 bin 字段配置、CLI 框架选择 (Commander.js vs Yargs)、欢迎界面实现 (chalk/boxen/figlet)、平台检测以及命令行选项实现。

**Primary recommendation:** 使用 Commander.js 作为 CLI 框架,配合 chalk 和 boxen 实现欢迎界面,通过 process.platform 检测 Windows 系统。保持依赖精简以确保 npx 快速执行。

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | 用户可以通过 `npx @allanpk716/work-skills-setup` 运行独立安装器 | package.json bin 字段配置 + shebang |
| INST-02 | 安装器检测运行环境是否为 Windows 系统 | process.platform === 'win32' |
| INST-03 | 安装器提供中英文双语支持 | i18next 或简单的语言检测 + 翻译对象 |
| INST-04 | 安装器显示欢迎信息和功能介绍 | chalk + boxen + figlet |
| INST-05 | 安装器提供 --help 和 --version 命令行选项 | Commander.js 内置支持 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | 14.0.3 | CLI 参数解析和命令管理 | 行业标准,轻量级,API 简洁 |
| chalk | 5.6.2 | 终端文本着色 | 最流行的终端着色库,支持 256 色 |
| boxen | 8.0.1 | 终端边框盒子 | 创建美观的欢迎框 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| figlet | 1.11.0 | ASCII 艺术文本 | 创建大标题 banner |
| update-notifier | 7.3.1 | 版本更新通知 | 生产环境发布后 |
| ora | 9.3.0 | 加载动画 | 异步操作时显示进度 |
| i18next | 25.8.20 | 国际化支持 | 需要完整 i18n 功能时 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| commander | yargs (18.0.0) | yargs 功能更丰富但 API 更复杂,commander 更简洁 |
| figlet | 纯文本标题 | figlet 更醒目但增加包大小,纯文本更轻量 |
| i18next | 简单翻译对象 | i18next 功能完整但较重,简单对象足够用于双语 |

**Installation:**
```bash
npm install commander chalk boxen
# 可选
npm install figlet ora i18next
```

**Version verification (2026-03-20):**
- commander: 14.0.3
- chalk: 5.6.2
- boxen: 8.0.1
- figlet: 1.11.0
- yargs: 18.0.0
- i18next: 25.8.20

## Architecture Patterns

### Recommended Project Structure
```
installer/
├── package.json           # 包配置,包含 bin 字段
├── bin/
│   └── setup.js          # 入口文件,带 shebang
├── src/
│   ├── index.js          # 主逻辑入口
│   ├── cli.js            # CLI 命令定义
│   ├── welcome.js        # 欢迎界面
│   ├── platform.js       # 平台检测
│   └── i18n/
│       ├── index.js      # i18n 入口
│       ├── en.json       # 英文翻译
│       └── zh.json       # 中文翻译
├── README.md
└── LICENSE
```

### Pattern 1: package.json bin 字段配置
**What:** 配置 npm 包的可执行命令
**When to use:** 任何需要 npx 执行的 CLI 工具
**Example:**
```json
{
  "name": "@allanpk716/work-skills-setup",
  "version": "1.0.0",
  "bin": {
    "work-skills-setup": "./bin/setup.js"
  },
  "files": [
    "bin",
    "src"
  ],
  "engines": {
    "node": ">=16.0.0"
  }
}
```
**Source:** [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)

### Pattern 2: 入口文件 Shebang
**What:** 在入口文件顶部添加 Node.js 解释器声明
**When to use:** 所有 CLI 入口文件
**Example:**
```javascript
#!/usr/bin/env node

const { program } = require('commander');
// ... rest of the code
```
**Important:** Windows 不识别 shebang,但 npm 会处理 bin 字段中的文件

### Pattern 3: Commander.js CLI 定义
**What:** 使用 Commander.js 定义命令和选项
**When to use:** 所有需要解析命令行参数的 CLI
**Example:**
```javascript
const { program } = require('commander');
const packageJson = require('../package.json');

program
  .name('work-skills-setup')
  .description('Work Skills installation wizard for Windows developers')
  .version(packageJson.version, '-v, --version', 'Show version number')
  .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
  .option('--no-color', 'Disable colored output');

program.parse(process.argv);
```
**Source:** [Commander.js GitHub](https://github.com/tj/commander.js)

### Pattern 4: 平台检测
**What:** 检测当前操作系统是否为 Windows
**When to use:** 需要限制或适配特定平台的 CLI
**Example:**
```javascript
const isWindows = process.platform === 'win32';

if (!isWindows) {
  console.error('Error: This installer is designed for Windows only.');
  console.error('Current platform: ' + process.platform);
  process.exit(1);
}
```
**Source:** [Node.js process.platform](https://nodejs.org/api/process.html)

### Pattern 5: 欢迎界面实现
**What:** 使用 chalk 和 boxen 创建美观的欢迎界面
**When to use:** CLI 工具启动时显示品牌信息
**Example:**
```javascript
const chalk = require('chalk');
const boxen = require('boxen');

function showWelcome() {
  const title = chalk.bold.cyan('Work Skills Setup');
  const subtitle = chalk.gray('Claude Code skills for Windows developers');
  const version = chalk.green(`v${require('../package.json').version}`);

  const content = `${title}
${subtitle}

${chalk.white('Features:')}
  ${chalk.yellow('*')} Auto-configure environment
  ${chalk.yellow('*')} Install required dependencies
  ${chalk.yellow('*')} Setup Claude Code integration`;

  const box = boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  });

  console.log(box);
}
```

### Pattern 6: 简单双语支持
**What:** 使用语言检测和简单翻译对象实现双语
**When to use:** 只需要支持少数几种语言时
**Example:**
```javascript
// i18n/index.js
const translations = {
  en: require('./en.json'),
  zh: require('./zh.json')
};

function detectLanguage() {
  const langEnv = process.env.LANG || process.env.LC_ALL || '';
  if (langEnv.startsWith('zh')) return 'zh';
  return 'en';
}

function t(key) {
  const lang = detectLanguage();
  return translations[lang][key] || translations['en'][key] || key;
}

module.exports = { t, detectLanguage };
```

### Anti-Patterns to Avoid
- **硬编码 Node.js 路径:** 使用 `#!/usr/bin/env node` 而非 `#!/usr/local/bin/node`
- **忽略 Windows 兼容性:** 路径使用 `path.join()` 而非字符串拼接
- **缺少退出码:** 错误时应使用 `process.exit(1)` 退出
- **过度依赖:** npx 每次都要下载,包大小直接影响用户体验

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 命令行参数解析 | 手写 process.argv 解析 | commander | 边界情况复杂,help 自动生成 |
| 终端着色 | ANSI 转义序列 | chalk | 平台兼容性,自动检测颜色支持 |
| 文本边框 | 手动拼接字符 | boxen | 多种边框样式,自适应宽度 |
| 语言检测 | 手写环境变量解析 | process.env.LANG + 简单逻辑 | 足够简单,不需要复杂库 |

**Key insight:** CLI 工具的细节非常多 (颜色检测、参数解析、帮助生成),使用成熟库可以避免大量边界问题。

## Common Pitfalls

### Pitfall 1: Shebang 在 Windows 不生效
**What goes wrong:** 在 Windows 上直接运行入口文件失败
**Why it happens:** Windows 不识别 Unix shebang
**How to avoid:** 通过 npm bin 字段执行,npm 会处理跨平台兼容性
**Warning signs:** 用户报告 "node 不是内部或外部命令"

### Pitfall 2: 忘记在 package.json 中声明 files 字段
**What goes wrong:** 发布后 npm 包缺少必要文件
**Why it happens:** npm 默认只包含根目录文件
**How to avoid:** 明确声明 `"files": ["bin", "src"]`
**Warning signs:** npx 执行时报 "Cannot find module"

### Pitfall 3: 颜色输出在 CI 环境乱码
**What goes wrong:** 在 CI/CD 环境中颜色代码显示为乱码
**Why it happens:** CI 环境可能不支持 ANSI 颜色
**How to avoid:** chalk 会自动检测,也可通过 `--no-color` 或 `NO_COLOR=1` 禁用
**Warning signs:** CI 日志显示 `[31m` 等转义序列

### Pitfall 4: 退出码不正确
**What goes wrong:** 错误时返回 0,成功时返回非 0
**Why it happens:** 忘记调用 process.exit() 或使用错误码
**How to avoid:** 错误时使用 `process.exit(1)`,成功时使用 `process.exit(0)` 或自然结束
**Warning signs:** CI/CD 流水线无法正确判断执行结果

### Pitfall 5: 包体积过大导致 npx 缓慢
**What goes wrong:** npx 首次执行需要很长时间下载
**Why it happens:** 包含了不必要的依赖或文件
**How to avoid:** 使用 `files` 字段,精简依赖,考虑使用 bundle
**Warning signs:** 用户抱怨安装速度慢

## Code Examples

### 完整的入口文件示例
```javascript
#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const packageJson = require('../package.json');

// 平台检测
if (process.platform !== 'win32') {
  console.error(chalk.red('Error: This installer is designed for Windows only.'));
  console.error(chalk.gray(`Current platform: ${process.platform}`));
  process.exit(1);
}

// CLI 定义
program
  .name('work-skills-setup')
  .description('Work Skills Setup - Claude Code skills for Windows developers')
  .version(packageJson.version, '-v, --version', 'Show version')
  .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
  .option('--no-color', 'Disable colored output');

program.parse(process.argv);

// 欢迎界面
function showWelcome() {
  const content = `${chalk.bold.cyan('Work Skills Setup')}
${chalk.gray('v' + packageJson.version)}

Claude Code skills installer for Windows developers`;

  console.log(boxen(content, {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  }));
}

showWelcome();
```
**Source:** 基于 [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices)

### 简单翻译文件示例
```json
// i18n/en.json
{
  "welcome.title": "Work Skills Setup",
  "welcome.subtitle": "Claude Code skills for Windows developers",
  "error.windowsOnly": "This installer is designed for Windows only.",
  "help.language": "Language (en/zh)"
}

// i18n/zh.json
{
  "welcome.title": "Work Skills 安装器",
  "welcome.subtitle": "为 Windows 开发者准备的 Claude Code 技能",
  "error.windowsOnly": "此安装器仅支持 Windows 系统。",
  "help.language": "语言 (en/zh)"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| yargs 流式 API | Commander.js 面向对象 | 持续演进 | 代码更清晰,TypeScript 支持更好 |
| ANSI 转义序列 | chalk 库 | ~2015 | 更安全,自动检测终端能力 |
| 全局安装 | npx 临时执行 | npm 5.2.0 (2017) | 更便捷,无需全局污染 |
| 手动 package.json | npm init / 工具生成 | 持续演进 | 标准化,减少错误 |

**Deprecated/outdated:**
- **colors.js**: 已停止维护,存在性能问题,使用 chalk 替代
- **optimist**: 已废弃,使用 yargs 或 commander 替代

## Open Questions

1. **包名称确认**
   - What we know: 需求中指定 `@allanpk716/work-skills-setup`
   - What's unclear: npm scope @allanpk716 是否已注册
   - Recommendation: 实现前确认 npm 账户和 scope 可用性

2. **双语支持范围**
   - What we know: 需要支持中英文
   - What's unclear: 是否需要动态切换或仅根据系统语言自动选择
   - Recommendation: 初期使用自动检测 + --lang 选项手动覆盖

3. **Node.js 最低版本要求**
   - What we know: 需要 ESM 支持 (chalk 5.x)
   - What's unclear: 目标用户的 Node.js 版本分布
   - Recommendation: 设置 `"engines": { "node": ">=16.0.0" }`

## Validation Architecture

> workflow.nyquist_validation 未在 config.json 中明确设置,默认启用验证。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 或 Vitest (Node.js CLI 测试) |
| Config file | jest.config.js 或 vitest.config.ts |
| Quick run command | `npm test -- --testPathPattern=installer` |
| Full suite command | `npm test` |

**Note:** 现有项目使用 Python pytest,安装器是独立的 Node.js 项目,需要独立的测试框架。

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INST-01 | npx 执行成功 | integration | `npm test -- --testNamePattern="npx execution"` | Wave 0 创建 |
| INST-02 | Windows 检测 | unit | `npm test -- --testNamePattern="platform detection"` | Wave 0 创建 |
| INST-03 | 双语支持 | unit | `npm test -- --testNamePattern="i18n"` | Wave 0 创建 |
| INST-04 | 欢迎界面显示 | unit | `npm test -- --testNamePattern="welcome"` | Wave 0 创建 |
| INST-05 | help/version 选项 | unit | `npm test -- --testNamePattern="help\|version"` | Wave 0 创建 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=<affected-file>`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/package.json` - npm 包配置
- [ ] `installer/jest.config.js` 或 `vitest.config.ts` - 测试框架配置
- [ ] `installer/tests/setup.js` - 测试环境设置
- [ ] `installer/tests/cli.test.js` - CLI 命令测试
- [ ] Framework install: `npm install --save-dev jest` 或 `vitest`

## Sources

### Primary (HIGH confidence)
- [Node.js CLI Apps Best Practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - CLI 开发最佳实践综合指南
- [Node.js process.platform Documentation](https://nodejs.org/api/process.html) - 官方平台检测 API
- [Commander.js GitHub](https://github.com/tj/commander.js) - Commander.js 官方文档
- [chalk npm](https://www.npmjs.com/package/chalk) - 终端着色库官方文档
- [boxen npm](https://www.npmjs.com/package/boxen) - 终端边框库官方文档

### Secondary (MEDIUM confidence)
- [Commander.js 教程 - 掘金](https://juejin.cn/post/7358093962530750505) - 中文详细教程
- [跨平台 Node.js 开发 - CSDN](https://blog.csdn.net/gitblog_00777/article/details/149013652) - 平台检测详解
- [npx 与 npm 详解 - 掘金](https://juejin.cn/post/7243727901781852221) - bin 字段配置

### Tertiary (LOW confidence)
- [CLI 工具开发教程 - 知乎](https://zhuanlan.zhihu.com/p/692947474) - 2024 年教程,需验证具体版本

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 基于 npm registry 当前版本和广泛使用的最佳实践
- Architecture: HIGH - 遵循 Node.js CLI Apps Best Practices 官方推荐模式
- Pitfalls: HIGH - 来自生产环境实践和社区反馈

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (npm 包版本可能更新,架构模式稳定)
