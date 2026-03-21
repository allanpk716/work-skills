# Phase 17: Interactive Configuration - Research

**Researched:** 2026-03-21
**Domain:** Node.js CLI interactive configuration, Windows environment variables, Git configuration, Pushover API validation
**Confidence:** HIGH

## Summary

Phase 17 实现安装器的交互式配置引导功能,检测和配置 Pushover 通知凭证、Git SSH 设置和 Git 用户信息。用户通过 enquirer 交互式提示输入配置,使用 setx 命令持久化环境变量,使用 git config 命令设置 Git 全局配置,通过 Pushover API 验证凭证有效性。

**Primary recommendation:** 使用 enquirer 的 Input 和 Confirm prompts 提供交互式输入;使用 execa 执行 setx、git config 和 curl 命令;通过 Pushover 的 /users/validate.json API 端点验证凭证;所有用户可见文本通过 i18n 系统翻译;使用彩色表格格式显示配置摘要。

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Pushover 配置流程

**环境变量检测:**
- 检测当前会话的环境变量(使用 process.env)
- 不检测注册表,因为 setx 设置的环境变量需要重启终端才能生效

**交互式输入:**
- 使用两个单独的 enquirer 提示分别输入 PUSHOVER_TOKEN 和 PUSHOVER_USER
- 每个提示独立,更清晰易懂

**持久化保存:**
- 使用 setx 命令将凭证写入系统环境变量(用户级)
- 设置后提示用户需要重启终端才能生效

**配置验证:**
- 配置完成后立即调用 Pushover API 验证凭证有效性
- 验证成功:显示成功消息,继续下一步
- 验证失败:显示详细错误(invalid token/user),允许重新输入

**已配置处理:**
- 检测到环境变量已存在时,显示已配置状态
- 询问用户是否重新配置(Yes/No)
- 选择 No 则跳过,选择 Yes 则引导重新输入

**跳过策略:**
- Pushover 是可选功能,允许用户跳过配置
- 跳过时显示提示:可以稍后手动配置环境变量

#### Git SSH 检测和引导

**SSH 配置检测:**
- 使用 `git config --get core.sshCommand` 检测 Git SSH 配置
- 检测全局或当前仓库的配置

**未配置处理:**
- 检测到 SSH 未配置时,显示手动配置指导(不自动执行)
- 指导内容:列出关键步骤(如安装 TortoiseGit、配置 Pageant),提供文档链接
- 使用简化指导格式,避免过度详细

**跳过策略:**
- SSH 配置是可选的,允许用户跳过(用户可能使用 HTTPS)
- 跳过时不影响后续流程

#### Git 用户信息检测

**检测方法:**
- 使用 `git config --get user.name` 和 `git config --get user.email` 检测
- 检测全局配置(--global)

**配置方式:**
- 配置到全局范围(`git config --global`),所有仓库通用

**必填性:**
- Git 提交需要用户信息,属于必需配置
- 不允许跳过(强制配置)

**未配置处理:**
- 检测到未配置时,使用 enquirer 交互式引导输入
- 两个单独提示:先输入 user.name,再输入 user.email
- 使用 `git config --global` 命令设置

#### 配置失败处理和重试策略

**重试次数:**
- 每个配置项失败时最多重试 3 次
- 超过 3 次后显示错误并继续下一步(不停止整个安装)

**错误反馈:**
- 显示详细错误信息,包括错误类型和具体原因
- 例如:权限不足、网络错误、API 验证失败等
- 使用红色(chalk.red)高亮错误信息

**setx 失败处理:**
- 如果 setx 命令执行失败(如权限不足),提示用户手动设置环境变量
- 显示具体的 setx 命令示例,用户可以手动执行
- 继续下一步,不停止安装流程

**配置摘要:**
- 配置流程结束后显示配置摘要表格
- 包含所有配置项的状态:已配置/跳过/失败
- 使用彩色输出区分状态(绿色=成功,黄色=跳过,红色=失败)

### Claude's Discretion

- enquirer 提示的具体消息文本和格式
- 配置指导文档的链接(如项目有文档站点)
- 错误消息的具体措辞
- 配置摘要的表格样式和颜色方案
- 是否支持批量配置(一次输入多项)vs 逐项配置

### Deferred Ideas (OUT OF SCOPE)

- 自动配置 SSH 密钥和 Pageant — 超出安装器职责,需要用户手动操作
- 检测 SSH 密钥是否已添加到 Pageant — 需要调用 Windows API,复杂度高
- 自动测试 SSH 连接(git@github.com)— 需要网络操作,可能超时
- 配置文件导出/导入 — 属于高级功能(INST-ADV-02),未来版本考虑
- 批量配置模式(一次输入所有信息)— 交互式流程逐项配置已足够
- 配置回滚功能 — 可以作为未来增强,当前版本仅记录配置状态

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-01 | 检测 PUSHOVER_TOKEN 环境变量是否已设置 | process.env.PUSHOVER_TOKEN 检测 |
| CONF-02 | 检测 PUSHOVER_USER 环境变量是否已设置 | process.env.PUSHOVER_USER 检测 |
| CONF-03 | Pushover 未配置时提供交互式引导输入(可选跳过) | enquirer Input prompt + Confirm skip |
| CONF-04 | 引导用户将 Pushover 配置写入系统环境变量(setx) | execa('setx', ['PUSHOVER_TOKEN', value]) |
| CONF-05 | 检测 Git SSH 配置(core.sshCommand) | execa('git', ['config', '--get', 'core.sshCommand']) |
| CONF-06 | Git SSH 未配置时提供配置引导 | 显示手动配置指导文本 + 文档链接 |
| CONF-07 | 检测 Git 用户信息(user.name, user.email) | execa('git', ['config', '--global', '--get', 'user.name']) |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | 5.1.1 (已安装) | 执行 setx, git config, curl 命令 | 已在 installer 中使用,Windows 支持好,Promise API |
| enquirer | 2.4.1 (已安装) | 交互式输入提示 | 支持 CommonJS require,Input 和 Confirm prompts |
| chalk | 4.1.2 (已安装) | 错误消息和配置摘要着色 | 已在 installer 中使用,支持多种颜色 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest | 30.3.0 (已安装) | 单元测试 | 测试配置逻辑和 API 验证 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execa + curl | node-fetch/axios | execa + curl 无需额外依赖,简单验证足够 |
| enquirer | @inquirer/prompts | @inquirer/prompts 是纯 ES Module,不支持 CommonJS require() |
| setx | winreg 写注册表 | setx 更简单,用户级环境变量足够 |

**Installation:**
无需安装新依赖,所有库已在 installer/package.json 中。

**Version verification:**
```
execa: 5.1.1 (installer package.json)
enquirer: 2.4.1 (installer package.json)
chalk: 4.1.2 (installer package.json)
```

## Architecture Patterns

### Recommended Project Structure
```
installer/
├── src/
│   ├── configurators/          # 配置器模块 (新增)
│   │   ├── index.js           # 统一导出和运行配置流程
│   │   ├── pushover.js        # Pushover 凭证配置
│   │   ├── git-ssh.js         # Git SSH 检测和引导
│   │   └── git-user.js        # Git 用户信息配置
│   ├── detectors/             # Phase 15 已实现
│   ├── installers/            # Phase 16 已实现
│   ├── i18n/
│   │   ├── en.json            # 添加配置相关翻译键
│   │   └── zh.json
│   └── index.js               # main() 中调用配置流程
├── tests/
│   └── configurators/          # 配置模块测试 (新增)
│       ├── pushover.test.js
│       ├── git-ssh.test.js
│       └── git-user.test.js
```

### Pattern 1: 配置器模块模式
**What:** 封装配置逻辑,返回统一结果结构,包含重试机制
**When to use:** 所有配置项(Pushover, Git SSH, Git user)
**Example:**
```javascript
// src/configurators/pushover.js
const { Input, Confirm } = require('enquirer');
const { execa } = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Detect Pushover environment variables
 * @returns {{token: string|null, user: string|null}}
 */
function detectPushoverEnv() {
  return {
    token: process.env.PUSHOVER_TOKEN || null,
    user: process.env.PUSHOVER_USER || null
  };
}

/**
 * Set environment variable using setx
 * @param {string} name - Variable name
 * @param {string} value - Variable value
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function setEnvVariable(name, value) {
  try {
    await execa('setx', [name, value]);
    return { success: true };
  } catch (error) {
    const stderr = error.stderr || error.message || '';
    let errorType = 'unknown';

    if (stderr.includes('Access is denied') || stderr.includes('Permission denied')) {
      errorType = 'permission';
    }

    return {
      success: false,
      error: errorType,
      errorDetails: stderr
    };
  }
}

/**
 * Validate Pushover credentials using API
 * @param {string} token - Application token
 * @param {string} user - User key
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validatePushoverCredentials(token, user) {
  try {
    // Use curl to call Pushover validation API
    const { stdout } = await execa('curl', [
      '-s',
      '-X', 'POST',
      'https://api.pushover.net/1/users/validate.json',
      '-d', `token=${token}`,
      '-d', `user=${user}`
    ]);

    const response = JSON.parse(stdout);

    if (response.status === 1) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: response.errors ? response.errors.join(', ') : 'Invalid credentials'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Network error or API unreachable'
    };
  }
}

/**
 * Configure Pushover credentials with interactive prompts
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<{status: 'configured'|'skipped'|'failed', details?: string}>}
 */
async function configurePushover(maxRetries = 3) {
  const currentEnv = detectPushoverEnv();

  // If already configured, ask if user wants to reconfigure
  if (currentEnv.token && currentEnv.user) {
    console.log(chalk.green(t('pushover.alreadyConfigured')));
    console.log(chalk.gray(`  PUSHOVER_TOKEN: ${currentEnv.token.substring(0, 8)}...`));
    console.log(chalk.gray(`  PUSHOVER_USER: ${currentEnv.user.substring(0, 8)}...`));

    const reconfigurePrompt = new Confirm({
      name: 'reconfigure',
      message: t('pushover.promptReconfigure'),
      initial: false
    });

    const shouldReconfigure = await reconfigurePrompt.run();
    if (!shouldReconfigure) {
      return { status: 'configured', details: 'already set' };
    }
  }

  // Ask if user wants to configure Pushover (optional feature)
  const skipPrompt = new Confirm({
    name: 'skip',
    message: t('pushover.promptConfigure'),
    initial: true
  });

  const shouldConfigure = await skipPrompt.run();
  if (!shouldConfigure) {
    console.log(chalk.yellow(t('pushover.skipped')));
    return { status: 'skipped', details: 'user skipped' };
  }

  // Retry loop
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Prompt for token
    const tokenPrompt = new Input({
      name: 'token',
      message: t('pushover.promptToken')
    });
    const token = await tokenPrompt.run();

    // Prompt for user
    const userPrompt = new Input({
      name: 'user',
      message: t('pushover.promptUser')
    });
    const user = await userPrompt.run();

    // Validate credentials
    console.log(chalk.gray(t('pushover.validating')));
    const validation = await validatePushoverCredentials(token, user);

    if (!validation.valid) {
      console.log(chalk.red(t('pushover.validationFailed')));
      console.log(chalk.red(`  ${validation.error}`));

      if (attempt < maxRetries) {
        console.log(chalk.yellow(t('pushover.retryPrompt', { attempt, max: maxRetries })));
        continue;
      } else {
        return { status: 'failed', details: validation.error };
      }
    }

    // Save to environment variables
    console.log(chalk.gray(t('pushover.saving')));
    const tokenResult = await setEnvVariable('PUSHOVER_TOKEN', token);
    const userResult = await setEnvVariable('PUSHOVER_USER', user);

    if (!tokenResult.success || !userResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed' };
    }

    console.log(chalk.green(t('pushover.configured')));
    console.log(chalk.yellow(t('pushover.restartReminder')));
    return { status: 'configured', details: 'validated and saved' };
  }

  return { status: 'failed', details: 'max retries exceeded' };
}

module.exports = {
  detectPushoverEnv,
  setEnvVariable,
  validatePushoverCredentials,
  configurePushover
};
```

### Pattern 2: Git 配置器模式
**What:** 检测和配置 Git 设置,使用 git config 命令
**When to use:** Git SSH 和 Git user.info 配置
**Example:**
```javascript
// src/configurators/git-user.js
const { Input } = require('enquirer');
const { execa } = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Detect Git user.name and user.email
 * @returns {Promise<{name: string|null, email: string|null}>}
 */
async function detectGitUser() {
  try {
    const { stdout: name } = await execa('git', ['config', '--global', '--get', 'user.name'], { reject: false });
    const { stdout: email } = await execa('git', ['config', '--global', '--get', 'user.email'], { reject: false });

    return {
      name: name || null,
      email: email || null
    };
  } catch {
    return { name: null, email: null };
  }
}

/**
 * Configure Git user information (required, cannot skip)
 * @returns {Promise<{status: 'configured'|'failed', name?: string, email?: string}>}
 */
async function configureGitUser() {
  const current = await detectGitUser();

  // If already configured, show and return
  if (current.name && current.email) {
    console.log(chalk.green(t('gitUser.alreadyConfigured')));
    console.log(chalk.gray(`  user.name: ${current.name}`));
    console.log(chalk.gray(`  user.email: ${current.email}`));
    return { status: 'configured', name: current.name, email: current.email };
  }

  // Prompt for user.name (required)
  console.log(chalk.yellow(t('gitUser.required')));
  const namePrompt = new Input({
    name: 'userName',
    message: t('gitUser.promptName')
  });
  const userName = await namePrompt.run();

  // Prompt for user.email (required)
  const emailPrompt = new Input({
    name: 'userEmail',
    message: t('gitUser.promptEmail')
  });
  const userEmail = await emailPrompt.run();

  // Set Git config
  try {
    await execa('git', ['config', '--global', 'user.name', userName]);
    await execa('git', ['config', '--global', 'user.email', userEmail]);

    console.log(chalk.green(t('gitUser.configured')));
    return { status: 'configured', name: userName, email: userEmail };
  } catch (error) {
    console.log(chalk.red(t('gitUser.failed')));
    console.log(chalk.gray(error.message));
    return { status: 'failed' };
  }
}

module.exports = {
  detectGitUser,
  configureGitUser
};
```

### Pattern 3: 配置摘要表格
**What:** 显示所有配置项的状态摘要
**When to use:** 配置流程结束后
**Example:**
```javascript
// src/configurators/index.js
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Display configuration summary table
 * @param {Array<{name: string, status: string, details?: string}>} results
 */
function displayConfigSummary(results) {
  console.log('\n' + chalk.bold(t('config.summary')));
  console.log(chalk.gray('─'.repeat(60)));

  results.forEach(result => {
    let statusIcon, statusColor;

    switch (result.status) {
      case 'configured':
        statusIcon = '✓';
        statusColor = chalk.green;
        break;
      case 'skipped':
        statusIcon = '⊘';
        statusColor = chalk.yellow;
        break;
      case 'failed':
        statusIcon = '✗';
        statusColor = chalk.red;
        break;
      default:
        statusIcon = '?';
        statusColor = chalk.gray;
    }

    const statusText = t(`config.status.${result.status}`);
    console.log(`${statusColor(statusIcon)} ${result.name.padEnd(20)} ${statusColor(statusText)} ${chalk.gray(result.details || '')}`);
  });

  console.log(chalk.gray('─'.repeat(60)));
}

/**
 * Run all configurators in sequence
 * @returns {Promise<void>}
 */
async function runAllConfigurators() {
  const results = [];

  // 1. Pushover (optional)
  console.log(chalk.bold('\n' + t('config.section.pushover')));
  const pushoverResult = await configurePushover();
  results.push({ name: 'Pushover', status: pushoverResult.status, details: pushoverResult.details });

  // 2. Git SSH (optional)
  console.log(chalk.bold('\n' + t('config.section.gitSSH')));
  const sshResult = await configureGitSSH();
  results.push({ name: 'Git SSH', status: sshResult.status, details: sshResult.details });

  // 3. Git user.info (required)
  console.log(chalk.bold('\n' + t('config.section.gitUser')));
  const userResult = await configureGitUser();
  results.push(
    { name: 'Git user.name', status: userResult.status, details: userResult.name },
    { name: 'Git user.email', status: userResult.status, details: userResult.email }
  );

  // Display summary
  displayConfigSummary(results);
}

module.exports = {
  runAllConfigurators,
  displayConfigSummary
};
```

### Pattern 4: 主流程集成
**What:** 在 main() 中集成配置流程
**When to use:** 依赖安装完成后
**Example:**
```javascript
// src/index.js
const { runAllDetectors } = require('./detectors/index.js');
const { runInstaller } = require('./installers/index.js');
const { runAllConfigurators } = require('./configurators/index.js');

async function main() {
  // ... existing code ...

  // Step 5: Offer to install missing dependencies
  if (!allPassed) {
    const pipResults = results.filter(r =>
      r.name && r.name !== 'Python' && r.name !== 'Git' &&
      !r.name.includes('TortoiseGit') && !r.name.includes('PuTTY') && !r.name.includes('SSH')
    );

    if (pipResults.some(r => !r.installed)) {
      await runInstaller(results);
    }
  }

  // Step 6: Interactive configuration (Phase 17)
  await runAllConfigurators();

  // Step 7: More features will be added in later phases
  // - Marketplace integration (Phase 18)
  // - Installation verification (Phase 19)
}
```

### Anti-Patterns to Avoid
- **不要使用 @inquirer/prompts**: 它是纯 ES Module,不支持 CommonJS require()
- **不要忘记验证 Pushover 凭证**: 无效凭证会导致后续通知失败
- **不要硬编码文档链接**: 使用 i18n 系统管理链接,支持中英文
- **不要允许跳过 Git user.info**: Git 提交必需,必须配置

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 交互式输入 | readline 自己实现 | enquirer Input/Confirm | 成熟的 UI,键盘支持,样式美观 |
| Pushover API 验证 | 自己构造 HTTP 请求 | curl + execa | 简单验证,curl 无需额外依赖 |
| 环境变量持久化 | 直接写注册表 | setx 命令 | Windows 官方方法,简单可靠 |
| Git 配置检测 | 解析 git config 输出 | execa + --get 参数 | Git 命令自动处理格式化 |

**Key insight:** setx 设置的环境变量需要重启终端才能生效,配置后必须提醒用户。Pushover API 的 /users/validate.json 端点可以验证凭证有效性,避免后续通知失败。

## Common Pitfalls

### Pitfall 1: 忘记验证 Pushover 凭证
**What goes wrong:** 用户输入错误的 token/user,后续通知发送失败
**Why it happens:** 没有调用 API 验证就保存凭证
**How to avoid:** 使用 /users/validate.json 端点验证,失败则重试
**Warning signs:** 用户配置后测试通知失败

### Pitfall 2: setx 失败但未处理
**What goes wrong:** setx 因权限不足失败,但用户以为配置成功
**Why it happens:** setx 在某些环境下可能失败,但退出码不明确
**How to avoid:** 捕获 setx 错误,提供手动设置指导
**Warning signs:** 环境变量未设置,但配置器显示成功

### Pitfall 3: Git user.info 允许跳过
**What goes wrong:** 用户跳过配置,后续 Git 提交失败
**Why it happens:** 将 user.info 误认为是可选配置
**How to avoid:** Git user.name 和 user.email 是必需的,不允许跳过
**Warning signs:** 配置摘要显示 "skipped",后续 git commit 失败

### Pitfall 4: 环境变量未重启生效
**What goes wrong:** setx 成功,但当前会话 process.env 未更新
**Why it happens:** setx 只影响新会话,当前会话需要重启
**How to avoid:** 显示明确的提示:需要重启终端才能生效
**Warning signs:** 配置后立即检测 process.env 仍为空

### Pitfall 5: Git SSH 检测失败
**What goes wrong:** Git 已安装但 git config --get 失败
**Why it happens:** execa 默认 reject: true,命令失败抛出异常
**How to avoid:** 使用 { reject: false } 选项,手动检查 stdout
**Warning signs:** 检测器抛出异常,配置流程中断

## Code Examples

### Pushover API 验证
```javascript
// Source: Pushover API docs - https://pushover.net/api
const { execa } = require('execa');

async function validatePushover(token, user) {
  try {
    const { stdout } = await execa('curl', [
      '-s',
      '-X', 'POST',
      'https://api.pushover.net/1/users/validate.json',
      '-d', `token=${token}`,
      '-d', `user=${user}`
    ]);

    const response = JSON.parse(stdout);

    // Success: {"status":1,"request":"...","devices":["iphone","android"]}
    // Failure: {"user":"invalid","errors":["user identifier is invalid"],"status":0,"request":"..."}

    return {
      valid: response.status === 1,
      devices: response.devices || [],
      errors: response.errors || []
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Network error or API unreachable']
    };
  }
}
```

### setx 环境变量设置
```javascript
// Source: Windows setx command docs
const { execa } = require('execa');

async function setEnvVar(name, value) {
  try {
    // User-level environment variable (no admin required)
    await execa('setx', [name, value]);

    return { success: true };
  } catch (error) {
    // setx may fail with:
    // - Access denied (permission)
    // - Invalid syntax (bad variable name)
    // - Truncation warning (value > 1024 chars)

    const stderr = error.stderr || error.message || '';

    return {
      success: false,
      error: stderr.includes('Access is denied') ? 'permission' : 'unknown',
      details: stderr
    };
  }
}
```

### Git config 检测和设置
```javascript
// Source: Git documentation
const { execa } = require('execa');

async function getGitConfig(key, scope = '--global') {
  try {
    const { stdout } = await execa('git', ['config', scope, '--get', key], {
      reject: false  // Don't throw on non-zero exit
    });

    return stdout || null;
  } catch {
    return null;
  }
}

async function setGitConfig(key, value, scope = '--global') {
  try {
    await execa('git', ['config', scope, key, value]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage:
const userName = await getGitConfig('user.name');
if (!userName) {
  await setGitConfig('user.name', 'Alice');
}
```

### i18n 翻译键结构
```json
// Source: project pattern
// en.json additions
{
  "config.summary": "Configuration Summary",
  "config.status.configured": "Configured",
  "config.status.skipped": "Skipped",
  "config.status.failed": "Failed",
  "config.section.pushover": "Pushover Notifications",
  "config.section.gitSSH": "Git SSH Configuration",
  "config.section.gitUser": "Git User Information",
  "pushover.alreadyConfigured": "Pushover credentials already configured",
  "pushover.promptReconfigure": "Reconfigure Pushover credentials?",
  "pushover.promptConfigure": "Configure Pushover notifications?",
  "pushover.promptToken": "Enter your Pushover application token:",
  "pushover.promptUser": "Enter your Pushover user key:",
  "pushover.validating": "Validating Pushover credentials...",
  "pushover.validationFailed": "Pushover validation failed",
  "pushover.retryPrompt": "Retry ({attempt}/{max})",
  "pushover.saving": "Saving Pushover credentials...",
  "pushover.saveFailed": "Failed to save Pushover credentials",
  "pushover.configured": "Pushover configured successfully",
  "pushover.skipped": "Pushover configuration skipped",
  "pushover.restartReminder": "Note: Restart your terminal for environment variables to take effect",
  "gitSSH.notConfigured": "Git SSH is not configured",
  "gitSSH.guidance": "To configure Git SSH:",
  "gitSSH.step1": "1. Install TortoiseGit (includes Pageant)",
  "gitSSH.step2": "2. Generate SSH key (e.g., using PuTTYgen)",
  "gitSSH.step3": "3. Add public key to remote repository (GitHub/GitLab)",
  "gitSSH.step4": "4. Configure Git to use TortoiseGit SSH:",
  "gitSSH.command": "   git config --global core.sshCommand \"C:/Program Files/TortoiseGit/bin/TortoisePlink.exe\"",
  "gitSSH.docs": "Detailed documentation: https://work-skills.example.com/docs/git-ssh-setup",
  "gitSSH.skipped": "Git SSH configuration skipped",
  "gitUser.alreadyConfigured": "Git user information already configured",
  "gitUser.required": "Git user information is required for commits",
  "gitUser.promptName": "Enter your Git username (for commits):",
  "gitUser.promptEmail": "Enter your Git email address:",
  "gitUser.configured": "Git user information configured",
  "gitUser.failed": "Failed to configure Git user information",
  "guidance.pushoverManual": "Manually set environment variables:\n  setx PUSHOVER_TOKEN \"your-token\"\n  setx PUSHOVER_USER \"your-user\""
}

// zh.json additions
{
  "config.summary": "配置摘要",
  "config.status.configured": "已配置",
  "config.status.skipped": "已跳过",
  "config.status.failed": "失败",
  "config.section.pushover": "Pushover 通知",
  "config.section.gitSSH": "Git SSH 配置",
  "config.section.gitUser": "Git 用户信息",
  "pushover.alreadyConfigured": "Pushover 凭证已配置",
  "pushover.promptReconfigure": "是否重新配置 Pushover 凭证?",
  "pushover.promptConfigure": "是否配置 Pushover 通知?",
  "pushover.promptToken": "请输入 Pushover 应用 token:",
  "pushover.promptUser": "请输入 Pushover 用户 key:",
  "pushover.validating": "正在验证 Pushover 凭证...",
  "pushover.validationFailed": "Pushover 验证失败",
  "pushover.retryPrompt": "重试 ({attempt}/{max})",
  "pushover.saving": "正在保存 Pushover 凭证...",
  "pushover.saveFailed": "Pushover 凭证保存失败",
  "pushover.configured": "Pushover 配置成功",
  "pushover.skipped": "Pushover 配置已跳过",
  "pushover.restartReminder": "注意: 需要重启终端才能使环境变量生效",
  "gitSSH.notConfigured": "Git SSH 未配置",
  "gitSSH.guidance": "配置 Git SSH 步骤:",
  "gitSSH.step1": "1. 安装 TortoiseGit (包含 Pageant)",
  "gitSSH.step2": "2. 生成 SSH 密钥 (如使用 PuTTYgen)",
  "gitSSH.step3": "3. 将公钥添加到远程仓库 (GitHub/GitLab)",
  "gitSSH.step4": "4. 配置 Git 使用 TortoiseGit 的 SSH:",
  "gitSSH.command": "   git config --global core.sshCommand \"C:/Program Files/TortoiseGit/bin/TortoisePlink.exe\"",
  "gitSSH.docs": "详细文档: https://work-skills.example.com/docs/git-ssh-setup",
  "gitSSH.skipped": "Git SSH 配置已跳过",
  "gitUser.alreadyConfigured": "Git 用户信息已配置",
  "gitUser.required": "Git 提交需要用户信息",
  "gitUser.promptName": "请输入 Git 用户名 (用于提交记录):",
  "gitUser.promptEmail": "请输入 Git 邮箱地址:",
  "gitUser.configured": "Git 用户信息配置成功",
  "gitUser.failed": "Git 用户信息配置失败",
  "guidance.pushoverManual": "手动设置环境变量:\n  setx PUSHOVER_TOKEN \"your-token\"\n  setx PUSHOVER_USER \"your-user\""
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 硬编码配置值 | 环境变量 + Git config | Phase 17 | 配置持久化,跨会话有效 |
| 不验证凭证 | API 验证 + 重试 | Phase 17 | 避免无效配置,提高成功率 |
| 单一提示 | 分步交互式提示 | Phase 17 | 更清晰的用户体验 |
| 无配置摘要 | 彩色表格摘要 | Phase 17 | 一目了然的配置状态 |

**Deprecated/outdated:**
- 直接写注册表:使用 setx 命令更简单可靠
- 不验证 Pushover 凭证:无效凭证导致后续通知失败

## Open Questions

1. **是否需要检测 Git SSH 配置的有效性?**
   - What we know: 可以检测 core.sshCommand 是否设置
   - What's unclear: 是否需要测试 SSH 连接(git@github.com)
   - Recommendation: 只检测配置,不测试连接(避免网络超时)

2. **Pushover 验证失败后是否需要详细的错误指导?**
   - What we know: API 返回错误信息
   - What's unclear: 用户是否能理解技术错误
   - Recommendation: 简化错误信息,提示检查 token 和 user 是否正确

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 |
| Config file | installer/jest.config.js |
| Quick run command | `cd installer && npm test -- --testPathPattern=configurators` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONF-01 | 检测 PUSHOVER_TOKEN | unit | `npm test -- pushover.test.js` | Wave 0 |
| CONF-02 | 检测 PUSHOVER_USER | unit | `npm test -- pushover.test.js` | Wave 0 |
| CONF-03 | Pushover 交互式引导 | unit | `npm test -- pushover.test.js` | Wave 0 |
| CONF-04 | setx 保存环境变量 | unit | `npm test -- pushover.test.js` | Wave 0 |
| CONF-05 | 检测 Git SSH 配置 | unit | `npm test -- git-ssh.test.js` | Wave 0 |
| CONF-06 | Git SSH 引导 | unit | `npm test -- git-ssh.test.js` | Wave 0 |
| CONF-07 | 检测 Git user.info | unit | `npm test -- git-user.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd installer && npm test -- --testPathPattern=configurators`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/configurators/pushover.test.js` - covers CONF-01 to CONF-04
- [ ] `installer/tests/configurators/git-ssh.test.js` - covers CONF-05, CONF-06
- [ ] `installer/tests/configurators/git-user.test.js` - covers CONF-07
- [ ] `installer/src/configurators/index.js` - configurator module entry
- [ ] `installer/src/configurators/pushover.js` - Pushover configuration logic
- [ ] `installer/src/configurators/git-ssh.js` - Git SSH detection and guidance
- [ ] `installer/src/configurators/git-user.js` - Git user configuration logic
- [ ] i18n keys for config messages in en.json/zh.json

## Sources

### Primary (HIGH confidence)
- [Pushover API Documentation](https://pushover.net/api) - /users/validate.json endpoint, credential validation
- [Windows setx command documentation](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/setx) - Environment variable persistence
- [Git config documentation](https://git-scm.com/docs/git-config) --get and --global options
- [installer/src/detectors/index.js] - Project detection pattern reference
- [installer/src/installers/pip-installer.js] - Project interaction pattern reference

### Secondary (MEDIUM confidence)
- [enquirer npm page](https://www.npmjs.com/package/enquirer) - Input and Confirm prompt API
- [Stack Overflow: setx vs registry](https://stackoverflow.com/questions/42519452/is-it-possible-to-permanently-set-environment-variables) - Environment variable persistence methods
- [installer/src/i18n/index.js] - Project i18n pattern

### Tertiary (LOW confidence)
- WebSearch for Pushover Node.js libraries - verified with official API docs
- WebSearch for setx exit codes - verified with Windows documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - enquirer, execa, chalk already installed and used in previous phases
- Architecture: HIGH - Based on existing installer structure, Phase 15/16 patterns
- Pitfalls: HIGH - Well-documented setx behavior, Pushover API validation, Git config patterns

**Research date:** 2026-03-21
**Valid until:** 30 days (stable npm packages, Pushover API stable, Windows setx behavior stable)
