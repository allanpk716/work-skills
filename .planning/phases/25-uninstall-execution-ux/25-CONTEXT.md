# Phase 25: Uninstall Execution & UX - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

在用户通过 `--uninstall` 触发卸载并看到检测结果后，执行确认交互和实际的组件移除操作。包括：用户确认、7 类组件的移除执行（plugin dirs, hook scripts, hook registration, slash commands, marketplace source, env vars）、移除结果报告、部分失败容错。不包括检测逻辑（Phase 24 已完成）和新的卸载能力（如 --force、选择性卸载等，见 REQUIREMENTS.md Future Requirements）。

</domain>

<decisions>
## Implementation Decisions

### Confirmation Flow

- **D-01:** Y/N Confirm — 使用 enquirer Confirm 组件（与 pushover.js、git-user.js 的确认模式一致），默认 No，用户选 Y 才继续
- **D-02:** All-at-once — 确认后一次性移除所有已安装组件，不逐类别确认
- **D-03:** 确认前展示 Phase 24 的完整检测表格（复用 `formatDetectionTable()`），表格下方紧跟 Confirm 提示

### Summary Before Removal

- **D-04:** Reuse detection table — 直接复用 Phase 24 的 `formatDetectionTable()` 展示已安装组件状态，无需创建新的摘要格式

### Result Report Format

- **D-05:** Result table — 使用类似检测表格的 ASCII table 格式展示移除结果，每行显示：组件名称、状态（成功/失败/跳过）、详情
- **D-06:** Green/red/gray icons — `[v] Removed` (绿) / `[x] Failed` (红) / `[-] Skipped` (灰)。最后一行显示总结：`N removed, M failed, K skipped`

### Removal Order & Abort Handling

- **D-07:** Functional-first, env-last 移除顺序：
  1. Hook scripts (`notify-stop.py`, `notify-attention.py`)
  2. Hook registration (settings.json 中 Stop/Notification hook entries)
  3. Slash commands (`~/.claude/commands/notify-*.md`, `check-notify-env.md`)
  4. Plugin directories (`~/.claude/skills/claude-notify/`, `~/.claude/skills/windows-git-commit/`)
  5. Marketplace cache (`~/.claude/plugins/cache/work-skills/`)
  6. Marketplace source (config.json 中 work-skills 条目)
  7. Environment variables (注册表中 PUSHOVER_TOKEN, PUSHOVER_USER)
- **D-08:** Ctrl+C 中断 — 接受部分状态（standard CLI behavior）。已移除的项不回滚，结果报告只展示已处理的项
- **D-09:** 确认前 Ctrl+C/No — 系统完全不变，正常退出

### Nothing-Installed Handling

- **D-10:** 由 Phase 24 的 `runUninstallDetection()` 处理 — 显示 "Nothing installed. No uninstall needed." 后退出。Phase 25 的执行模块在 `hasAnyInstalled === false` 时不进入确认流程

### Claude's Discretion

- 移除函数的具体代码组织方式（拆分模块 vs 合并在一个文件中）
- i18n 翻译键的命名规范 (uninstall.remove.*)
- enquirer Confirm 的具体提示文字
- 注册表删除命令的具体实现（`reg delete` 参数）
- 结果表格的列宽、边框样式细节

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — Phase 25 需求定义 (UX-01, UX-02, UX-03, UX-05, UX-06, PLUG-02, PLUG-03, PLUG-04, ENV-02)
- `.planning/ROADMAP.md` — Phase 25 目标和成功标准

### Prior Phase Context
- `.planning/phases/24-cli-entry-detection/24-CONTEXT.md` — 检测模块设计，7 类组件检测结果结构
- `.planning/phases/17-interactive-configuration/17-CONTEXT.md` — enquirer Confirm 模式，setx 持久化方式
- `.planning/phases/20-config-detection-smart-interaction/20-CONTEXT.md` — 双源检测模式 (process.env + 注册表)

### Existing Code (MODIFY/EXTEND)
- `installer/src/uninstall/index.js` — 扩展入口点，从检测升级为确认+移除+报告
- `installer/src/uninstall/detector.js` — 检测结果结构（Phase 25 消费此结构）
- `installer/src/uninstall/formatter.js` — 检测表格格式（复用或参考）
- `installer/src/i18n/en.json` 和 `zh.json` — 添加 uninstall.remove.* 翻译键

### Existing Code (REUSE removal operations)
- `installer/src/hooks/hooks-installer.js` — `removeExistingNotifyHooks()` (移除 settings.json hook 注册)、`readSettings()` / `writeSettings()`、`cleanMarketplaceCache()`、`getHooksDir()`、`getCommandsDir()`
- `installer/src/marketplace/plugin-installer.js` — `getSkillsDir()` (插件目录路径)
- `installer/src/marketplace/config-manager.js` — `readClaudeConfig()` / `writeClaudeConfig()` (marketplace source 管理)
- `installer/src/configurators/pushover.js` — `readRegistryEnvVar()` (注册表读取，参考实现删除)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `detector.js: detectAllInstalled()` — 返回结构化检测结果，Phase 25 直接消费此结果决定移除哪些项
- `formatter.js: formatDetectionTable()` — 检测表格渲染，复用作为确认前的摘要展示
- `hooks-installer.js: removeExistingNotifyHooks()` — 已有从 settings.json 移除 hook 注册的函数
- `hooks-installer.js: cleanMarketplaceCache()` — 已有清理 marketplace 缓存的函数（但会删除整个 hooks 目录，需评估是否可复用）
- `enquirer` — 已安装的交互库，Confirm/Input 组件在多个 configurator 中使用

### Established Patterns
- **enquirer Confirm**: `new Confirm({ message: t('key') })` + `await prompt.run()` — 所有用户确认都用此模式
- **表格输出**: 手绘 ASCII table + chalk 彩色状态图标（见 formatter.js）
- **i18n 集成**: 所有用户可见文本使用 `t('key')` 翻译
- **文件删除**: `fs.rmSync(path, { recursive: true, force: true })` — 已在 cleanMarketplaceCache() 中使用
- **settings.json 操作**: readSettings() → 修改 → writeSettings() — 已在 hooks-installer.js 中建立

### Integration Points
- `installer/src/uninstall/index.js` — 扩展 `runUninstallDetection()` 为完整的卸载流程（检测→确认→移除→报告）
- `installer/src/uninstall/` — 新增 `remover.js`（移除执行）和 `reporter.js`（结果报告）
- `installer/src/i18n/en.json` 和 `zh.json` — 添加 `uninstall.remove.*` 翻译键

</code_context>

<specifics>
## Specific Ideas

- 移除的 7 类组件（按执行顺序）：
  1. Hook scripts: `~/.claude/hooks/notify-stop.py`, `~/.claude/hooks/notify-attention.py`
  2. Hook registration: settings.json 中 Stop 和 Notification 事件的 hook entries
  3. Slash commands: `~/.claude/commands/notify-enable.md`, `notify-disable.md`, `notify-status.md`, `check-notify-env.md`
  4. Plugin directories: `~/.claude/skills/claude-notify/`, `~/.claude/skills/windows-git-commit/`
  5. Marketplace cache: `~/.claude/plugins/cache/work-skills/`（整个目录）
  6. Marketplace source: config.json 中 `marketplaceSources.work-skills` 条目
  7. Environment variables: 注册表 HKCU\Environment 中 PUSHOVER_TOKEN 和 PUSHOVER_USER（使用 `reg delete`）
- 确认提示使用 enquirer Confirm，默认 No
- 结果报告使用 [v] Removed / [x] Failed / [-] Skipped 彩色图标
- 总结行格式：`N removed, M failed, K skipped`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-uninstall-execution-ux*
*Context gathered: 2026-03-30*
