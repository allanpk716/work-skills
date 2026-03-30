# Phase 24: CLI Entry & Detection - Research

**Researched:** 2026-03-30
**Domain:** CLI argument routing + installed components detection (Node.js/Windows)
**Confidence:** HIGH

## Summary

Phase 24 为安装器添加 `--uninstall` CLI 入口，并检测全部 7 类已安装组件痕迹，为 Phase 25 卸载执行提供完整的安装清单。本阶段的核心工作是在现有 CLI 路由模式（`--verify`）的基础上添加 `--uninstall` 路由，然后创建一个新的 `uninstall/` 模块来聚合已有的检测函数，最终以分类表格形式展示检测结果。

代码库中已经存在所有需要的底层检测函数：`isPluginInstalled()`、`isHooksInstalled()`、`isHooksRegistered()`、`isCommandsInstalled()`、`readClaudeConfig()`、`detectPushoverFull()` 等。本阶段不需要编写新的检测逻辑，而是复用这些函数并统一输出格式。

**Primary recommendation:** 复用现有检测函数，按 D-03 决策在 `parseArgs()` 中添加 `--uninstall` 选项（类似 `--verify` 模式），新增 `installer/src/uninstall/detector.js` 聚合检测结果，使用手绘 ASCII 表格（与 `formatter.js` 一致）展示。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full detection — 检测全部 7 类安装痕迹（plugin dirs, plugin SKILL.md, hook scripts, hook registration, slash commands, marketplace source, env vars）
- **D-02:** Table format — 使用类似 Phase 15 环境检测报告的表格格式，按类别分组，彩色状态图标（✓ 已安装，⊘ 未安装）
- **D-03:** Follow --verify pattern — `--uninstall` 标志类似现有 `--verify`，在 `parseArgs()` 添加选项，在 `main()` 中检查 `options.uninstallOnly`，跳过安装流程进入卸载检测。`--uninstall` 与 `--verify` 互斥，同时指定时 `--uninstall` 优先

### Claude's Discretion
- 表格具体样式（边框、列宽、颜色方案）
- i18n 翻译键的命名规范 (uninstall.*)
- 检测函数的具体代码组织方式
- Nothing-installed 时的退出消息措辞
- --help 中 uninstall 描述的具体文字

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | User can run `npx @allanpk716/work-skills-setup --uninstall` to trigger uninstall flow | `parseArgs()` 添加 `--uninstall` 选项，`main()` 添加路由分支。参考现有 `--verify` 模式 (cli.js L23, index.js L24-27) |
| CLI-02 | `--help` output includes uninstall usage and description | Commander 的 `.option()` 自动将描述加入 --help 输出，使用 i18n 键翻译描述文字 |
| CLI-03 | `--version` output remains consistent with installer version | 不影响现有 `.version()` 行为，无需修改 |
| PLUG-01 | System detects which plugins are currently installed (claude-notify, windows-git-commit) | 复用 `plugin-installer.js` 的 `isPluginInstalled(pluginName)` 函数，检测 `~/.claude/skills/{name}/SKILL.md` 存在性 |
| ENV-01 | System detects Pushover environment variables set via setx (PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN) | 复用 `pushover.js` 的 `detectPushoverFull()` 函数，双源检测 (process.env + 注册表)。注意实际环境变量名为 `PUSHOVER_TOKEN` 和 `PUSHOVER_USER` |
| UX-04 | Uninstall flow supports bilingual output (Chinese/English, auto-detected) | 复用现有 i18n 系统，添加 `uninstall.*` 翻译键到 en.json 和 zh.json |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | 14.0.3 | CLI 参数解析 | 已在 `cli.js` 中使用，无需新增依赖 |
| chalk | 4.1.2 | 彩色终端输出 | 已在项目中广泛使用，检测表格的状态图标着色 |
| execa | 5.1.1 | 进程执行 | 已在 `pushover.js` 中用于注册表读取 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs (Node built-in) | N/A | 文件存在性检查 | 检测插件、hooks、commands 文件是否存在 |
| path (Node built-in) | N/A | 路径拼接 | 构建检测目标路径 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 手绘 ASCII 表格 (formatter.js 风格) | cli-table3 | 手绘更轻量，与现有 verification formatter 一致，无需新增依赖 |
| Commander `.option()` | 手动解析 process.argv | Commander 已是依赖，且 `--verify` 已用此模式 |

**Installation:**
```bash
# 无需安装新依赖 — 所有依赖已在 installer/package.json 中
cd installer && npm ls commander chalk execa
```

**Version verification:**
```
commander: 14.0.3 (installed)
chalk: 4.1.2 (installed)
execa: 5.1.1 (installed)
jest: ^30.3.0 (devDependency)
```

## Architecture Patterns

### Recommended Project Structure
```
installer/src/
  cli.js                    # MODIFY: 添加 --uninstall 选项
  index.js                  # MODIFY: 添加 uninstallOnly 路由
  i18n/en.json              # MODIFY: 添加 uninstall.* 翻译键
  i18n/zh.json              # MODIFY: 添加 uninstall.* 翻译键
  uninstall/                # NEW: 卸载检测模块
    detector.js             # 聚合全部 7 类检测，返回结构化结果
    formatter.js            # 格式化检测报告表格输出
    index.js                # 模块入口，串联检测 + 格式化 + 输出
installer/tests/
  cli.test.js               # MODIFY: 添加 --uninstall 测试
  index.test.js             # MODIFY: 添加 uninstallOnly 路由测试
  uninstall/
    detector.test.js        # NEW: 检测逻辑测试
    formatter.test.js       # NEW: 表格格式化测试
    index.test.js           # NEW: 集成测试
```

### Pattern 1: CLI Flag Routing (--verify 模式)
**What:** Commander 解析 CLI 标志，main() 根据标志跳过主流程
**When to use:** 任何需要从安装器主流程分叉出的独立模式
**Example:**
```javascript
// Source: installer/src/cli.js (existing pattern)
program
  .option('--verify', 'Run installation verification only')
  .option('--uninstall', 'Run uninstall detection')  // NEW

const options = program.opts();
return {
  lang: options.lang,
  useColors: options.color !== false,
  verifyOnly: options.verify === true,
  uninstallOnly: options.uninstall === true  // NEW
};

// Source: installer/src/index.js (existing routing pattern)
if (options.uninstallOnly) {
  const result = await runUninstallDetection();
  process.exit(result.hasItems ? 0 : 0);
}
```

### Pattern 2: Detection Aggregation
**What:** 聚合多个现有检测函数，返回统一结构
**When to use:** 需要一次性检查多种安装痕迹时
**Example:**
```javascript
// 聚合检测函数，返回分类结果
async function detectAllInstalled() {
  const { isPluginInstalled } = require('../marketplace/plugin-installer.js');
  const { isHooksInstalled, isHooksRegistered, isCommandsInstalled } = require('../hooks/hooks-installer.js');
  const { readClaudeConfig } = require('../marketplace/config-manager.js');
  const { detectPushoverFull } = require('../configurators/pushover.js');

  const plugins = [
    { name: 'claude-notify', installed: isPluginInstalled('claude-notify') },
    { name: 'windows-git-commit', installed: isPluginInstalled('windows-git-commit') }
  ];

  const hooksScripts = isHooksInstalled();
  const hooksRegistered = isHooksRegistered();
  // ... etc.

  return { plugins, hooksScripts, hooksRegistered, /* ... */ };
}
```

### Pattern 3: ASCII Table Formatting (手绘表格)
**What:** 使用 chalk 着色的手绘 ASCII 表格，与 verification/formatter.js 一致
**When to use:** 需要显示结构化检测结果时
**Example:**
```javascript
// Source: installer/src/verification/formatter.js (existing pattern)
const separator = chalk.gray('|---------------------------|------------|------|');
const header = chalk.gray('| Item                      | Status     | Path |');
const lines = [separator, header, separator];
results.forEach(result => {
  const statusIcon = result.installed ? chalk.green('✓') : chalk.gray('⊘');
  // ... pad and push
});
lines.push(separator);
```

### Anti-Patterns to Avoid
- **重新实现检测逻辑:** 不要编写新的检测代码，必须复用 `isPluginInstalled()`, `isHooksInstalled()` 等现有函数
- **在 main() 中直接写检测代码:** 检测逻辑应封装在 `uninstall/` 模块中，main() 只做路由调用
- **使用 cli-table3:** 项目中 verification 模块已使用手绘表格，应保持一致
- **阻塞安装器发布流程:** `--uninstall` 路由应完全独立于安装流程，不影响正常安装

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 插件存在性检测 | 自定义 fs.existsSync 检测 | `isPluginInstalled(pluginName)` from plugin-installer.js | 已处理路径拼接和 SKILL.md 检测逻辑 |
| Hook 脚本检测 | 自定义文件遍历 | `isHooksInstalled()` from hooks-installer.js | 已包含 SCRIPT_MAPPINGS 遍历 |
| Hook 注册检测 | 自定义 settings.json 解析 | `isHooksRegistered()` from hooks-installer.js | 已处理 Stop/Notification 事件匹配 |
| Commands 检测 | 自定义 commands 目录遍历 | `isCommandsInstalled()` from hooks-installer.js | 已包含 COMMAND_TEMPLATES 遍历 |
| Marketplace source 检测 | 自定义 config.json 解析 | `readClaudeConfig()` from config-manager.js | 已处理文件不存在和 JSON 解析错误 |
| 环境变量检测 | 自定义 process.env + reg 查询 | `detectPushoverFull()` from pushover.js | 已实现双源检测 (process.env + 注册表) |
| 多语言输出 | 硬编码中英文字符串 | `t('key')` from i18n/index.js | 已有成熟的 i18n 系统，支持参数替换 |
| CLI 参数解析 | 手动解析 process.argv | Commander `.option()` | 已集成，`--verify` 已用此模式 |

**Key insight:** 本阶段几乎不需要编写新的检测逻辑。所有底层检测函数都已存在且经过测试。核心工作是"聚合 + 格式化 + 路由"。

## Common Pitfalls

### Pitfall 1: 环境变量名不一致
**What goes wrong:** REQUIREMENTS.md 中写的是 `PUSHOVER_USER_KEY` 和 `PUSHOVER_API_TOKEN`，但代码中实际使用的环境变量名是 `PUSHOVER_USER` 和 `PUSHOVER_TOKEN`
**Why it happens:** 文档和代码未同步更新
**How to avoid:** 使用代码中的实际名称 `PUSHOVER_TOKEN` 和 `PUSHOVER_USER`。CONTEXT.md 已明确指出这一点
**Warning signs:** 测试时验证 `detectPushoverFull()` 返回的 key 名

### Pitfall 2: --uninstall 和 --verify 互斥处理
**What goes wrong:** 用户同时传入 `--uninstall --verify` 时行为未定义
**Why it happens:** Commander 原生不处理选项互斥
**How to avoid:** 按 D-03 决策，在 main() 中 `--uninstall` 优先于 `--verify`。先检查 uninstallOnly，再检查 verifyOnly
**Warning signs:** 测试用例应覆盖同时传入两个标志的场景

### Pitfall 3: 检测结果的布尔类型不一致
**What goes wrong:** `isHooksInstalled()` 返回 boolean，但 `isPluginInstalled()` 也返回 boolean，而 `readClaudeConfig()` 返回 Object，需要从 Object 中判断 marketplace source 是否存在
**Why it happens:** 不同模块的检测函数返回类型不同
**How to avoid:** detector.js 聚合层统一处理返回类型差异，对外输出统一的结构化格式 `{ installed: boolean, path?: string }`
**Warning signs:** 检测结果应包含 path/detail 信息用于表格展示，不仅仅是 boolean

### Pitfall 4: 没有安装任何东西时的用户体验
**What goes wrong:** 全部 7 类检测结果均为"未安装"时，显示一个全空的表格，用户不知道意味着什么
**Why it happens:** 只关注表格渲染，忽略了空结果场景
**How to avoid:** 检测到 "nothing installed" 时显示友好提示消息，并给出正常退出码。这是 Claude's Discretion 区域
**Warning signs:** 测试用例应覆盖全空检测结果的场景

### Pitfall 5: i18n 翻译键遗漏
**What goes wrong:** 只在 en.json 添加了翻译键但忘记 zh.json，或反之
**Why it happens:** 手动添加容易遗漏
**How to avoid:** 两个文件同时编辑，确保键名完全一致。推荐命名规范 `uninstall.*`
**Warning signs:** 测试时切换 --lang en/zh 验证所有文本

## Code Examples

### CLI 选项添加（修改 cli.js）
```javascript
// Source: installer/src/cli.js (existing pattern to extend)
program
  .name('work-skills-setup')
  .description('Work Skills Setup - Claude Code skills installer for Windows developers')
  .version(packageJson.version, '-v, --version', 'Show version')
  .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
  .option('--no-color', 'Disable colored output')
  .option('--verify', 'Run installation verification only')
  .option('--uninstall', 'Run uninstall detection')  // ADD THIS LINE
  .allowExcessArguments(true)
  .exitOverride()
  .parse(argv);

// Return object — add uninstallOnly
return {
  lang: options.lang,
  useColors: options.color !== false,
  verifyOnly: options.verify === true,
  uninstallOnly: options.uninstall === true  // ADD THIS LINE
};
```

### 主入口路由（修改 index.js）
```javascript
// Source: installer/src/index.js (existing pattern to extend)
// Handle --uninstall flag (uninstallOnly takes priority over verifyOnly)
if (options.uninstallOnly) {
  const { runUninstallDetection } = require('./uninstall/index.js');
  const result = await runUninstallDetection();
  process.exit(0);
}

// Handle --verify flag (skip to verification only)
if (options.verifyOnly) {
  const result = await runVerification();
  process.exit(result.success ? 0 : 1);
}
```

### 检测聚合（新文件 uninstall/detector.js）
```javascript
// 复用现有检测函数
const { isPluginInstalled, getSkillsDir } = require('../marketplace/plugin-installer.js');
const { isHooksInstalled, isHooksRegistered, isCommandsInstalled, getHooksDir, getCommandsDir } = require('../hooks/hooks-installer.js');
const { readClaudeConfig, getConfigPath } = require('../marketplace/config-manager.js');
const { detectPushoverFull } = require('../configurators/pushover.js');

const PLUGINS = ['claude-notify', 'windows-git-commit'];

async function detectAllInstalled() {
  // Category 1: Plugins
  const plugins = PLUGINS.map(name => ({
    name,
    installed: isPluginInstalled(name),
    path: `${getSkillsDir()}/${name}/SKILL.md`
  }));

  // Category 2: Hook Scripts
  const hooksScripts = {
    installed: isHooksInstalled(),
    path: getHooksDir()
  };

  // Category 3: Hook Registration
  const hooksRegistered = {
    installed: isHooksRegistered(),
    path: '~/.claude/settings.json'
  };

  // Category 4: Slash Commands
  const commandsInstalled = {
    installed: isCommandsInstalled(),
    path: getCommandsDir()
  };

  // Category 5: Marketplace Source
  const config = readClaudeConfig();
  const marketplaceSource = {
    installed: !!(config.marketplaceSources && config.marketplaceSources['work-skills']),
    path: getConfigPath()
  };

  // Category 6: Environment Variables (async — registry lookup)
  const pushoverCreds = await detectPushoverFull();
  const envVars = {
    token: { name: 'PUSHOVER_TOKEN', installed: !!pushoverCreds.token },
    user: { name: 'PUSHOVER_USER', installed: !!pushoverCreds.user }
  };

  return {
    plugins,
    hooksScripts,
    hooksRegistered,
    commandsInstalled,
    marketplaceSource,
    envVars,
    hasAnyInstalled: /* check if anything is installed */
  };
}
```

### 表格输出格式（参考 verification/formatter.js）
```javascript
// Source: installer/src/verification/formatter.js (reference for consistent style)
function formatUninstallTable(results) {
  const separator = chalk.gray('|---------------------------|--------|--------------------------------------------------|');
  const header = chalk.gray('| Item                      | Status | Path / Details                                   |');
  const lines = [separator, header, separator];

  // Category header for Plugins
  lines.push(chalk.cyan('| Plugins                  ') + ' |        |                                                  |');

  results.plugins.forEach(p => {
    const statusIcon = p.installed ? chalk.green('✓') : chalk.gray('⊘');
    const name = p.name.padEnd(25).substring(0, 25);
    const status = statusIcon + (p.installed ? ' inst' : ' none');
    const detail = p.path.padEnd(48).substring(0, 48);
    lines.push(`| ${name} | ${status} | ${detail}|`);
  });

  // ... other categories ...
  lines.push(separator);
  return lines.join('\n');
}
```

### i18n 翻译键（添加到 en.json 和 zh.json）
```json
{
  "uninstall.title": "Uninstall Detection",
  "uninstall.category.plugins": "Plugins",
  "uninstall.category.hooks": "Hooks & Commands",
  "uninstall.category.config": "Configuration",
  "uninstall.category.environment": "Environment Variables",
  "uninstall.status.installed": "Installed",
  "uninstall.status.notInstalled": "Not installed",
  "uninstall.summary": "Detection complete: {found}/{total} items installed",
  "uninstall.nothingFound": "Nothing installed. No uninstall needed.",
  "uninstall.cliHelp": "Run uninstall detection and show what will be removed"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| yargs CLI 解析 | Commander 14.x | Phase 19 已切换 | 不再使用 yargs，所有 CLI 选项通过 Commander `.option()` 添加 |
| cli-table3 表格 | 手绘 ASCII 表格 + chalk | Phase 19 实现 | verification 模块使用手绘表格，应保持一致 |

**Deprecated/outdated:**
- cli-table3: 项目中未实际使用（虽在 Phase 19 CONTEXT 中提到），verification/formatter.js 使用手绘表格

## Open Questions

1. **Marketplace source 检测的详细判断条件**
   - What we know: `readClaudeConfig()` 返回 config 对象，`config.marketplaceSources['work-skills']` 存在即为已注册
   - What's unclear: 是否需要验证 source 的 url 和 branch 字段是否匹配
   - Recommendation: 只检查 key 是否存在即可，不需要验证内容

2. **检测结果的返回格式与 Phase 25 的接口契约**
   - What we know: Phase 25 需要基于检测结果执行卸载
   - What's unclear: Phase 25 具体需要什么格式的输入
   - Recommendation: 返回结构化对象，每个检测项包含 `{ name, installed, path, category }`，Phase 25 可直接遍历执行

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | 22.14.0 | -- |
| npm | Package management | Yes | 10.9.2 | -- |
| Python | 环境变量注册表检测间接依赖 | Yes | 3.11.9 | -- |
| commander | CLI 解析 | Yes | 14.0.3 | -- |
| chalk | 彩色输出 | Yes | 4.1.2 | -- |
| execa | 注册表读取 | Yes | 5.1.1 | -- |
| jest | 测试 | Yes | ^30.3.0 | -- |

**Missing dependencies with no fallback:**
- None — 所有依赖已安装

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^30.3.0 |
| Config file | package.json scripts.test |
| Quick run command | `cd installer && npx jest tests/cli.test.js tests/index.test.js -x` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLI-01 | `--uninstall` flag parsed and routes to uninstall flow | unit | `npx jest tests/cli.test.js -t "uninstall" -x` | Partial (cli.test.js exists, needs new test cases) |
| CLI-02 | `--help` shows uninstall option | unit | `npx jest tests/cli.test.js -t "help" -x` | Needs new test case |
| CLI-03 | `--version` output unchanged | unit | `npx jest tests/cli.test.js -t "version" -x` | Existing tests cover this (regression) |
| PLUG-01 | Plugin detection returns correct installed/not-installed status | unit | `npx jest tests/uninstall/detector.test.js -x` | Wave 0 needed |
| ENV-01 | Pushover env var detection works (dual-source) | unit | `npx jest tests/uninstall/detector.test.js -x` | Wave 0 needed |
| UX-04 | Bilingual output via i18n system | unit | `npx jest tests/uninstall/formatter.test.js -x` | Wave 0 needed |

### Sampling Rate
- **Per task commit:** `cd installer && npx jest tests/cli.test.js tests/uninstall/ -x`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full test suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/uninstall/detector.test.js` — covers PLUG-01, ENV-01 (mock fs/execa, test detectAllInstalled)
- [ ] `installer/tests/uninstall/formatter.test.js` — covers UX-04 (table rendering in en/zh)
- [ ] `installer/tests/uninstall/index.test.js` — covers CLI-01 integration (runUninstallDetection)
- [ ] `installer/tests/cli.test.js` — add `--uninstall` test cases
- [ ] `installer/tests/index.test.js` — add uninstallOnly routing test case
- [ ] `installer/tests/i18n.test.js` — add uninstall.* key existence test

## Sources

### Primary (HIGH confidence)
- Source code analysis: `installer/src/cli.js`, `installer/src/index.js`, `installer/src/verification/formatter.js` — 现有模式可直接参考
- Source code analysis: `installer/src/marketplace/plugin-installer.js` — `isPluginInstalled()` 函数签名和行为
- Source code analysis: `installer/src/hooks/hooks-installer.js` — `isHooksInstalled()`, `isHooksRegistered()`, `isCommandsInstalled()` 函数
- Source code analysis: `installer/src/configurators/pushover.js` — `detectPushoverFull()` 双源检测实现
- Source code analysis: `installer/src/marketplace/config-manager.js` — `readClaudeConfig()` 实现
- CONTEXT.md: Phase 24 用户决策和约束

### Secondary (MEDIUM confidence)
- Phase 19 CONTEXT: `--verify` 模式的设计决策和实现参考
- Existing test files: `installer/tests/cli.test.js`, `installer/tests/index.test.js` — 测试模式参考

### Tertiary (LOW confidence)
- None — 所有发现均基于源代码直接分析

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 所有库已在项目中使用，版本已验证
- Architecture: HIGH — 复用现有 --verify 模式和 formatter.js 表格模式
- Pitfalls: HIGH — 基于源代码分析，特别是环境变量名不一致问题已在 CONTEXT.md 中确认

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase, no external API dependencies)
