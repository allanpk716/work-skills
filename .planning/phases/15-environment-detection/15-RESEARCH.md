# Phase 15: Environment Detection - Research

**Researched:** 2026-03-20
**Domain:** Node.js CLI environment detection for Windows
**Confidence:** HIGH

## Summary

Phase 15 实现安装器的环境依赖检测功能。需要检测 Python 3.8+、Git、TortoiseGit/PuTTY 以及 Python requests 库的安装状态，并显示清晰的通过/失败状态报告。

**Primary recommendation:** 使用 execa 库执行命令行检测（Python/Git 版本），使用 winreg 库检测 TortoiseGit/PuTTY 的 Windows 注册表项，统一使用项目已有的 i18n 模式实现双语状态报告。

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENV-01 | 检测 Python 3.8+ 是否已安装 | execa 执行 `python --version`，解析输出 |
| ENV-02 | 检测 Git 是否已安装 | execa 执行 `git --version`，解析输出 |
| ENV-03 | 检测 TortoiseGit 或 PuTTY 是否已安装 | winreg 检测注册表 `HKLM\Software\TortoiseGit` 和 `HKCU\Software\SimonTatham\PuTTY` |
| ENV-04 | 检测 requests Python 库是否已安装 | execa 执行 `python -m pip show requests`，检查输出 |
| ENV-05 | 显示清晰的通过/失败状态和版本信息 | 使用 chalk 着色状态符号 [OK]/[FAIL]，版本号格式化 |
| ENV-06 | 缺少依赖时显示安装指导信息 | i18n 键存储指导文案，条件显示 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | 9.6.1 | 执行外部命令检测版本 | 已在 installer 中使用，改进的 Windows 支持，Promise API |
| winreg | 1.2.5 | Windows 注册表访问 | 检测 TortoiseGit/PuTTY 安装状态 |
| chalk | 4.1.2 | 终端着色 | 已在 installer 中使用，[OK]/[FAIL] 状态显示 |
| commander | 14.0.3 | CLI 参数解析 | 已在 installer 中使用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest | 30.3.0 | 单元测试 | 已配置在 installer 中 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execa | child_process | execa 提供更好的错误处理和 Windows 支持 |
| winreg | 直接执行 REG 命令 | winreg 提供更清晰的 API 和类型支持 |

**Installation:**
```bash
cd installer && npm install winreg
```

**Version verification:**
```
execa: 9.6.1 (npm view, 2026-03-20)
winreg: 1.2.5 (npm view, 2026-03-20)
chalk: 4.1.2 (已在 installer 中)
commander: 14.0.3 (已在 installer 中)
```

## Architecture Patterns

### Recommended Project Structure
```
installer/
├── src/
│   ├── detectors/           # 环境检测模块 (新增)
│   │   ├── index.js         # 统一导出和运行所有检测
│   │   ├── python.js        # Python 版本检测
│   │   ├── git.js           # Git 版本检测
│   │   ├── ssh-tools.js     # TortoiseGit/PuTTY 检测
│   │   └── pip-package.js   # Python pip 包检测
│   ├── i18n/
│   │   ├── en.json          # 添加检测相关翻译键
│   │   └── zh.json
│   └── index.js             # main() 中调用检测
├── tests/
│   └── detectors/           # 检测模块测试 (新增)
│       ├── python.test.js
│       ├── git.test.js
│       ├── ssh-tools.test.js
│       └── pip-package.test.js
```

### Pattern 1: 检测器模块模式
**What:** 每个检测项独立模块，返回统一结构
**When to use:** 所有环境检测
**Example:**
```javascript
// src/detectors/python.js
const { execa } = require('execa');

/**
 * Detect Python installation and version
 * @returns {Promise<{name: string, installed: boolean, version: string|null, message: string}>}
 */
async function detectPython() {
  try {
    const { stdout } = await execa('python', ['--version']);
    // stdout: "Python 3.11.0"
    const versionMatch = stdout.match(/Python (\d+\.\d+\.\d+)/i);
    const version = versionMatch ? versionMatch[1] : null;

    // Check minimum version (3.8+)
    const [major, minor] = version.split('.').map(Number);
    const meetsMinimum = major > 3 || (major === 3 && minor >= 8);

    return {
      name: 'Python',
      installed: true,
      version,
      meetsMinimum,
      message: meetsMinimum ? `Python ${version}` : `Python ${version} (need 3.8+)`
    };
  } catch (error) {
    return {
      name: 'Python',
      installed: false,
      version: null,
      meetsMinimum: false,
      message: 'Python not found in PATH'
    };
  }
}

module.exports = { detectPython };
```

### Pattern 2: 注册表检测模式
**What:** 使用 winreg 检测 Windows 应用安装
**When to use:** 检测 TortoiseGit、PuTTY
**Example:**
```javascript
// src/detectors/ssh-tools.js
const Registry = require('winreg');

/**
 * Check if TortoiseGit is installed via registry
 * @returns {Promise<{installed: boolean, path?: string}>}
 */
async function detectTortoiseGit() {
  return new Promise((resolve) => {
    const regKey = new Registry({
      hive: Registry.HKLM,
      key: '\\Software\\TortoiseGit'
    });

    regKey.valueExists('', (err, exists) => {
      if (err || !exists) {
        // Try 32-bit path on 64-bit Windows
        const regKey32 = new Registry({
          hive: Registry.HKLM,
          key: '\\Software\\Wow6432Node\\TortoiseGit'
        });
        regKey32.valueExists('', (err2, exists2) => {
          resolve({ installed: exists2 });
        });
      } else {
        resolve({ installed: true });
      }
    });
  });
}

/**
 * Check if PuTTY is installed via registry
 * @returns {Promise<{installed: boolean}>}
 */
async function detectPuTTY() {
  return new Promise((resolve) => {
    const regKey = new Registry({
      hive: Registry.HKCU,
      key: '\\Software\\SimonTatham\\PuTTY'
    });

    regKey.keyExists((err, exists) => {
      resolve({ installed: !err && exists });
    });
  });
}

/**
 * Check if any SSH tool (TortoiseGit or PuTTY) is installed
 */
async function detectSSHTools() {
  const [tortoiseGit, putty] = await Promise.all([
    detectTortoiseGit(),
    detectPuTTY()
  ]);

  return {
    name: 'SSH Tools',
    installed: tortoiseGit.installed || putty.installed,
    details: {
      tortoiseGit: tortoiseGit.installed,
      putty: putty.installed
    },
    message: tortoiseGit.installed ? 'TortoiseGit installed' :
            putty.installed ? 'PuTTY installed' :
            'Neither TortoiseGit nor PuTTY found'
  };
}

module.exports = { detectSSHTools, detectTortoiseGit, detectPuTTY };
```

### Pattern 3: 状态报告模式
**What:** 统一的检测结果输出格式
**When to use:** 显示检测报告
**Example:**
```javascript
// src/detectors/index.js
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Print detection result with status indicator
 */
function printResult(result) {
  const status = result.installed && result.meetsMinimum !== false;
  const symbol = status ? chalk.green('[OK]') : chalk.red('[FAIL]');
  const version = result.version ? ` (${result.version})` : '';

  console.log(`  ${symbol} ${result.name}${version}`);

  if (!status && result.guidance) {
    console.log(chalk.gray(`      -> ${t(result.guidance)}`));
  }
}

/**
 * Run all environment detectors
 */
async function runAllDetectors() {
  console.log('\n' + t('detection.checking') + '\n');

  const results = await Promise.all([
    detectPython(),
    detectGit(),
    detectSSHTools(),
    detectPipPackage('requests')
  ]);

  results.forEach(printResult);

  const failedCount = results.filter(r => !r.installed || r.meetsMinimum === false).length;

  console.log('\n' + t('detection.summary', { passed: results.length - failedCount, total: results.length }));

  return failedCount === 0;
}

module.exports = { runAllDetectors, printResult };
```

### Anti-Patterns to Avoid
- **不要同步检测**: 避免使用 `execSync`，使用 execa 的 Promise API
- **不要忽略错误**: execa 捕获命令失败时返回rejected promise，必须处理
- **不要硬编码消息**: 所有用户可见文本必须通过 i18n 系统

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 执行命令检测版本 | child_process.spawn | execa | 更好的 Windows 支持，自动错误处理 |
| 检测注册表 | 执行 REG 命令解析输出 | winreg | 类型安全的 API，避免解析问题 |
| 解析版本字符串 | 正则自己写 | 标准化解析函数 | 版本格式可能有变化 |

**Key insight:** Windows 环境检测涉及多种边缘情况（PATH 配置、32/64 位注册表路径），使用成熟的库可以避免常见陷阱。

## Common Pitfalls

### Pitfall 1: Python 命令名称不一致
**What goes wrong:** Windows 上可能是 `python` 或 `python3` 或 `py`
**Why it happens:** 不同的 Python 安装方式设置不同的命令
**How to avoid:** 依次尝试 `python --version`、`python3 --version`、`py --version`
**Warning signs:** 命令执行返回 ENOENT 错误

### Pitfall 2: 32/64 位注册表路径
**What goes wrong:** 在 64 位 Windows 上检测不到 32 位程序
**Why it happens:** 注册表重定向，32 位程序写入 Wow6432Node
**How to avoid:** 先检查标准路径，失败后检查 Wow6432Node 路径
**Warning signs:** 手动安装的程序检测不到

### Pitfall 3: Git 安装路径不在 PATH
**What goes wrong:** Git 已安装但命令执行失败
**Why it happens:** 安装时未选择 "Add to PATH" 选项
**How to avoid:** 提供安装指导，建议用户重新配置 PATH
**Warning signs:** 用户确认安装但检测失败

### Pitfall 4: pip 包检测的虚拟环境问题
**What goes wrong:** requests 库在虚拟环境中但全局检测失败
**Why it happens:** `python -m pip show` 检查当前 Python 环境
**How to avoid:** 使用与 Python 检测相同的 Python 解释器
**Warning signs:** 用户能运行 Python 脚本但检测显示库缺失

## Code Examples

### Python 版本检测（完整示例）
```javascript
// Source: execa docs + project patterns
const { execa } = require('execa');

async function detectPython() {
  const commands = ['python', 'python3', 'py'];

  for (const cmd of commands) {
    try {
      const { stdout } = await execa(cmd, ['--version'], { reject: false });
      if (stdout && stdout.includes('Python')) {
        const versionMatch = stdout.match(/Python (\d+\.\d+\.\d+)/i);
        if (versionMatch) {
          const version = versionMatch[1];
          const [major, minor] = version.split('.').map(Number);
          return {
            name: 'Python',
            command: cmd,
            installed: true,
            version,
            meetsMinimum: major > 3 || (major === 3 && minor >= 8)
          };
        }
      }
    } catch {
      // Try next command
    }
  }

  return {
    name: 'Python',
    command: null,
    installed: false,
    version: null,
    meetsMinimum: false
  };
}
```

### Git 版本检测
```javascript
// Source: execa docs
const { execa } = require('execa');

async function detectGit() {
  try {
    const { stdout } = await execa('git', ['--version']);
    // stdout: "git version 2.43.0.windows.1"
    const versionMatch = stdout.match(/git version (\d+\.\d+\.\d+)/i);
    const version = versionMatch ? versionMatch[1] : null;

    return {
      name: 'Git',
      installed: true,
      version,
      meetsMinimum: true // Any Git version is acceptable
    };
  } catch {
    return {
      name: 'Git',
      installed: false,
      version: null,
      meetsMinimum: false,
      guidance: 'guidance.installGit'
    };
  }
}
```

### pip 包检测
```javascript
// Source: pip docs
const { execa } = require('execa');

async function detectPipPackage(packageName, pythonCmd = 'python') {
  try {
    const { stdout } = await execa(pythonCmd, ['-m', 'pip', 'show', packageName]);

    // stdout contains: "Name: requests\nVersion: 2.31.0\n..."
    const nameMatch = stdout.match(/Name:\s*(.+)/i);
    const versionMatch = stdout.match(/Version:\s*(.+)/i);

    if (nameMatch) {
      return {
        name: packageName,
        installed: true,
        version: versionMatch ? versionMatch[1].trim() : 'unknown',
        meetsMinimum: true
      };
    }
  } catch {
    // Package not installed
  }

  return {
    name: packageName,
    installed: false,
    version: null,
    meetsMinimum: false,
    guidance: `guidance.install${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| child_process.exec | execa | installer 初始设计 | 更好的 Promise 支持、错误处理 |
| 硬编码错误消息 | i18n 翻译键 | Phase 14 | 双语支持 |
| 同步检测 | 并行 Promise.all | Phase 15 (推荐) | 更快的检测速度 |

**Deprecated/outdated:**
- `child_process.execSync`: 阻塞主线程，使用 execa 替代

## Open Questions

1. **是否需要检测特定的 Python 版本范围？**
   - What we know: Python 3.8+ 是最低要求
   - What's unclear: 是否有最高版本限制
   - Recommendation: 仅检测最低版本 3.8+

2. **TortoiseGit 和 PuTTY 是必需的还是可选的？**
   - What we know: 项目使用 TortoiseGit/Plink 进行 SSH 认证
   - What's unclear: 是否两者至少需要一个
   - Recommendation: 两者至少有一个即可通过检测，显示详细信息

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 |
| Config file | installer/jest.config.js |
| Quick run command | `cd installer && npm test -- --testPathPattern=detectors` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENV-01 | Python 3.8+ 检测 | unit | `npm test -- python.test.js` | Wave 0 |
| ENV-02 | Git 检测 | unit | `npm test -- git.test.js` | Wave 0 |
| ENV-03 | TortoiseGit/PuTTY 检测 | unit | `npm test -- ssh-tools.test.js` | Wave 0 |
| ENV-04 | requests 库检测 | unit | `npm test -- pip-package.test.js` | Wave 0 |
| ENV-05 | 状态报告显示 | unit | `npm test -- index.test.js` | Wave 0 |
| ENV-06 | 安装指导显示 | unit | `npm test -- index.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd installer && npm test -- --testPathPattern=<module>`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/detectors/python.test.js` - covers ENV-01
- [ ] `installer/tests/detectors/git.test.js` - covers ENV-02
- [ ] `installer/tests/detectors/ssh-tools.test.js` - covers ENV-03
- [ ] `installer/tests/detectors/pip-package.test.js` - covers ENV-04
- [ ] i18n keys for detection messages in en.json/zh.json

## Sources

### Primary (HIGH confidence)
- [execa npm page](https://www.npmjs.com/package/execa) - API documentation, version 9.6.1
- [winreg npm page](https://www.npmjs.com/package/winreg) - Registry access API, version 1.2.5
- [installer/src/index.js] - Project architecture (main entry point pattern)
- [installer/src/i18n/index.js] - Project i18n pattern

### Secondary (MEDIUM confidence)
- [installer/src/platform.js] - Platform detection pattern reference
- [plugins/claude-notify/scripts/verify-installation.py] - Existing Python version detection pattern
- [TortoiseGit Documentation](https://tortoisegit.org/docs/releasenews/) - Registry information

### Tertiary (LOW confidence)
- WebSearch for TortoiseGit/PuTTY registry keys - verified with npm docs pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Packages verified on npm, existing project patterns
- Architecture: HIGH - Based on existing installer structure and Node.js best practices
- Pitfalls: MEDIUM - Common Windows development issues, may need real-world testing

**Research date:** 2026-03-20
**Valid until:** 30 days (stable npm packages, Windows registry paths are stable)
