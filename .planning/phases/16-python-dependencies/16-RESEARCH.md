# Phase 16: Python Dependencies - Research

**Researched:** 2026-03-20
**Domain:** Node.js CLI Python dependency installation via pip
**Confidence:** HIGH

## Summary

Phase 16 实现安装器的 Python 依赖自动安装功能。当 Phase 15 检测到缺失的 Python 库时,本阶段提供交互式选项让用户选择是否自动安装,使用 pip 执行安装,并提供清晰的错误处理和解决建议。

**Primary recommendation:** 使用 enquirer 库(而非 @inquirer/prompts)提供交互式确认提示,因为它支持 CommonJS 的 require() 语法;复用已有的 execa 库执行 pip install 命令;通过 stderr 输出和退出码检测 pip 安装错误类型;所有用户可见文本通过 i18n 系统翻译。

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPS-01 | 提供自动安装缺失 Python 库的选项 | enquirer Confirm prompt 提供用户确认交互 |
| DEPS-02 | 使用 pip 安装 requests 库 (如缺失) | execa 执行 `python -m pip install requests --user` |
| DEPS-03 | 安装失败时显示错误信息和解决建议 | 解析 pip stderr 和退出码,映射到 i18n 错误消息 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | 5.1.1 (已安装) | 执行 pip 命令 | 已在 installer 中使用,Windows 支持好,Promise API |
| enquirer | 2.4.1 | 交互式确认提示 | 支持 CommonJS require,轻量(~4ms 加载),Confirm prompt |
| chalk | 4.1.2 (已安装) | 错误消息着色 | 已在 installer 中使用,红色高亮错误 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest | 30.3.0 (已安装) | 单元测试 | 测试安装逻辑和错误处理 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| enquirer | @inquirer/prompts | @inquirer/prompts 是纯 ES Module,不支持 CommonJS require() |
| enquirer | inquirer legacy | inquirer v9+ 同样是 ESM,旧版不再积极维护 |
| execa | child_process.spawn | execa 提供更好的 Windows 支持和自动错误处理 |

**Installation:**
```bash
cd installer && npm install enquirer
```

**Version verification:**
```
execa: 5.1.1 (installer package.json)
enquirer: 2.4.1 (npm view, 2026-03-20)
chalk: 4.1.2 (installer package.json)
```

## Architecture Patterns

### Recommended Project Structure
```
installer/
├── src/
│   ├── installers/           # 依赖安装模块 (新增)
│   │   ├── index.js          # 统一导出和运行安装流程
│   │   └── pip-installer.js  # pip 包安装器
│   ├── detectors/            # Phase 15 已实现
│   ├── i18n/
│   │   ├── en.json           # 添加安装相关翻译键
│   │   └── zh.json
│   └── index.js              # main() 中调用安装流程
├── tests/
│   └── installers/           # 安装模块测试 (新增)
│       └── pip-installer.test.js
```

### Pattern 1: 安装器模块模式
**What:** 封装 pip 安装逻辑,返回统一结果结构
**When to use:** 所有 Python 包安装
**Example:**
```javascript
// src/installers/pip-installer.js
const { execa } = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Install a Python package using pip
 * @param {string} packageName - Name of the package to install
 * @param {string} pythonCmd - Python command to use (default: 'python')
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
async function installPipPackage(packageName, pythonCmd = 'python') {
  try {
    // Use --user flag to avoid permission issues on Windows
    const { stdout, stderr } = await execa(pythonCmd, [
      '-m', 'pip', 'install', packageName, '--user'
    ]);

    return {
      success: true,
      message: t('install.success', { package: packageName }),
      output: stdout
    };
  } catch (error) {
    // Parse error type from stderr
    const errorMessage = error.stderr || error.message;
    let errorType = 'unknown';

    if (errorMessage.includes('Permission denied') || errorMessage.includes('Access is denied')) {
      errorType = 'permission';
    } else if (errorMessage.includes('network') || errorMessage.includes('Connection refused')) {
      errorType = 'network';
    } else if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
      errorType = 'pipNotFound';
    }

    return {
      success: false,
      message: t('install.failed', { package: packageName }),
      error: errorType,
      errorDetails: errorMessage
    };
  }
}

/**
 * Get suggested solution based on error type
 * @param {string} errorType - Type of error from pip
 * @returns {string} i18n key for solution
 */
function getErrorGuidance(errorType) {
  const guidanceMap = {
    permission: 'guidance.installPermission',
    network: 'guidance.installNetwork',
    pipNotFound: 'guidance.installPipNotFound',
    unknown: 'guidance.installUnknown'
  };
  return guidanceMap[errorType] || guidanceMap.unknown;
}

module.exports = { installPipPackage, getErrorGuidance };
```

### Pattern 2: 交互式确认模式
**What:** 使用 enquirer Confirm prompt 询问用户是否安装
**When to use:** 检测到缺失依赖后
**Example:**
```javascript
// src/installers/index.js
const { Confirm } = require('enquirer');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { installPipPackage, getErrorGuidance } = require('./pip-installer.js');

/**
 * Prompt user to install missing Python packages
 * @param {Array<{name: string, installed: boolean}>} missingPackages
 * @param {string} pythonCmd - Python command from detection
 * @returns {Promise<{installed: string[], failed: string[], skipped: string[]}>}
 */
async function promptAndInstall(missingPackages, pythonCmd = 'python') {
  const results = { installed: [], failed: [], skipped: [] };

  // Filter only missing packages
  const toInstall = missingPackages.filter(p => !p.installed);

  if (toInstall.length === 0) {
    return results;
  }

  console.log(chalk.yellow('\n' + t('install.missingFound', { count: toInstall.length })));
  toInstall.forEach(p => console.log(chalk.gray(`  - ${p.name}`)));

  for (const pkg of toInstall) {
    const prompt = new Confirm({
      name: 'install',
      message: t('install.promptInstall', { package: pkg.name }),
      initial: true
    });

    const shouldInstall = await prompt.run();

    if (shouldInstall) {
      console.log(chalk.gray(t('install.installing', { package: pkg.name })));
      const result = await installPipPackage(pkg.name, pythonCmd);

      if (result.success) {
        console.log(chalk.green(`  [OK] ${result.message}`));
        results.installed.push(pkg.name);
      } else {
        console.log(chalk.red(`  [FAIL] ${result.message}`));
        console.log(chalk.gray(`      -> ${t(getErrorGuidance(result.error))}`));
        results.failed.push(pkg.name);
      }
    } else {
      results.skipped.push(pkg.name);
    }
  }

  return results;
}

/**
 * Main installer entry point - call after detection
 * @param {Array} detectionResults - Results from runAllDetectors()
 */
async function runInstaller(detectionResults) {
  const pythonResult = detectionResults.find(r => r.name === 'Python');
  const pythonCmd = pythonResult?.command || 'python';

  return promptAndInstall(detectionResults, pythonCmd);
}

module.exports = { runInstaller, promptAndInstall };
```

### Pattern 3: 主流程集成模式
**What:** 在 main() 中集成安装流程
**When to use:** 检测完成后
**Example:**
```javascript
// src/index.js
const { runAllDetectors } = require('./detectors/index.js');
const { runInstaller } = require('./installers/index.js');

async function main() {
  // ... existing code ...

  // Step 4: Run environment detection
  const { results, allPassed } = await runAllDetectors();

  // Step 5: Offer to install missing dependencies
  if (!allPassed) {
    const installResults = await runInstaller(results);

    console.log('\n' + t('install.summary'));
    console.log(chalk.green(`  ${t('install.installed')}: ${installResults.installed.length}`));
    console.log(chalk.red(`  ${t('install.failed')}: ${installResults.failed.length}`));
    console.log(chalk.gray(`  ${t('install.skipped')}: ${installResults.skipped.length}`));
  }

  // Step 6: More features will be added in later phases...
}
```

### Anti-Patterns to Avoid
- **不要使用 @inquirer/prompts**: 它是纯 ES Module,不支持 CommonJS require()
- **不要省略 --user 标志**: Windows 上可能导致权限问题
- **不要忽略 stderr**: pip 的错误信息在 stderr 中,不在 stdout
- **不要硬编码错误消息**: 所有错误提示必须通过 i18n 系统

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 交互式确认 | readline 自己实现 | enquirer Confirm | 成熟的 UI,键盘支持,样式美观 |
| 解析 pip 输出 | 复杂正则匹配 | 检查 stderr 关键词 | pip 输出格式可能变化 |
| 错误分类 | 基于 exit code | stderr 内容匹配 | pip exit code 不够精确 |

**Key insight:** pip 的错误信息在 stderr 中,使用 --user 标志可以避免大多数 Windows 权限问题。

## Common Pitfalls

### Pitfall 1: 使用 ESM-only 包
**What goes wrong:** `require('@inquirer/prompts')` 抛出 ERR_REQUIRE_ESM 错误
**Why it happens:** @inquirer/prompts 和 inquirer v9+ 是纯 ES Module
**How to avoid:** 使用 enquirer (支持 CommonJS) 或动态 import()
**Warning signs:** 安装时报错 "require() of ES Module not supported"

### Pitfall 2: 忽略 --user 标志
**What goes wrong:** Windows 上 pip install 报 "Access is denied"
**Why it happens:** 默认安装到系统目录需要管理员权限
**How to avoid:** 始终使用 `pip install --user` 安装到用户目录
**Warning signs:** 安装失败,stderr 包含 "Permission denied" 或 "Access is denied"

### Pitfall 3: 使用错误的 Python 命令
**What goes wrong:** Python 已安装但 pip 命令失败
**Why it happens:** Windows 上可能是 python、python3 或 py
**How to avoid:** 复用 Phase 15 检测到的 pythonCmd
**Warning signs:** ENOENT 错误或 "python not found"

### Pitfall 4: 忽略网络错误
**What goes wrong:** 用户网络问题导致安装失败
**Why it happens:** pip 需要从 PyPI 下载包
**How to avoid:** 检测 stderr 中的 "network" 或 "Connection" 关键词,提示检查网络
**Warning signs:** stderr 包含 "Connection refused" 或 "network is unreachable"

## Code Examples

### enquirer Confirm 基本用法
```javascript
// Source: npmjs.com/package/enquirer
const { Confirm } = require('enquirer');

const prompt = new Confirm({
  name: 'question',
  message: 'Did you like enquirer?'
});

prompt.run()
  .then(answer => console.log('Answer:', answer))
  .catch(console.error);
```

### pip 安装错误处理
```javascript
// Source: execa docs + pip patterns
const { execa } = require('execa');

async function installWithErrorHandling(packageName) {
  try {
    const result = await execa('python', ['-m', 'pip', 'install', packageName, '--user']);
    return { success: true, stdout: result.stdout };
  } catch (error) {
    // pip errors are in stderr
    const stderr = error.stderr || '';

    if (stderr.includes('Permission denied') || stderr.includes('Access is denied')) {
      return {
        success: false,
        error: 'permission',
        guidance: 'Try running as administrator or use --user flag'
      };
    }

    if (stderr.includes('network') || stderr.includes('Connection')) {
      return {
        success: false,
        error: 'network',
        guidance: 'Check your internet connection and try again'
      };
    }

    return {
      success: false,
      error: 'unknown',
      guidance: stderr.split('\n').slice(0, 3).join('\n')
    };
  }
}
```

### i18n 翻译键结构
```json
// Source: project pattern
// en.json additions
{
  "install.missingFound": "Found {count} missing Python package(s):",
  "install.promptInstall": "Install {package}?",
  "install.installing": "Installing {package}...",
  "install.success": "{package} installed successfully",
  "install.failed": "Failed to install {package}",
  "install.summary": "Installation Summary:",
  "install.installed": "Installed",
  "install.failed": "Failed",
  "install.skipped": "Skipped",
  "guidance.installPermission": "Run Command Prompt as Administrator, or use: pip install {package} --user",
  "guidance.installNetwork": "Check your internet connection and try again",
  "guidance.installPipNotFound": "pip not found. Reinstall Python with pip included",
  "guidance.installUnknown": "Manual install: pip install {package}"
}

// zh.json additions
{
  "install.missingFound": "发现 {count} 个缺失的 Python 包:",
  "install.promptInstall": "是否安装 {package}?",
  "install.installing": "正在安装 {package}...",
  "install.success": "{package} 安装成功",
  "install.failed": "{package} 安装失败",
  "install.summary": "安装摘要:",
  "install.installed": "已安装",
  "install.skipped": "已跳过",
  "guidance.installPermission": "以管理员身份运行命令提示符,或使用: pip install {package} --user",
  "guidance.installNetwork": "请检查网络连接后重试",
  "guidance.installPipNotFound": "pip 未找到。请重新安装包含 pip 的 Python",
  "guidance.installUnknown": "手动安装: pip install {package}"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| inquirer v8 (CommonJS) | enquirer | Phase 16 | 避免 ESM 兼容性问题 |
| 硬编码安装命令 | --user 标志 | Phase 16 | 避免权限问题 |
| 仅检测不安装 | 检测后交互安装 | Phase 16 | 完整的用户体验 |

**Deprecated/outdated:**
- `inquirer` v9+: 纯 ESM,不支持 CommonJS require()
- `@inquirer/prompts`: 纯 ESM,需要动态 import 或转换项目为 ESM

## Open Questions

1. **是否需要支持批量安装所有缺失包?**
   - What we know: 当前设计是逐个询问
   - What's unclear: 用户是否希望有"全部安装"选项
   - Recommendation: 初始版本逐个询问,后续可添加"全部安装"选项

2. **是否需要支持自定义 pip 源?**
   - What we know: 中国用户可能需要使用镜像源
   - What's unclear: 是否在本阶段实现
   - Recommendation: 记录为未来功能,不在 Phase 16 实现

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 |
| Config file | installer/jest.config.js |
| Quick run command | `cd installer && npm test -- --testPathPattern=installers` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPS-01 | 用户确认安装提示 | unit | `npm test -- pip-installer.test.js` | Wave 0 |
| DEPS-02 | pip 安装命令执行 | unit | `npm test -- pip-installer.test.js` | Wave 0 |
| DEPS-03 | 错误处理和指导 | unit | `npm test -- pip-installer.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd installer && npm test -- --testPathPattern=installers`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/installers/pip-installer.test.js` - covers DEPS-01, DEPS-02, DEPS-03
- [ ] `installer/src/installers/index.js` - installer module entry
- [ ] `installer/src/installers/pip-installer.js` - pip installation logic
- [ ] i18n keys for install messages in en.json/zh.json

## Sources

### Primary (HIGH confidence)
- [enquirer npm page](https://www.npmjs.com/package/enquirer) - CommonJS support, Confirm prompt API, version 2.4.1
- [execa npm page](https://www.npmjs.com/package/execa) - Command execution, error handling, version 5.1.1
- [installer/src/detectors/index.js] - Project detection pattern reference
- [installer/src/i18n/index.js] - Project i18n pattern

### Secondary (MEDIUM confidence)
- [Stack Overflow: pip install access denied on Windows](https://stackoverflow.com/questions/31172719/pip-install-access-denied-on-windows) - Common Windows pip errors
- [installer/src/detectors/pip-package.js] - Existing pip package detection pattern
- [installer/tests/detectors/pip-package.test.js] - Existing test patterns

### Tertiary (LOW confidence)
- WebSearch for pip error codes - verified with Stack Overflow

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - enquirer supports CommonJS, execa already installed, patterns verified
- Architecture: HIGH - Based on existing installer structure and Phase 15 patterns
- Pitfalls: HIGH - Well-documented pip issues on Windows, ESM compatibility verified

**Research date:** 2026-03-20
**Valid until:** 30 days (stable npm packages, Windows pip behavior is stable)
