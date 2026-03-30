# Phase 25: Uninstall Execution & UX - Research

**Researched:** 2026-03-30
**Domain:** Node.js CLI uninstall execution, Windows registry operations, fault-tolerant batch processing
**Confidence:** HIGH

## Summary

Phase 25 扩展 Phase 24 的卸载检测模块，添加确认交互、组件移除执行、结果报告三大功能。核心工作是在 `installer/src/uninstall/` 目录下新增 `remover.js`（移除执行）和 `reporter.js`（结果报告），并扩展 `index.js` 将检测流程升级为完整的卸载流程（检测 -> 确认 -> 移除 -> 报告）。

**Primary recommendation:** 直接复用 Phase 24 的检测结果结构作为移除执行的输入，按 D-07 定义的 7 步顺序执行移除。每个移除操作独立 try/catch，失败不阻断后续操作。使用已有的 enquirer Confirm 组件和 chalk 彩色输出模式，保持与项目现有交互模式一致。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Y/N Confirm -- 使用 enquirer Confirm 组件（与 pushover.js、git-user.js 的确认模式一致），默认 No，用户选 Y 才继续
- **D-02:** All-at-once -- 确认后一次性移除所有已安装组件，不逐类别确认
- **D-03:** 确认前展示 Phase 24 的完整检测表格（复用 `formatDetectionTable()`），表格下方紧跟 Confirm 提示
- **D-04:** Reuse detection table -- 直接复用 Phase 24 的 `formatDetectionTable()` 展示已安装组件状态
- **D-05:** Result table -- 使用类似检测表格的 ASCII table 格式展示移除结果，每行显示：组件名称、状态（成功/失败/跳过）、详情
- **D-06:** Green/red/gray icons -- `[v] Removed` (绿) / `[x] Failed` (红) / `[-] Skipped` (灰)。最后一行显示总结：`N removed, M failed, K skipped`
- **D-07:** Functional-first, env-last 移除顺序：(1) Hook scripts (2) Hook registration (3) Slash commands (4) Plugin directories (5) Marketplace cache (6) Marketplace source (7) Environment variables
- **D-08:** Ctrl+C 中断 -- 接受部分状态（standard CLI behavior）。已移除的项不回滚，结果报告只展示已处理的项
- **D-09:** 确认前 Ctrl+C/No -- 系统完全不变，正常退出
- **D-10:** 由 Phase 24 的 `runUninstallDetection()` 处理 nothing-installed 情况。Phase 25 的执行模块在 `hasAnyInstalled === false` 时不进入确认流程

### Claude's Discretion
- 移除函数的具体代码组织方式（拆分模块 vs 合并在一个文件中）
- i18n 翻译键的命名规范 (uninstall.remove.*)
- enquirer Confirm 的具体提示文字
- 注册表删除命令的具体实现（`reg delete` 参数）
- 结果表格的列宽、边框样式细节

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | User sees a summary list of all items to be removed before uninstall starts | D-03/D-04: Reuse `formatDetectionTable()` from formatter.js to display detection table before confirm prompt |
| UX-02 | User must confirm the uninstall action before any changes are made | D-01: enquirer Confirm with default No. D-09: Cancel/No leaves system unchanged |
| UX-03 | System displays a clear uninstall report (success/failure per item) after completion | D-05/D-06: ASCII result table with colored icons. New `reporter.js` module |
| UX-05 | System handles partial failures -- continues uninstalling remaining items if one fails | D-07/D-08: Each removal step in independent try/catch. Failures logged, remaining steps continue |
| UX-06 | User can abort uninstall at confirmation prompt without any changes made | D-09: No changes until user confirms. enquirer Confirm default=No. Ctrl+C before confirm exits cleanly |
| PLUG-02 | System removes installed plugin directories from Claude Code plugins folder | `fs.rmSync(path, { recursive: true, force: true })` on `~/.claude/skills/{name}/` for each installed plugin |
| PLUG-03 | System removes plugin entries from Claude Code settings.json | Reuse `removeExistingNotifyHooks()` from hooks-installer.js + `writeSettings()` |
| PLUG-04 | System removes source registration from marketplace.json | `readClaudeConfig()` -> delete `marketplaceSources['work-skills']` -> `writeClaudeConfig()` |
| ENV-02 | System removes detected Pushover env vars via registry deletion | `reg delete HKCU\Environment /v PUSHOVER_TOKEN /f` via execa |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| enquirer | ^2.4.1 | Confirm prompt interaction | Already installed, used in pushover.js/git-user.js |
| chalk | ^4.1.2 | Colored output | Already installed, used in formatter.js |
| execa | ^5.1.1 | Spawn child processes (reg delete) | Already installed, used in pushover.js for registry reads |
| fs (Node built-in) | >=16.0.0 | File/directory deletion | Already used throughout codebase |
| commander | ^14.0.3 | CLI argument parsing | Already installed, handles --uninstall flag |

### No New Dependencies Required
Phase 25 不需要安装任何新的 npm 包。所有所需功能已由现有依赖提供。

## Architecture Patterns

### Recommended Project Structure
```
installer/src/uninstall/
  index.js       -- Orchestration: detect -> confirm -> remove -> report (EXPAND)
  detector.js    -- Detection logic (Phase 24, NO CHANGE)
  formatter.js   -- Detection table format (Phase 24, NO CHANGE)
  remover.js     -- NEW: 7-step removal execution with fault tolerance
  reporter.js    -- NEW: ASCII result table with colored status icons
```

### Pattern 1: Orchestrator Expansion (index.js)
**What:** Expand `runUninstallDetection()` into a full uninstall flow
**When to use:** Main entry point called by src/index.js when `--uninstall` flag is set
**Example:**
```javascript
// Current (Phase 24):
async function runUninstallDetection() { ... }

// Phase 25 expansion:
async function runUninstall() {
  // Step 1: Detect (existing)
  const results = await detectAllInstalled();
  console.log(formatDetectionTable(results));

  if (!results.hasAnyInstalled) {
    console.log(t('uninstall.nothingFound'));
    return { success: true, nothingToRemove: true };
  }

  // Step 2: Confirm (new)
  const confirmed = await confirmUninstall();
  if (!confirmed) return { success: true, aborted: true };

  // Step 3: Remove (new)
  const removalResults = await removeAllComponents(results);

  // Step 4: Report (new)
  console.log(formatRemovalReport(removalResults));
  return { success: true, results: removalResults };
}
```

### Pattern 2: enquirer Confirm (consistent with pushover.js/git-user.js)
**What:** Standard confirmation dialog used across the project
**When to use:** User must confirm destructive operations
**Example:**
```javascript
// Source: installer/src/configurators/pushover.js line 136-139
const keepPrompt = new Confirm({
  name: 'keepConfig',
  message: t('pushover.keepConfig'),
  initial: true   // default Yes for "keep"
});

// For uninstall, default should be false (No) per D-01:
const confirmPrompt = new Confirm({
  name: 'confirmUninstall',
  message: t('uninstall.remove.confirmPrompt'),
  initial: false   // default No -- user must actively choose Y
});
const confirmed = await confirmPrompt.run();
```

### Pattern 3: Fault-Tolerant Removal (remover.js)
**What:** Each removal step in independent try/catch, failures recorded but not thrown
**When to use:** Batch operations where partial success is acceptable (D-08)
**Example:**
```javascript
// Removal result structure per step:
// { category: 'hookScripts', name: 'notify-stop.py', status: 'removed'|'failed'|'skipped', detail: '' }

async function removeAllComponents(detectionResults) {
  const results = [];

  // Step 1: Hook scripts (only if detected)
  if (detectionResults.hooksScripts.installed) {
    results.push(await removeHookScripts());
  } else {
    results.push({ category: 'hookScripts', status: 'skipped', ... });
  }
  // ... same pattern for steps 2-7

  return results;
}
```

### Pattern 4: Registry Deletion via execa
**What:** Delete persistent env vars set by `setx`
**When to use:** Removing PUSHOVER_TOKEN and PUSHOVER_USER from HKCU\Environment
**Example:**
```javascript
// Source: installer/src/configurators/pushover.js line 25-39 (read pattern)
// For deletion, use reg delete:
async function deleteRegistryEnvVar(varName) {
  try {
    await execa('reg', ['delete', 'HKCU\\Environment', '/v', varName, '/f']);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Anti-Patterns to Avoid
- **Throwing on individual removal failure:** Must catch per-step errors and continue (D-08). Never let one failure stop the remaining removals.
- **Using fs.rmSync without force:true:** Must use `{ recursive: true, force: true }` to handle non-existent paths gracefully.
- **Modifying detector.js or formatter.js:** These Phase 24 files are stable. All Phase 25 changes go in new files or index.js expansion.
- **Running reg delete without /f flag:** Without /f, Windows shows a confirmation prompt, which breaks the automated flow.
- **Deleting non-installed items:** Always check `installed` flag from detection results before attempting removal. Skip items not detected as installed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User confirmation dialog | Custom readline prompt | enquirer Confirm | Consistent UX, handles keyboard edge cases, matches project pattern |
| settings.json hook removal | New removal code | `removeExistingNotifyHooks()` from hooks-installer.js | Already handles the filtering logic correctly |
| Config.json marketplace removal | New JSON manipulation | `readClaudeConfig()` / `writeClaudeConfig()` from config-manager.js | Handles file creation, parsing, formatting edge cases |
| Registry env var deletion | Child process spawn | execa with `reg delete` | Handles quoting, escaping, error capture properly |
| Table formatting | New table library | Hand-drawn ASCII + chalk (same as formatter.js) | Consistent with existing detection table style |

**Key insight:** Phase 25 的核心原则是"复用已有操作函数，只组装新流程"。移除操作所需的底层函数（readSettings/writeSettings、readClaudeConfig/writeClaudeConfig、execa）都已存在，Phase 25 只需要以正确的顺序调用它们并添加错误容错。

## Common Pitfalls

### Pitfall 1: Marketplace Cache Cleanup Over-Deletion
**What goes wrong:** `cleanMarketplaceCache()` in hooks-installer.js 删除整个 hooks 子目录，可能删除非 work-skills 的 hooks
**Why it happens:** 该函数搜索 claude-notify 的所有安装位置（cache/skills/marketplace）并删除其中的 hooks 目录
**How to avoid:** Phase 25 的 marketplace cache 移除应直接删除 `~/.claude/plugins/cache/work-skills/` 整个目录（D-07 步骤 5），而不是调用 `cleanMarketplaceCache()`。同时删除 `~/.claude/plugins/marketplaces/work-skills/` 如果存在。
**Warning signs:** 如果用户有其他插件的 hooks 也被删除，说明误用了 `cleanMarketplaceCache()`

### Pitfall 2: settings.json Race Condition
**What goes wrong:** 如果 settings.json 被其他进程修改（如 Claude Code 正在运行），read-modify-write 可能丢失更改
**Why it happens:** settings.json 在读取和写入之间可能被外部修改
**How to avoid:** 这是 accepted risk for CLI uninstall -- Claude Code 通常不会在卸载时同时修改 settings.json。使用现有的 readSettings -> modify -> writeSettings 模式即可。
**Warning signs:** 如果用户报告卸载后 settings.json 损坏

### Pitfall 3: Registry Access Denied
**What goes wrong:** `reg delete` 命令可能因权限不足而失败
**Why it happens:** HKCU\Environment 应该始终可写，但某些企业策略可能限制
**How to avoid:** 捕获 execa 错误，在结果报告中标记为 failed，提供手动删除指引
**Warning signs:** execa 抛出 "Access is denied" 错误

### Pitfall 4: File Locked by Running Process
**What goes wrong:** `fs.rmSync` 可能因文件被占用而失败（如 Python 脚本正在执行）
**Why it happens:** notify-stop.py 可能在卸载时正在被 Claude Code 的 hook 触发执行
**How to avoid:** 捕获 EPERM/EBUSY 错误，标记为 failed，提示用户关闭 Claude Code 后重试
**Warning signs:** `fs.rmSync` 抛出 EPERM 或 EBUSY 错误码

### Pitfall 5: Deleting Non-Existent Plugin Directory
**What goes wrong:** 如果检测结果显示 installed=true 但文件系统已变化，删除不存在的路径
**Why it happens:** 检测和移除之间有时间差，或外部修改
**How to avoid:** 使用 `fs.rmSync(path, { recursive: true, force: true })` -- `force: true` 使其在路径不存在时不报错
**Warning signs:** ENOENT errors from fs.rmSync

### Pitfall 6: Expanding index.js Without Breaking Phase 24 Test Contracts
**What goes wrong:** 修改 `runUninstallDetection()` 的签名或行为破坏现有测试
**Why it happens:** Phase 24 测试 mock 了 detector 和 formatter，对 index.js 有明确的断言
**How to avoid:** 保留 `runUninstallDetection()` 函数不变。新增 `runUninstall()` 函数作为完整卸载流程的入口。在 `src/index.js` 中改为调用 `runUninstall()` 而非 `runUninstallDetection()`。这样 Phase 24 的测试继续通过。
**Warning signs:** `npm test` 中 uninstall/index.test.js 测试失败

## Code Examples

### Removal Order Implementation (remover.js core structure)
```javascript
// Based on D-07: Functional-first, env-last order
const { getHooksDir, getCommandsDir } = require('../hooks/hooks-installer.js');
const { _readSettings, _writeSettings, _removeExistingNotifyHooks } = require('../hooks/hooks-installer.js');
const { readClaudeConfig, writeClaudeConfig } = require('../marketplace/config-manager.js');
const { getSkillsDir } = require('../marketplace/plugin-installer.js');
const execa = require('execa');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function removeAllComponents(detectionResults) {
  const results = [];

  // Step 1: Hook scripts
  results.push(await removeStep('hookScripts', 'notify-stop.py, notify-attention.py', async () => {
    const hooksDir = getHooksDir();
    const files = ['notify-stop.py', 'notify-attention.py'];
    for (const f of files) {
      const p = path.join(hooksDir, f);
      if (fs.existsSync(p)) fs.rmSync(p, { force: true });
    }
  }, detectionResults.hooksScripts.installed));

  // Step 2: Hook registration (settings.json)
  results.push(await removeStep('hookRegistration', 'settings.json hooks', async () => {
    let settings = _readSettings();
    settings = _removeExistingNotifyHooks(settings);
    _writeSettings(settings);
  }, detectionResults.hooksRegistered.installed));

  // Step 3: Slash commands
  results.push(await removeStep('commands', 'slash commands', async () => {
    const commandsDir = getCommandsDir();
    const commands = ['notify-enable.md', 'notify-disable.md', 'notify-status.md', 'check-notify-env.md'];
    for (const cmd of commands) {
      const p = path.join(commandsDir, cmd);
      if (fs.existsSync(p)) fs.rmSync(p, { force: true });
    }
  }, detectionResults.commandsInstalled.installed));

  // Step 4: Plugin directories
  for (const plugin of detectionResults.plugins) {
    if (plugin.installed) {
      results.push(await removeStep('pluginDir', plugin.name, async () => {
        const pluginPath = path.join(getSkillsDir(), plugin.name);
        fs.rmSync(pluginPath, { recursive: true, force: true });
      }, true));
    } else {
      results.push(makeSkipped('pluginDir', plugin.name));
    }
  }

  // Step 5: Marketplace cache
  results.push(await removeStep('marketplaceCache', 'work-skills cache', async () => {
    const cachePath = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'work-skills');
    if (fs.existsSync(cachePath)) fs.rmSync(cachePath, { recursive: true, force: true });
    // Also clean marketplaces dir if exists
    const marketplacesPath = path.join(os.homedir(), '.claude', 'plugins', 'marketplaces', 'work-skills');
    if (fs.existsSync(marketplacesPath)) fs.rmSync(marketplacesPath, { recursive: true, force: true });
  }, detectionResults.marketplaceSource.installed));

  // Step 6: Marketplace source (config.json)
  results.push(await removeStep('marketplaceSource', 'config.json work-skills entry', async () => {
    const config = readClaudeConfig();
    if (config.marketplaceSources && config.marketplaceSources['work-skills']) {
      delete config.marketplaceSources['work-skills'];
      writeClaudeConfig(config);
    }
  }, detectionResults.marketplaceSource.installed));

  // Step 7: Environment variables (registry)
  for (const key of ['token', 'user']) {
    const envVar = detectionResults.envVars[key];
    results.push(await removeStep('envVar', envVar.name, async () => {
      await execa('reg', ['delete', 'HKCU\\Environment', '/v', envVar.name, '/f']);
    }, envVar.installed));
  }

  return results;
}

// Helper: single removal step with fault tolerance
async function removeStep(category, name, fn, shouldRun) {
  if (!shouldRun) return { category, name, status: 'skipped', detail: '' };
  try {
    await fn();
    return { category, name, status: 'removed', detail: '' };
  } catch (error) {
    return { category, name, status: 'failed', detail: error.message };
  }
}

function makeSkipped(category, name) {
  return { category, name, status: 'skipped', detail: '' };
}
```

### Registry Deletion (Windows)
```bash
# Delete a persistent user environment variable set by setx
# /f = force (no confirmation prompt)
reg delete "HKCU\Environment" /v PUSHOVER_TOKEN /f
reg delete "HKCU\Environment" /v PUSHOVER_USER /f
```

### Result Report Format (reporter.js)
```javascript
// Based on D-05/D-06
const chalk = require('chalk');

function formatRemovalReport(results) {
  const lines = [];
  const separator = chalk.gray('|---------------------------|------------|--------------------------------------------------|');

  lines.push(separator);
  lines.push(chalk.cyan('| Removal Results                                                                          |'));
  lines.push(separator);

  for (const r of results) {
    let icon, status;
    switch (r.status) {
      case 'removed':
        icon = chalk.green('[v]');
        status = chalk.green('Removed');
        break;
      case 'failed':
        icon = chalk.red('[x]');
        status = chalk.red('Failed');
        break;
      case 'skipped':
        icon = chalk.gray('[-]');
        status = chalk.gray('Skipped');
        break;
    }
    lines.push(`| ${r.name.padEnd(25)} | ${icon} ${status} | ${(r.detail || '').padEnd(46)}|`);
  }

  lines.push(separator);

  // Summary line
  const removed = results.filter(r => r.status === 'removed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  lines.push(t('uninstall.remove.summary', { removed, failed, skipped }));

  return lines.join('\n');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A (greenfield) | Phase 24 detection -> Phase 25 execution | Phase 24 (2026-03-30) | Clean separation: detect first, then decide what to remove |

**No deprecated patterns in this phase** -- all approaches are current and consistent with the existing codebase.

## Open Questions

1. **Plugin count in removal results**
   - What we know: Detection checks 2 plugins (claude-notify, windows-git-commit). Each gets its own detection result row.
   - What's unclear: Should the result report have 2 separate rows (one per plugin) or 1 row ("Plugins")? CONTEXT says "每行显示：组件名称、状态", suggesting per-plugin rows.
   - Recommendation: Follow CONTEXT D-05 pattern -- each removed item gets its own row. 2 installed plugins = 2 rows in result report. Total rows = all items with installed=true from detection.

2. **Marketplace cache deletion scope**
   - What we know: CONTEXT D-07 says remove `~/.claude/plugins/cache/work-skills/` and `~/.claude/plugins/marketplaces/work-skills/`.
   - What's unclear: The detection (Phase 24) doesn't have a separate "marketplace cache" detection category -- it only checks `marketplaceSource` in config.json.
   - Recommendation: Delete cache directory as part of Step 5 regardless of detection status (it's cleanup, not conditional). But only mark it in the result report if marketplaceSource was detected as installed. Alternatively, always attempt cache cleanup silently.

3. **i18n keys namespace**
   - What we know: Existing keys use `uninstall.*` namespace (e.g., `uninstall.title`, `uninstall.summary`).
   - What's unclear: Exact key names for removal phase.
   - Recommendation: Use `uninstall.remove.*` namespace for new keys (Claude's discretion). Examples: `uninstall.remove.confirmPrompt`, `uninstall.remove.status.removed`, `uninstall.remove.status.failed`, `uninstall.remove.status.skipped`, `uninstall.remove.summary`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^30.3.0 |
| Config file | None (uses Jest defaults) |
| Quick run command | `cd installer && npm test -- --testPathPattern="uninstall"` |
| Full suite command | `cd installer && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Summary table shown before confirm | unit | `cd installer && npm test -- --testPathPattern="uninstall/index"` | Needs expansion |
| UX-02 | User must confirm before changes | unit | `cd installer && npm test -- --testPathPattern="uninstall/index"` | Needs creation |
| UX-03 | Result report with per-item status | unit | `cd installer && npm test -- --testPathPattern="uninstall/reporter"` | Wave 0 |
| UX-05 | Partial failure continues remaining | unit | `cd installer && npm test -- --testPathPattern="uninstall/remover"` | Wave 0 |
| UX-06 | Abort at confirm = no changes | unit | `cd installer && npm test -- --testPathPattern="uninstall/index"` | Needs expansion |
| PLUG-02 | Plugin directories removed | unit | `cd installer && npm test -- --testPathPattern="uninstall/remover"` | Wave 0 |
| PLUG-03 | settings.json hooks cleaned | unit | `cd installer && npm test -- --testPathPattern="uninstall/remover"` | Wave 0 |
| PLUG-04 | Marketplace source removed from config.json | unit | `cd installer && npm test -- --testPathPattern="uninstall/remover"` | Wave 0 |
| ENV-02 | Pushover env vars deleted from registry | unit | `cd installer && npm test -- --testPathPattern="uninstall/remover"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd installer && npm test -- --testPathPattern="uninstall"`
- **Per wave merge:** `cd installer && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `installer/tests/uninstall/remover.test.js` -- covers PLUG-02, PLUG-03, PLUG-04, ENV-02, UX-05
- [ ] `installer/tests/uninstall/reporter.test.js` -- covers UX-03
- [ ] `installer/tests/uninstall/index.test.js` -- needs expansion for UX-01, UX-02, UX-06 (new `runUninstall()` function tests)

## Existing Code Integration Map

### Files to MODIFY
| File | Change | Risk |
|------|--------|------|
| `installer/src/uninstall/index.js` | Add `runUninstall()` function (keep `runUninstallDetection()` intact) | LOW -- additive change |
| `installer/src/index.js` | Change `runUninstallDetection()` call to `runUninstall()` | LOW -- single line change |
| `installer/src/i18n/en.json` | Add `uninstall.remove.*` keys | LOW -- additive |
| `installer/src/i18n/zh.json` | Add `uninstall.remove.*` keys | LOW -- additive |

### Files to CREATE
| File | Purpose |
|------|---------|
| `installer/src/uninstall/remover.js` | 7-step removal execution with fault tolerance |
| `installer/src/uninstall/reporter.js` | Result report formatting with colored icons |
| `installer/tests/uninstall/remover.test.js` | Unit tests for removal logic |
| `installer/tests/uninstall/reporter.test.js` | Unit tests for report formatting |

### Files to REUSE (read-only)
| File | What to Reuse |
|------|--------------|
| `installer/src/uninstall/detector.js` | `detectAllInstalled()` -- input for removal decisions |
| `installer/src/uninstall/formatter.js` | `formatDetectionTable()` -- display before confirm |
| `installer/src/hooks/hooks-installer.js` | `_readSettings()`, `_writeSettings()`, `_removeExistingNotifyHooks()`, `getHooksDir()`, `getCommandsDir()` |
| `installer/src/marketplace/config-manager.js` | `readClaudeConfig()`, `writeClaudeConfig()`, `getConfigPath()` |
| `installer/src/marketplace/plugin-installer.js` | `getSkillsDir()` |
| `installer/src/configurators/pushover.js` | Pattern reference for registry operations (readRegistryEnvVar) |
| `installer/src/i18n/index.js` | `t()` function for translations |

## Sources

### Primary (HIGH confidence)
- Code review of `installer/src/uninstall/detector.js` -- detection result structure
- Code review of `installer/src/hooks/hooks-installer.js` -- settings.json manipulation, file deletion patterns
- Code review of `installer/src/marketplace/config-manager.js` -- config.json read/write
- Code review of `installer/src/configurators/pushover.js` -- enquirer Confirm pattern, registry access pattern
- Windows `reg delete /?` output -- confirmed `/v ValueName /f` syntax

### Secondary (MEDIUM confidence)
- Code review of existing test patterns in `installer/tests/uninstall/` -- Jest mock patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all libraries already in use
- Architecture: HIGH -- CONTEXT.md provides precise module structure and removal order
- Pitfalls: HIGH -- identified from code review and Windows CLI experience
- Integration: HIGH -- all integration points identified with specific function names and line numbers

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- no external API or fast-moving dependencies)
