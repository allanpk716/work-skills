# Phase 20: Config Detection & Smart Interaction - Research

**Researched:** 2026-03-29
**Domain:** Windows registry access, environment variable detection, interactive CLI prompts
**Confidence:** HIGH

## Summary

Phase 20 增强两个现有配置器模块（pushover.js 和 git-user.js），使其能可靠检测已持久化的配置。核心挑战在于 Pushover 凭证通过 `setx` 持久化到注册表，但当前终端会话的 `process.env` 可能尚未加载这些值（需要重启终端）。解决方案是双源检测：同时检查 `process.env`（当前会话）和注册表 `HKCU\Environment`（setx 持久化的值）。

Git 用户信息通过 `git config --global` 配置，检测相对简单，主要工作是添加跳过/更新的 Confirm 交互（当前代码检测到已配置时直接返回，无询问）。

**Primary recommendation:** 使用 execa + `reg query` 命令进行注册表检测（而非 winreg 库），因为项目已大量使用 execa，保持一致性且代码更简洁。winreg 虽然已安装在 dependencies 中，但其 callback 风格 API 需要额外 promisify 包装。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 双源检测 -- 同时检查 `process.env`（当前会话）和注册表 `HKCU\Environment`（setx 持久化的值）。任一来源有值都算"已配置"。
- **D-02:** 逐项处理 -- 当部分配置项存在时，已有项询问跳过/更新，缺失项直接提示输入。
- **D-03:** 使用 enquirer Confirm 提示 -- 默认 Y = 跳过（保留现有配置），N = 重新输入。统一 Pushover 和 Git user 的交互模式。
- **D-04:** 保持现有显示格式 -- 检测到已有凭证时显示 Token 前 8 位 + "..."，User 前 8 位 + "..."。
- 环境变量名以代码为准：`PUSHOVER_TOKEN` 和 `PUSHOVER_USER`。

### Claude's Discretion
- 注册表读取的具体实现方式（reg query 命令或 Node.js 方案）
- Confirm 提示的具体消息文本
- 部分配置检测的代码组织方式

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CFGD-01 | Installer detects Pushover credentials persisted via setx | 双源检测方案（process.env + reg query HKCU\Environment），execa reg query 已验证可用 |
| CFGD-02 | Installer detects Git user info via git config --global | detectGitUser() 已有实现，execa + git config --global --get 正常工作 |
| INTX-01 | Display current values when config detected (masked API key, full user info) | pushover.js 已有 Token/User 前 8 位显示模式；git-user.js 已有 name/email 显示 |
| INTX-02 | User can skip configuration step when existing values detected | enquirer Confirm prompt, initial: true（默认 Y = 跳过），已验证 enquirer 行为 |
| INTX-03 | User can re-enter configuration, updating existing values | 复用现有 configurePushover / configureGitUser 的输入+验证+保存流程 |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| execa | ^5.1.1 | 执行 reg query / git config 命令 | 项目统一使用 execa 执行外部命令，支持 Promise API |
| enquirer | ^2.4.1 | Confirm/Input 交互提示 | 项目统一使用 enquirer 进行 CLI 交互 |
| chalk | ^4.1.2 | 彩色输出 | 项目统一使用 chalk 进行终端着色 |
| winreg | ^1.2.5 | Windows 注册表访问（备选方案） | 已在 dependencies 中，提供 callback API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js util.promisify | built-in | 包装 winreg callback 为 Promise | 仅当选择 winreg 方案时使用 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| execa + reg query | winreg 库 | winreg 已安装但使用 callback API，需 promisify 包装；execa 更符合项目风格，代码更简洁 |
| winreg 库 | execa + reg query | execa 方案输出需手动解析，但解析逻辑简单（3 行代码），且不引入额外抽象层 |

**Installation:**
```bash
# 无需安装新依赖 -- 所有需要的库已安装
```

**Version verification:** 所有库版本来自 package.json，已确认安装。

## Architecture Patterns

### Recommended Modification Targets
```
installer/src/configurators/
  pushover.js          # 主要修改：增强 detectPushoverEnv()，添加逐项处理
  git-user.js          # 主要修改：添加 Confirm 跳过/更新交互
  index.js             # 可能微调：串联逻辑
installer/src/i18n/
  en.json              # 添加新的翻译键
  zh.json              # 添加新的翻译键
```

### Pattern 1: 双源检测（Registry + process.env）
**What:** 同时检查两个来源的环境变量值，任一有值即视为"已配置"
**When to use:** Pushover 凭证检测（setx 持久化到注册表，但当前会话可能未加载）
**Example:**
```javascript
// Source: 项目已验证的 reg query 方案
const execa = require('execa');

async function readRegistryEnvVar(name) {
  try {
    const { stdout } = await execa('reg', ['query', 'HKCU\\Environment', '/v', name]);
    // 输出格式:
    // HKEY_CURRENT_USER\Environment
    //     PUSHOVER_TOKEN    REG_SZ    actual_value_here
    const lines = stdout.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const valueLine = lines.find(l => l.includes('REG_SZ'));
    if (valueLine) {
      const parts = valueLine.split(/\s{2,}/);
      return parts[2] || null;  // 第三部分是值
    }
    return null;
  } catch (e) {
    // exitCode 1 = 变量不存在，属正常情况
    return null;
  }
}

function detectPushoverEnv() {
  return {
    token: process.env.PUSHOVER_TOKEN || null,
    user: process.env.PUSHOVER_USER || null
  };
}

async function detectPushoverFull() {
  const envResult = detectPushoverEnv();

  // 双源检测：process.env 优先（更准确），回退到注册表
  const token = envResult.token || await readRegistryEnvVar('PUSHOVER_TOKEN');
  const user = envResult.user || await readRegistryEnvVar('PUSHOVER_USER');

  return { token, user };
}
```

### Pattern 2: 逐项 Confirm 交互
**What:** 对每个已配置项单独询问是否保留，对缺失项直接提示输入
**When to use:** 部分配置存在时（D-02 逐项处理决策）
**Example:**
```javascript
// Source: pushover.js 已有的 promptReconfigure 模式，扩展为逐项版本
const { Confirm, Input } = require('enquirer');

async function promptKeepOrReenter(itemName, currentValue, maskedValue) {
  const keepPrompt = new Confirm({
    name: 'keep',
    message: t('pushover.keepItem', { item: itemName, value: maskedValue }),
    initial: true  // 默认 Y = 保留
  });
  const shouldKeep = await keepPrompt.run();

  if (shouldKeep) {
    return currentValue;  // 保留当前值
  }

  // 重新输入
  const inputPrompt = new Input({
    name: itemName,
    message: t('pushover.promptEnter', { item: itemName })
  });
  return await inputPrompt.run();
}
```

### Pattern 3: Git User Confirm 交互（git-user.js 增强）
**What:** 检测到已配置 Git 用户信息时，添加 Confirm 选择而非直接返回
**When to use:** git-user.js configureGitUser() 中，当前直接 return 的分支
**Example:**
```javascript
// 当前代码（需修改）：
if (current.name && current.email) {
  console.log(chalk.green(t('gitUser.alreadyConfigured')));
  console.log(chalk.gray(`  user.name: ${current.name}`));
  console.log(chalk.gray(`  user.email: ${current.email}`));
  return { status: 'configured', name: current.name, email: current.email };
  // 问题：无询问，直接返回
}

// 增强后：
if (current.name && current.email) {
  console.log(chalk.green(t('gitUser.alreadyConfigured')));
  console.log(chalk.gray(`  user.name: ${current.name}`));
  console.log(chalk.gray(`  user.email: ${current.email}`));

  const keepPrompt = new Confirm({
    name: 'keepConfig',
    message: t('gitUser.promptKeepConfig'),
    initial: true  // 默认 Y = 保留
  });
  const shouldKeep = await keepPrompt.run();
  if (shouldKeep) {
    return { status: 'configured', name: current.name, email: current.email };
  }
  // 选择重新配置，继续到下面的输入流程...
}
```

### Anti-Patterns to Avoid
- **不要只用 process.env 检测 Pushover**：setx 设置的环境变量需要重启终端才能在 process.env 中可见，只检查 process.env 会漏掉已配置但未重启终端的情况
- **不要忽略 reg query 的 exitCode 1**：变量不存在时 reg query 返回 exitCode 1，这是正常情况，不应当作错误处理
- **不要在 reg query 解析中假设固定行号**：输出可能有空行，应使用 `find(line => line.includes('REG_SZ'))` 而非硬编码行号
- **不要修改 setx 持久化方式**：setx 是已验证的持久化方式，Phase 20 只增强检测，不改变持久化
- **不要为 git-user.js 添加跳过选项**：Git 用户信息是必需配置（Phase 17 决策），只添加"保留/重新输入"选择，不添加"跳过"选项

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 注册表值解析 | 手写正则匹配复杂格式 | execa + 简单 split(/\s{2,}/) | reg query 输出格式稳定，split 已验证可用 |
| 环境变量持久化 | 重新实现 setx 调用 | 复用现有 setEnvVariable() | 已有完善的错误处理和类型检测 |
| Pushover 凭证验证 | 重写 API 调用 | 复用现有 validatePushoverCredentials() | 已有重试逻辑和错误类型检测 |
| Git config 读取 | 使用 child_process.exec | 复用现有 detectGitUser() | 已有 reject: false 配置，正确处理未配置情况 |

**Key insight:** Phase 20 是增强现有代码，不是创建新模块。所有核心功能（setx、git config、enquirer、i18n）已有成熟实现，只需扩展检测范围和交互逻辑。

## Common Pitfalls

### Pitfall 1: execa 中 reg query 的路径转义
**What goes wrong:** bash shell 中 node -e 的反斜杠转义导致 `HKCU\Environment` 变成 `HKCUEnvironment`
**Why it happens:** bash 解析 -e 参数时会吃掉反斜杠
**How to avoid:** 在 .js 文件中使用 `'HKCU\\Environment'`（JS 字符串转义），实际运行时传递给 reg.exe 的是 `HKCU\Environment`。这已在实际代码中验证工作正常。
**Warning signs:** reg query 报 "invalid syntax" 错误

### Pitfall 2: reg query 输出解析的编码问题
**What goes wrong:** reg query 的 stderr 输出是 GBK 编码（中文 Windows），可能乱码
**Why it happens:** Windows 系统区域设置导致 reg.exe 使用非 UTF-8 编码
**How to avoid:** 只解析 stdout（值为英文/数字），不依赖 stderr 的内容。通过 exitCode 判断成功/失败：exitCode=0 = 找到，exitCode=1 = 未找到。
**Warning signs:** catch 块中读取 stderr 文本时出现乱码

### Pitfall 3: Confirm prompt 的 initial 方向搞反
**What goes wrong:** CONTEXT.md 决策 D-03 要求"默认 Y = 跳过（保留现有配置）"，但 enquirer Confirm 的 `initial: true` 代表默认 Y
**Why it happens:** 对 enquirer Confirm API 理解不准确
**How to avoid:** enquirer Confirm `initial: true` = 默认 Y。Phase 20 的场景：默认 Y = 保留当前配置（跳过重新输入），所以应设置 `initial: true`。
**Warning signs:** 测试时发现按 Enter 后行为与预期相反

### Pitfall 4: process.env 优先级处理
**What goes wrong:** 注册表值覆盖了 process.env 中的值
**Why it happens:** 检测顺序逻辑错误
**How to avoid:** process.env 应优先于注册表值。如果当前会话通过 `process.env.XXX = value` 设置了变量（安装器 configurePushover 中有此逻辑），应以此为准。注册表只在 process.env 为空时作为补充。
**Warning signs:** 安装器在同一次运行中设置了环境变量后，检测逻辑读到旧值

### Pitfall 5: Git user 部分配置时的交互断裂
**What goes wrong:** 只有 name 没有 email（或反之）时，询问保留已有项后，没有正确引导输入缺失项
**Why it happens:** 只处理了"全部有"和"全部没有"两种情况，忽略了"部分有"的中间状态
**How to avoid:** D-02 要求逐项处理。对已有项询问保留/更新，对缺失项直接走输入流程。代码结构应支持 name 和 email 独立处理。
**Warning signs:** 测试时删除 `git config --global user.email` 后运行安装器，发现 email 未被提示输入

## Code Examples

### Execa reg query 读取环境变量（已验证）
```javascript
// Source: 实际测试验证 (tmp/test-reg.js)
const execa = require('execa');

async function readRegistryEnvVar(varName) {
  try {
    const { stdout } = await execa('reg', ['query', 'HKCU\\Environment', '/v', varName]);
    const lines = stdout.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const valueLine = lines.find(l => l.includes('REG_SZ'));
    if (valueLine) {
      const parts = valueLine.split(/\s{2,}/);
      return parts[2] || null;
    }
    return null;
  } catch (e) {
    // exitCode 1 = 变量不存在
    return null;
  }
}
```

### Winreg 读取环境变量（备选方案，已验证）
```javascript
// Source: winreg 1.2.5 API，实际测试验证
const Registry = require('winreg');

async function readRegistryEnvVar(varName) {
  const regKey = new Registry({
    hive: Registry.HKCU,
    key: '\\Environment'
  });

  return new Promise((resolve) => {
    regKey.get(varName, (err, val) => {
      if (err) {
        resolve(null);  // 变量不存在
      } else {
        resolve(val.value);
      }
    });
  });
}
```

### enquirer Confirm 默认跳过模式
```javascript
// Source: 项目 enquirer ^2.4.1 使用模式
const { Confirm } = require('enquirer');

// 默认 Y（initial: true）= 保留当前配置，跳过重新输入
const prompt = new Confirm({
  name: 'keepConfig',
  message: t('pushover.keepToken'),  // "Keep current Pushover token (artbqa7z...)?"
  initial: true
});

const shouldKeep = await prompt.run();
if (shouldKeep) {
  // 保留当前配置，继续下一步
} else {
  // 重新输入
}
```

### i18n 翻译键模式
```json
// 新增翻译键示例（需添加到 en.json 和 zh.json）
{
  "pushover.keepToken": "Keep current Pushover token ({value})?",
  "pushover.keepUser": "Keep current Pushover user key ({value})?",
  "pushover.enterToken": "Enter new Pushover application token:",
  "pushover.enterUser": "Enter new Pushover user key:",
  "gitUser.promptKeepConfig": "Keep current Git user configuration?",
  "gitUser.promptKeepName": "Keep current user.name ({value})?",
  "gitUser.promptKeepEmail": "Keep current user.email ({value})?"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 仅 process.env 检测 | 双源检测（process.env + 注册表） | Phase 20 | 解决 setx 后未重启终端的检测盲区 |
| git-user.js 直接返回 | Confirm 交互选择保留/重新输入 | Phase 20 | 统一交互模式，允许更新已有配置 |

**Deprecated/outdated:**
- Phase 17 的 `detectPushoverEnv()` 仅检查 `process.env`：Phase 20 增强为同时检查注册表，但保持原函数作为内部 helper

## Open Questions

1. **winreg vs execa reg query 的最终选择**
   - What we know: 两种方案都已验证可用。winreg 已在 dependencies 中但用 callback API；execa reg query 需要手动解析输出但代码更简洁
   - Recommendation: 推荐使用 execa + reg query，与项目风格一致，且输出解析逻辑简单（3 行代码）。如果团队偏好类型安全的抽象，winreg 也是合理选择。

2. **部分配置的 i18n 键命名**
   - What we know: 现有键名模式为 `pushover.*` 和 `gitUser.*`
   - Recommendation: 遵循现有模式，新增键如 `pushover.keepToken`、`gitUser.promptKeepConfig`

3. **git-user.js 是否需要区分"部分配置"场景**
   - What we know: D-02 要求逐项处理。Git 通常 name 和 email 一起配置，但理论上可以只设 name 不设 email
   - Recommendation: 实现 name 和 email 独立检测和询问，但无需过度设计。如果用户同时有 name 和 email，一个 Confirm 询问整体保留；如果只有其一，对已有项询问保留，缺失项直接提示输入。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| reg.exe (Windows) | 注册表读取 | Yes | Windows built-in | -- |
| git.exe | git config 读取 | Yes | -- | -- |
| Node.js >=16 | 运行时 | Yes | 22.14.0 | -- |
| execa ^5.1.1 | 命令执行 | Yes | 5.1.1 | -- |
| enquirer ^2.4.1 | CLI 交互 | Yes | 2.4.1 | -- |
| winreg ^1.2.5 | 注册表访问(备选) | Yes | 1.2.5 | execa reg query |
| jest ^30.3.0 | 测试框架 | Yes | 30.3.0 | -- |

**Missing dependencies with no fallback:**
- None -- 所有依赖已安装并验证可用

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^30.3.0 |
| Config file | installer/jest.config.js |
| Quick run command | `cd installer && npm test -- --testPathPattern="configurators" --no-coverage` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CFGD-01 | 检测注册表中持久化的 Pushover 凭证 | unit | `cd installer && npm test -- --testPathPattern="pushover" --no-coverage` | Yes (需扩展) |
| CFGD-02 | 检测 git config --global 的用户信息 | unit | `cd installer && npm test -- --testPathPattern="git-user" --no-coverage` | Yes (需扩展) |
| INTX-01 | 检测到配置时显示当前值 | unit | `cd installer && npm test -- --testPathPattern="configurators" --no-coverage` | Wave 0 |
| INTX-02 | 用户可选择跳过已有配置 | unit | `cd installer && npm test -- --testPathPattern="configurators" --no-coverage` | Wave 0 |
| INTX-03 | 用户重新输入走完整验证流程 | unit | `cd installer && npm test -- --testPathPattern="configurators" --no-coverage` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd installer && npm test -- --testPathPattern="configurators" --no-coverage`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/configurators/pushover.test.js` -- 需扩展：添加 readRegistryEnvVar 测试、双源检测测试、逐项处理测试。现有测试是自执行脚本（非 Jest 格式），需决定是否迁移到 Jest
- [ ] `installer/tests/configurators/git-user.test.js` -- 需扩展：添加 Confirm 交互测试、部分配置测试、保留/重新输入测试。现有测试同样是自执行脚本
- [ ] 测试格式统一：现有 pushover.test.js 和 git-user.test.js 使用 `assert` + 自执行函数，不使用 Jest API。Phase 20 的测试应遵循现有格式（`test()` helper + `assert`），保持一致性

## Sources

### Primary (HIGH confidence)
- 实际代码审查：`installer/src/configurators/pushover.js`、`git-user.js`、`index.js`
- 实际测试验证：execa reg query 和 winreg 在当前环境的注册表读取（2026-03-29）
- package.json 依赖版本确认
- CONTEXT.md 锁定决策

### Secondary (MEDIUM confidence)
- `.planning/phases/17-interactive-configuration/17-CONTEXT.md` -- 原始设计决策和交互模式
- `.planning/phases/19-installation-verification/19-CONTEXT.md` -- i18n 翻译键模式参考

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- 所有库已安装并验证，无新依赖
- Architecture: HIGH -- 修改目标明确（pushover.js + git-user.js），现有代码模式清晰
- Pitfalls: HIGH -- execa reg query 转义和解析已通过实际测试验证
- Reg query 输出解析: HIGH -- 在实际环境中测试了多种场景（存在/不存在/PATH 变量）

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- 无外部依赖变化风险)
