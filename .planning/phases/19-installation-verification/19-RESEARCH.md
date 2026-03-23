# Phase 19: Installation Verification - Research

**Researched:** 2026-03-23
**Domain:** 安装后验证、Node.js 调用 Python 脚本、输出解析、表格格式化
**Confidence:** HIGH

## Summary

Phase 19 的核心任务是集成现有的 Python 验证脚本到 Node.js 安装器中,实现自动运行验证、解析输出、格式化结果表格,并提供失败反馈和重新验证命令。关键技术点是使用 execa 库调用 Python 脚本,通过正则表达式解析文本输出,使用 cli-table3 格式化表格(与 Phase 15 风格一致),以及添加 `--verify` CLI 选项支持独立验证模式。

研究覆盖了以下核心领域:

1. **Python 脚本调用**: 使用 execa 库(已安装 v5.1.1)执行 Python 脚本,设置 30 秒超时,错误处理和输出捕获
2. **输出解析**: 使用正则表达式解析 Python 脚本的标准输出,提取 `[OK]` / `[X]` 状态标记和检查结果
3. **表格格式化**: 使用 cli-table3 库创建与 Phase 15 一致的表格格式,支持彩色状态图标
4. **CLI 选项扩展**: 使用 commander.js 添加 `--verify` 选项,支持独立验证模式
5. **错误处理和反馈**: 失败时显示具体问题和解决建议,不阻止安装完成

**Primary recommendation:** 使用 execa 调用现有 Python 验证脚本,通过正则表达式解析文本输出(不修改 Python 脚本),使用 cli-table3 格式化结果表格,实现 `--verify` CLI 选项支持独立验证。失败时显示警告和建议,允许安装继续。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Implementation Decisions

#### 验证脚本执行方式

**调用策略:**
- 直接调用现有 `plugins/claude-notify/scripts/verify-installation.py`
- 不重写为 Node.js,复用已验证的 Python 验证逻辑
- 依赖 Python 环境(已在前序阶段检测)

**执行参数:**
- 无参数执行,运行所有 7 个检查项
- 不支持选择性检查(如 `--check-python`)
- 不修改 Python 脚本添加 JSON 输出

**调用方式:**
```javascript
// 使用 execa 执行 Python 脚本
const result = await execa('python', [
  path.join(__dirname, '../../plugins/claude-notify/scripts/verify-installation.py')
], {
  timeout: 30000,  // 30 秒超时
  encoding: 'utf-8'
});
```

#### 结果展示格式

**输出解析:**
- 解析 Python 脚本的文本输出,提取状态信息
- 使用正则表达式匹配 `[OK]` 和 `[X]` 标记
- 解析检查项名称和结果消息
- 不修改 Python 脚本添加 JSON 输出

**解析正则示例:**
```javascript
// 匹配格式: "  [OK] Python version: PASS"
const pattern = /^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL)/;
```

**显示格式:**
- 使用表格格式,与 Phase 15 环境检测报告风格一致
- 表头:检查项(Check)、状态(Status)、详情(Details)
- 状态图标:✓(绿色)表示 PASS,✗(红色)表示 FAIL

**表格示例:**
```
安装验证结果:

+---------------------------+--------+--------------------------------+
| 检查项                    | 状态   | 详情                           |
+---------------------------+--------+--------------------------------+
| Python Version            | ✓ PASS | 3.9.1 (>=3.8 required)        |
| Standard Libraries        | ✓ PASS | All libraries available        |
| Environment Variables     | ✗ FAIL | PUSHOVER_TOKEN not set        |
| Pushover API              | ⊘ SKIP | Credentials not configured     |
| Windows Toast             | ✓ PASS | Test notification sent         |
| Plugin Files              | ✓ PASS | All files found                |
| Slash Commands            | ✓ PASS | All commands respond           |
+---------------------------+--------+--------------------------------+

Summary: 5/7 checks passed
```

**双语支持:**
- Python 脚本保持英文输出
- Node.js 包装层添加中文标题和说明
- 使用 i18n 系统翻译表头和摘要消息
- 检查项名称保持英文(与 Python 输出一致)

**i18n 键示例:**
```json
{
  "verification.title": "Installation Verification",
  "verification.summary": "Summary: {passed}/{total} checks passed",
  "verification.column.check": "Check",
  "verification.column.status": "Status",
  "verification.column.details": "Details"
}
```

#### 失败处理策略

**失败操作:**
- 验证失败显示警告和建议,允许安装继续
- 不阻止安装完成,用户可稍后修复问题
- 失败信息包含具体问题和解决建议

**失败阈值:**
- 至少 5/7 检查项通过即算验证成功
- 低于 5 项通过显示警告但仍允许完成
- 不强制所有检查项都通过

**检查项分类:**
- **关键项**(必须通过才能正常使用):
  - Python Version (基础依赖)
  - Standard Libraries (基础依赖)
  - Plugin Files (插件完整性)
  - Slash Commands (功能完整性)

- **非关键项**(可选,失败不影响基础功能):
  - Environment Variables (Pushover 可选)
  - Pushover API (Pushover 可选)
  - Windows Toast (通知渠道可选)

**失败反馈:**
- 失败检查项显示红色 ✗ 图标
- 详情列显示具体失败原因
- 摘要后显示"常见解决方案"提示
- 例如:
  ```
  Common solutions:
  - Install missing Python libraries: pip install requests
  - Set environment variables: PUSHOVER_TOKEN, PUSHOVER_USER
  - Check PowerShell execution policy
  ```

#### 重新验证命令

**命令格式:**
- 复用安装器包名,添加 `--verify` 标志
- 命令: `npx @allanpk716/work-skills-setup --verify`
- 不创建独立的验证包

**CLI 选项实现:**
- 在 `installer/src/cli.js` 添加 `--verify` 选项
- 选项说明: "Run installation verification only"
- 使用示例: `npx @allanpk716/work-skills-setup --verify`

**执行流程:**
1. 用户运行 `npx @allanpk716/work-skills-setup --verify`
2. CLI 解析 `--verify` 标志
3. 跳过欢迎、环境检测、配置、市场集成步骤
4. 直接执行验证流程(Step 8)
5. 显示验证结果并退出

**显示位置:**
- 验证摘要后显示重新验证命令
- 格式: "To re-run verification: npx @allanpk716/work-skills-setup --verify"
- 使用灰色(chalk.gray)显示,区别于主要信息

**错误场景:**
- Python 未安装:显示错误,"Python is required for verification"
- Python 脚本不存在:显示错误,"Verification script not found"
- 执行超时(30 秒):显示错误,"Verification timeout"

### Claude's Discretion

- 解析正则的具体实现细节
- 表格的边框样式和颜色方案
- 失败消息的具体措辞
- 超时时间设置(默认 30 秒)
- 是否显示跳过的检查项(如 Pushover API 未配置时)
- i18n 键的命名规范

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VER-01 | 安装完成后自动运行 verify-installation.py 验证 | 使用 execa 调用 Python 脚本,在 Step 8 执行验证 |
| VER-02 | 验证结果显示通过/失败状态摘要 | 使用正则解析输出,cli-table3 格式化表格,计算通过率 |
| VER-03 | 验证失败时显示具体问题和解决建议 | 解析失败项详情,显示常见解决方案列表 |
| VER-04 | 提供手动重新验证的命令提示 | 添加 --verify CLI 选项,在摘要后显示命令 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | ^5.1.1 | 执行 Python 子进程 | 已安装,Promise API,自动错误处理,Windows 兼容性好 |
| commander | ^14.0.3 | CLI 选项解析 | 已安装,简单 API,支持自定义选项 |
| chalk | ^4.1.2 | 终端颜色输出 | 已安装,Windows 兼容,广泛使用 |
| cli-table3 | ^0.6.3 | 表格格式化 | 项目标准,与 Phase 15 一致,支持彩色和 Unicode |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| path | (Node.js built-in) | 跨平台路径处理 | 解析 Python 脚本路径,使用 path.join() |
| fs | (Node.js built-in) | 文件系统检查 | 验证 Python 脚本是否存在 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execa | child_process.spawn | execa 更简洁,自动错误处理,Promise API 更友好 |
| cli-table3 | cli-table (v2) | cli-table3 是 v2 的维护分支,支持更多特性 |
| 正则解析 | JSON 输出 | 修改 Python 脚本增加复杂度,正则解析已足够可靠 |

**Installation:**
```bash
# cli-table3 需要安装
cd installer
npm install cli-table3
```

**Version verification:**
```bash
npm view cli-table3 version
# 0.6.3 (2024-01-13)
```

## Architecture Patterns

### Recommended Project Structure
```
installer/
├── src/
│   ├── verification/           # 新增验证模块目录
│   │   ├── index.js           # 主入口,导出 runVerification()
│   │   ├── runner.js          # 执行 Python 脚本
│   │   ├── parser.js          # 解析 Python 输出
│   │   └── formatter.js       # 格式化表格输出
│   ├── cli.js                 # 添加 --verify 选项
│   ├── index.js               # Step 8 调用 runVerification()
│   └── i18n/
│       ├── en.json            # 添加 verification.* 键
│       └── zh.json            # 添加中文翻译
└── tests/
    └── verification/          # 单元测试目录
        ├── index.test.js
        ├── runner.test.js
        ├── parser.test.js
        └── formatter.test.js
```

### Pattern 1: Python Script Execution (execa)
**What:** 使用 execa 执行 Python 验证脚本,捕获输出和错误
**When to use:** 调用现有的 Python 验证脚本
**Example:**
```javascript
// Source: execa GitHub docs - Basic execution
const execa = require('execa');
const path = require('path');

async function runPythonVerification() {
  const scriptPath = path.join(
    __dirname,
    '../../plugins/claude-notify/scripts/verify-installation.py'
  );

  try {
    const result = await execa('python', [scriptPath], {
      timeout: 30000,         // 30 秒超时
      encoding: 'utf-8',
      reject: false,          // 不自动抛出错误,手动处理
      cwd: process.cwd()      // 当前工作目录
    });

    if (result.failed) {
      // 处理执行失败
      return {
        success: false,
        error: 'execution_failed',
        stderr: result.stderr
      };
    }

    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    };
  } catch (error) {
    // 处理超时、命令不存在等错误
    if (error.timedOut) {
      return {
        success: false,
        error: 'timeout'
      };
    }
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'python_not_found'
      };
    }
    throw error;
  }
}
```

### Pattern 2: Output Parsing (Regex)
**What:** 使用正则表达式解析 Python 脚本的文本输出
**When to use:** 从 Python 输出中提取结构化数据
**Example:**
```javascript
// Source: Python script输出格式分析
// 格式: "  [OK] Python version: PASS"
//       "      Current: 3.9.1, Required: >=3.8"

function parseVerificationOutput(stdout) {
  const lines = stdout.split('\n');
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 匹配主结果行
    const match = line.match(/^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL|SKIP)/);
    if (match) {
      const [, status, name, result] = match;

      // 读取下一行作为详情(如果有)
      let details = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.match(/^\s*\[(OK|X)\]/)) {
          details = nextLine;
          i++; // 跳过已读取的详情行
        }
      }

      results.push({
        name: name.trim(),
        status: result,        // 'PASS' | 'FAIL' | 'SKIP'
        symbol: status,        // 'OK' | 'X'
        details: details
      });
    }
  }

  return results;
}
```

### Pattern 3: Table Formatting (cli-table3)
**What:** 使用 cli-table3 创建与 Phase 15 一致的表格格式
**When to use:** 格式化验证结果为表格显示
**Example:**
```javascript
// Source: Phase 15 detectors/index.js pattern
const Table = require('cli-table3');
const chalk = require('chalk');

function formatVerificationResults(results) {
  const table = new Table({
    head: [
      chalk.cyan('Check'),
      chalk.cyan('Status'),
      chalk.cyan('Details')
    ],
    colWidths: [25, 12, 50],
    style: {
      head: [],    // 不添加默认边框样式
      border: []   // 使用默认灰色边框
    }
  });

  for (const result of results) {
    let statusIcon;
    if (result.status === 'PASS') {
      statusIcon = chalk.green('✓ PASS');
    } else if (result.status === 'FAIL') {
      statusIcon = chalk.red('✗ FAIL');
    } else {
      statusIcon = chalk.gray('⊘ SKIP');
    }

    table.push([
      result.name,
      statusIcon,
      result.details || ''
    ]);
  }

  return table.toString();
}
```

### Pattern 4: CLI Option Addition (commander.js)
**What:** 添加 `--verify` 选项支持独立验证模式
**When to use:** 扩展 CLI 选项
**Example:**
```javascript
// Source: commander.js documentation
// installer/src/cli.js
const { Command } = require('commander');

function parseArgs(argv = process.argv) {
  const program = new Command();

  program
    .name('work-skills-setup')
    .version(packageJson.version, '-v, --version')
    .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
    .option('--no-color', 'Disable colored output')
    .option('--verify', 'Run installation verification only')  // 新增
    .parse(argv);

  const options = program.opts();

  return {
    lang: options.lang,
    useColors: options.color !== false,
    verifyOnly: options.verify || false  // 新增
  };
}
```

### Pattern 5: Main Entry Integration
**What:** 在主流程中集成验证步骤,支持 `--verify` 模式
**When to use:** Step 8 验证集成
**Example:**
```javascript
// Source: installer/src/index.js
const { runVerification } = require('./verification/index.js');

async function main() {
  const options = parseArgs();

  // --verify 模式:仅运行验证
  if (options.verifyOnly) {
    await runVerification();
    return;
  }

  // 正常安装流程
  checkPlatform();
  showWelcome(options);
  await runAllDetectors();
  await runInstaller(results);
  await runAllConfigurators();
  await runMarketplaceIntegration();

  // Step 8: 验证
  await runVerification();
}
```

### Anti-Patterns to Avoid
- **直接修改 Python 脚本**: Python 脚本已验证,修改增加风险和测试负担
- **硬编码路径分隔符**: 使用 `path.join()` 而不是字符串拼接,确保跨平台兼容
- **忽略错误处理**: execa 执行可能失败(Python 未安装、超时),必须处理所有错误场景
- **过度解析输出**: 正则表达式应简单可靠,不要试图解析所有可能的输出格式
- **阻塞安装完成**: 验证失败不应阻止安装完成,只显示警告

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 子进程执行 | 自定义 spawn 包装 | execa | execa 处理超时、错误、编码,Windows 兼容性更好 |
| 表格格式化 | 手动拼接字符串 | cli-table3 | 对齐、边框、颜色处理复杂,cli-table3 已解决 |
| 正则解析 | 复杂状态机 | 简单正则 + 行迭代 | Python 输出格式稳定,简单正则更可靠 |
| CLI 选项 | 自定义参数解析 | commander.js | 边界情况(帮助、版本)已处理,避免重复工作 |

**Key insight:** 调用外部脚本、解析输出、格式化表格都是已有成熟解决方案的领域。重用 execa、cli-table3 和 commander.js 比自己实现更可靠、可维护性更好。

## Runtime State Inventory

> 此阶段不涉及运行时状态重命名或迁移,跳过此部分。

## Common Pitfalls

### Pitfall 1: Python 路径解析错误
**What goes wrong:** 在 Windows 上硬编码使用 `/` 或 `\` 路径分隔符,导致路径解析失败
**Why it happens:** 开发者习惯使用 Unix 风格路径,Windows 路径分隔符不同
**How to avoid:** 始终使用 `path.join()` 构建路径,Node.js 会自动处理平台差异
**Warning signs:**
- 路径拼接使用字符串 `+` 操作符
- 出现混合的 `/` 和 `\` 分隔符
- 测试仅在 Linux/macOS 上通过

**Example:**
```javascript
// ❌ 错误
const scriptPath = __dirname + '/../../plugins/claude-notify/scripts/verify-installation.py';

// ✓ 正确
const scriptPath = path.join(__dirname, '../../plugins/claude-notify/scripts/verify-installation.py');
```

### Pitfall 2: 忽略 execa 错误处理
**What goes wrong:** execa 执行 Python 脚本失败时未捕获错误,导致进程崩溃
**Why it happens:** execa 默认在非零退出码时抛出错误,开发者忘记 try-catch
**How to avoid:** 使用 `reject: false` 选项手动处理错误,或使用 try-catch 捕获所有异常
**Warning signs:**
- execa 调用没有 try-catch
- 没有 `reject: false` 选项
- 缺少错误类型判断(ENOENT、timedOut)

**Example:**
```javascript
// ❌ 错误:没有错误处理
const result = await execa('python', [scriptPath]);
console.log(result.stdout);

// ✓ 正确:完整错误处理
try {
  const result = await execa('python', [scriptPath], {
    timeout: 30000,
    reject: false
  });

  if (result.failed) {
    // 处理执行失败
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    // Python 未安装
  }
  if (error.timedOut) {
    // 执行超时
  }
}
```

### Pitfall 3: 正则表达式过于复杂
**What goes wrong:** 试图用单个复杂正则匹配所有可能的输出格式,导致维护困难
**Why it happens:** 过度设计,想要一次性处理所有边界情况
**How to avoid:** 使用简单的逐行解析策略,每行匹配一个简单模式
**Warning signs:**
- 正则表达式超过 50 个字符
- 嵌套的分组和量词
- 难以理解和测试

**Example:**
```javascript
// ❌ 过于复杂
const pattern = /^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL|SKIP)\s*(?:\n\s+(.+))?$/;

// ✓ 简单可靠:逐行解析
const lines = stdout.split('\n');
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL)/);
  if (match) {
    // 处理匹配结果
  }
}
```

### Pitfall 4: 表格列宽不匹配
**What goes wrong:** cli-table3 列宽设置与内容长度不匹配,导致表格显示错乱
**Why it happens:** 没有考虑中文字符宽度(占 2 个字符位),或内容超预期长度
**How to avoid:** 设置列宽时预留足够空间,测试中英文混合场景
**Warning signs:**
- 表格边框不对齐
- 内容被截断或换行异常
- 仅在特定语言下显示正常

**Example:**
```javascript
// ❌ 列宽太窄
const table = new Table({
  head: ['Check', 'Status', 'Details'],
  colWidths: [15, 10, 30]  // 可能不够
});

// ✓ 预留足够空间
const table = new Table({
  head: [chalk.cyan('检查项'), chalk.cyan('状态'), chalk.cyan('详情')],
  colWidths: [25, 12, 50]  // 考虑中文和长文本
});
```

### Pitfall 5: 忘记添加 i18n 翻译
**What goes wrong:** 添加了新的用户可见文本,但忘记在 zh.json 中添加翻译,导致中文用户看到英文或 key
**Why it happens:** 开发时使用英文,忘记同步翻译文件
**How to avoid:** 添加文本时立即在两个语言文件中添加对应键
**Warning signs:**
- 测试时看到 `verification.title` 而不是翻译文本
- 中文用户看到英文消息
- i18n 缺失警告

**Example:**
```javascript
// 同时更新两个翻译文件
// en.json
{
  "verification.title": "Installation Verification",
  "verification.summary": "Summary: {passed}/{total} checks passed"
}

// zh.json
{
  "verification.title": "安装验证",
  "verification.summary": "摘要: {passed}/{total} 项检查通过"
}
```

## Code Examples

### 完整的验证流程示例

```javascript
// installer/src/verification/index.js
const execa = require('execa');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const { t } = require('../i18n/index.js');

/**
 * 执行 Python 验证脚本
 */
async function runPythonScript() {
  const scriptPath = path.join(
    __dirname,
    '../../../plugins/claude-notify/scripts/verify-installation.py'
  );

  try {
    const result = await execa('python', [scriptPath], {
      timeout: 30000,
      encoding: 'utf-8',
      reject: false
    });

    if (result.failed) {
      return {
        success: false,
        error: 'execution_failed',
        stderr: result.stderr
      };
    }

    return {
      success: true,
      stdout: result.stdout,
      exitCode: result.exitCode
    };
  } catch (error) {
    if (error.timedOut) {
      return { success: false, error: 'timeout' };
    }
    if (error.code === 'ENOENT') {
      return { success: false, error: 'python_not_found' };
    }
    throw error;
  }
}

/**
 * 解析验证输出
 */
function parseVerificationOutput(stdout) {
  const lines = stdout.split('\n');
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL|SKIP)/);

    if (match) {
      const [, symbol, name, status] = match;
      let details = '';

      // 读取下一行作为详情
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.match(/^\s*\[(OK|X)\]/)) {
          details = nextLine;
          i++;
        }
      }

      results.push({
        name: name.trim(),
        status,
        symbol,
        details
      });
    }
  }

  return results;
}

/**
 * 格式化验证结果表格
 */
function formatVerificationTable(results) {
  const table = new Table({
    head: [
      chalk.cyan(t('verification.column.check')),
      chalk.cyan(t('verification.column.status')),
      chalk.cyan(t('verification.column.details'))
    ],
    colWidths: [25, 12, 50]
  });

  for (const result of results) {
    let statusIcon;
    if (result.status === 'PASS') {
      statusIcon = chalk.green('✓ PASS');
    } else if (result.status === 'FAIL') {
      statusIcon = chalk.red('✗ FAIL');
    } else {
      statusIcon = chalk.gray('⊘ SKIP');
    }

    table.push([
      result.name,
      statusIcon,
      result.details || ''
    ]);
  }

  return table.toString();
}

/**
 * 计算通过率
 */
function calculateSummary(results) {
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  return { passed, total };
}

/**
 * 显示常见解决方案
 */
function displayCommonSolutions() {
  console.log(chalk.yellow('\nCommon solutions:'));
  console.log('  - Install missing Python libraries: pip install requests');
  console.log('  - Set environment variables: PUSHOVER_TOKEN, PUSHOVER_USER');
  console.log('  - Check PowerShell execution policy');
}

/**
 * 主入口:运行验证
 */
async function runVerification() {
  console.log('\n' + chalk.bold(t('verification.title')) + '\n');

  // 1. 执行 Python 脚本
  const execResult = await runPythonScript();

  // 2. 处理执行错误
  if (!execResult.success) {
    if (execResult.error === 'python_not_found') {
      console.error(chalk.red('Error: Python is required for verification'));
      console.error(chalk.gray('Install Python 3.8+ from https://www.python.org/'));
      process.exit(1);
    }
    if (execResult.error === 'timeout') {
      console.error(chalk.red('Error: Verification timeout (30s)'));
      process.exit(1);
    }
    console.error(chalk.red('Error: Verification failed'));
    console.error(chalk.gray(execResult.stderr));
    process.exit(1);
  }

  // 3. 解析输出
  const results = parseVerificationOutput(execResult.stdout);

  // 4. 显示表格
  const table = formatVerificationTable(results);
  console.log(table);

  // 5. 显示摘要
  const { passed, total } = calculateSummary(results);
  console.log('\n' + t('verification.summary', { passed, total }));

  // 6. 失败处理
  if (passed < total) {
    displayCommonSolutions();
  }

  // 7. 显示重新验证命令
  console.log(chalk.gray('\nTo re-run verification: npx @allanpk716/work-skills-setup --verify'));

  // 8. 退出码
  const success = passed >= 5; // 至少 5/7 通过
  process.exit(success ? 0 : 1);
}

module.exports = {
  runVerification
};
```

### CLI 选项扩展

```javascript
// installer/src/cli.js
const { Command } = require('commander');
const { setLanguage } = require('./i18n/index.js');
const packageJson = require('../package.json');

function parseArgs(argv = process.argv) {
  const program = new Command();

  program
    .name('work-skills-setup')
    .description('Work Skills Setup - Claude Code skills installer for Windows developers')
    .version(packageJson.version, '-v, --version', 'Show version')
    .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
    .option('--no-color', 'Disable colored output')
    .option('--verify', 'Run installation verification only')  // 新增
    .allowExcessArguments(true)
    .exitOverride()
    .parse(argv);

  const options = program.opts();

  // 设置语言
  if (options.lang && options.lang !== 'auto') {
    setLanguage(options.lang);
  }

  return {
    lang: options.lang,
    useColors: options.color !== false,
    verifyOnly: options.verify || false  // 新增
  };
}

module.exports = { parseArgs };
```

### i18n 翻译键

```json
// installer/src/i18n/en.json (新增部分)
{
  "verification.title": "Installation Verification",
  "verification.summary": "Summary: {passed}/{total} checks passed",
  "verification.column.check": "Check",
  "verification.column.status": "Status",
  "verification.column.details": "Details",
  "verification.error.pythonNotFound": "Error: Python is required for verification",
  "verification.error.timeout": "Error: Verification timeout (30s)",
  "verification.error.executionFailed": "Error: Verification failed",
  "verification.rerunCommand": "To re-run verification: npx @allanpk716/work-skills-setup --verify"
}
```

```json
// installer/src/i18n/zh.json (新增部分)
{
  "verification.title": "安装验证",
  "verification.summary": "摘要: {passed}/{total} 项检查通过",
  "verification.column.check": "检查项",
  "verification.column.status": "状态",
  "verification.column.details": "详情",
  "verification.error.pythonNotFound": "错误: 验证需要 Python 环境",
  "verification.error.timeout": "错误: 验证超时 (30秒)",
  "verification.error.executionFailed": "错误: 验证失败",
  "verification.rerunCommand": "重新验证命令: npx @allanpk716/work-skills-setup --verify"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| child_process.spawn | execa | 2024-03 (Phase 14) | 更简洁的 API,自动错误处理,更好的 Windows 支持 |
| 手动表格格式化 | cli-table3 | 2024-03 (Phase 15) | 自动对齐,边框处理,颜色支持 |
| 硬编码英文 | i18n 系统 | 2024-03 (Phase 14) | 双语支持,参数替换,易于维护 |

**Deprecated/outdated:**
- child_process.exec: 使用 execa 替代,提供更好的 Promise 支持和错误处理
- cli-table (v2): 使用 cli-table3 替代,v2 已停止维护
- 字符串拼接路径: 使用 path.join() 替代,确保跨平台兼容

## Open Questions

1. **cli-table3 是否需要额外依赖?**
   - What we know: cli-table3 是 cli-table 的维护分支,支持彩色和 Unicode
   - What's unclear: 是否需要安装额外的颜色库(如 colors)
   - Recommendation: cli-table3 已内置 chalk 支持,无需额外依赖,直接安装 cli-table3 即可

2. **Python 脚本输出编码问题**
   - What we know: Windows Python 可能输出 GBK 编码,execa 默认使用 utf-8
   - What's unclear: 是否需要显式设置编码
   - Recommendation: execa 的 `encoding: 'utf-8'` 选项应自动处理,测试时验证中文输出是否正常。如有问题,可在 Python 脚本中添加 `# -*- coding: utf-8 -*-`

3. **表格列宽自适应**
   - What we know: cli-table3 支持固定列宽
   - What's unclear: 是否需要动态计算列宽
   - Recommendation: 使用固定列宽(25, 12, 50),覆盖大多数场景。如遇到超长文本,cli-table3 会自动换行,不会导致表格错乱

## Environment Availability

> 本阶段依赖外部工具(Python)和库(execa、cli-table3),需要检查环境可用性。

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.8+ | 验证脚本执行 | ✓ (Phase 15 已检测) | — | 无(必须) |
| execa | 子进程执行 | ✓ | 5.1.1 (已安装) | — |
| commander | CLI 选项解析 | ✓ | 14.0.3 (已安装) | — |
| chalk | 终端颜色 | ✓ | 4.1.2 (已安装) | — |
| cli-table3 | 表格格式化 | ✗ | — | 需要安装 |

**Missing dependencies with no fallback:**
- cli-table3: 需要安装,`npm install cli-table3`

**Missing dependencies with fallback:**
- 无

## Validation Architecture

> 根据 `.planning/config.json`,workflow.nyquist_validation 未设置,默认为启用。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 |
| Config file | installer/jest.config.js (自动检测) |
| Quick run command | `cd installer && npm test -- tests/verification/index.test.js` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VER-01 | 自动运行 verify-installation.py | unit | `npm test -- tests/verification/runner.test.js` | ❌ Wave 0 |
| VER-02 | 显示通过/失败状态摘要 | unit | `npm test -- tests/verification/formatter.test.js` | ❌ Wave 0 |
| VER-03 | 显示具体问题和解决建议 | unit | `npm test -- tests/verification/index.test.js` | ❌ Wave 0 |
| VER-04 | 提供重新验证命令 | unit | `npm test -- tests/verification/index.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- tests/verification/<specific-file>.test.js`
- **Per wave merge:** `npm test` (运行所有测试)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/verification/index.test.js` — 集成测试,验证完整流程
- [ ] `installer/tests/verification/runner.test.js` — 测试 Python 脚本执行和错误处理
- [ ] `installer/tests/verification/parser.test.js` — 测试输出解析逻辑
- [ ] `installer/tests/verification/formatter.test.js` — 测试表格格式化
- [ ] Framework install: 无需安装,Jest 已在 Phase 14 安装

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- **execa GitHub Repository** - execa 执行模式和错误处理示例
  - https://github.com/sindresorhus/execa
  - 获取:基本执行、错误处理、超时配置、reject 选项
- **cli-table3 npm** - 表格格式化 API 和示例
  - https://www.npmjs.com/package/cli-table3
  - 获取:表格创建、列宽设置、颜色支持
- **commander.js GitHub** - CLI 选项添加模式
  - https://github.com/tj/commander.js
  - 获取:自定义选项、选项解析、帮助文本
- **Python 验证脚本** - 现有验证逻辑和输出格式
  - `plugins/claude-notify/scripts/verify-installation.py`
  - 获取:7 个检查项、输出格式、退出码

### Secondary (MEDIUM confidence)
- **Phase 15 检测器实现** - 表格格式化模式
  - `installer/src/detectors/index.js`
  - 验证:状态图标、颜色使用、表格结构
- **Phase 16 pip-installer** - execa 错误处理模式
  - `installer/src/installers/pip-installer.js`
  - 验证:try-catch、错误类型判断、用户友好错误消息
- **Phase 17 i18n 集成** - 双语支持模式
  - `installer/src/i18n/index.js`
  - 验证:翻译函数、参数替换、语言检测
- **Stack Overflow: execa timeout handling** - 超时和错误处理
  - https://stackoverflow.com/questions/60588884/nodejs-commander-how-to-identify-if-user-has-passed-un-supported-option
  - 验证:execa 错误类型、timedOut 属性

### Tertiary (LOW confidence)
- **WebSearch: Node.js regex parsing** - 正则表达式模式
  - 多个来源,未与官方文档交叉验证
  - 用途:输出解析正则表达式参考,需要在实现时验证
- **WebSearch: CLI table libraries** - 表格库选择
  - dev.to 文章对比 cli-table3 和替代方案
  - 用途:确认 cli-table3 是合适选择,信息已通过 npm 验证

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 所有库已安装(除 cli-table3),版本明确,项目已有使用经验
- Architecture: HIGH - 前序阶段已建立清晰模式(表格格式、i18n、execa 使用),直接复用
- Pitfalls: HIGH - 基于 execa 文档、前序阶段经验和常见 Node.js 陷阱总结

**Research date:** 2026-03-23
**Valid until:** 30 天 (2026-04-22) - 技术栈稳定,短期内不太可能有重大变化
