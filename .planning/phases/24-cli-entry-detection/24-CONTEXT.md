# Phase 24: CLI Entry & Detection - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

在安装器中添加 `--uninstall` CLI 入口，并检测所有已安装组件（插件、hooks、commands、marketplace source、环境变量、settings.json 引用），为 Phase 25 卸载执行提供完整的安装清单。不包括实际的卸载操作、用户确认交互、或清理执行逻辑。

</domain>

<decisions>
## Implementation Decisions

### Detection Scope

- **D-01:** Full detection — 检测全部 7 类安装痕迹，为 Phase 25 提供完整清单：
  1. Plugin directories (`~/.claude/skills/claude-notify/`, `~/.claude/skills/windows-git-commit/`)
  2. Plugin SKILL.md existence (每个插件目录下)
  3. Hook scripts (`~/.claude/hooks/notify-stop.py`, `~/.claude/hooks/notify-attention.py`)
  4. Hook registration (settings.json 中 Stop/Notification 事件)
  5. Slash commands (`~/.claude/commands/notify-enable.md`, `notify-disable.md`, `notify-status.md`, `check-notify-env.md`)
  6. Marketplace source (config.json 中 work-skills 条目)
  7. Environment variables (PUSHOVER_TOKEN, PUSHOVER_USER — 双源检测 process.env + 注册表)

**Why:** Phase 25 需要清理所有 7 类，在 Phase 24 统一检测避免了 Phase 25 重复实现检测逻辑，也让用户在确认前看到完整清单。

### Detection Output Format

- **D-02:** Table format — 使用类似 Phase 15 环境检测报告的表格格式展示检测结果。按类别分组（Plugins / Hooks / Commands / Config / Environment），每行显示检测项名称、状态（已安装/未安装）、路径或详情。使用彩色状态图标（✓ 已安装，⊘ 未安装）。

### CLI Routing

- **D-03:** Follow --verify pattern — `--uninstall` 标志类似现有 `--verify`：在 parseArgs() 添加选项，在 main() 中检查 `options.uninstallOnly`，跳过安装流程直接进入卸载检测流程。`--uninstall` 与 `--verify` 互斥，同时指定时 `--uninstall` 优先。

### Claude's Discretion

- 表格具体样式（边框、列宽、颜色方案）
- i18n 翻译键的命名规范 (uninstall.*)
- 检测函数的具体代码组织方式
- Nothing-installed 时的退出消息措辞
- --help 中 uninstall 描述的具体文字

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — Phase 24 需求定义 (CLI-01, CLI-02, CLI-03, PLUG-01, ENV-01, UX-04)
- `.planning/ROADMAP.md` — Phase 24 目标和成功标准

### Prior Phase Patterns
- `.planning/phases/17-interactive-configuration/17-CONTEXT.md` — 配置器模块设计决策，setx 持久化方式
- `.planning/phases/19-installation-verification/19-CONTEXT.md` --verify CLI 路由模式，表格输出格式，i18n 集成
- `.planning/phases/20-config-detection-smart-interaction/20-CONTEXT.md` — 双源检测模式 (process.env + 注册表)

### Existing Code (MODIFY, don't create new)
- `installer/src/cli.js` — CLI 解析器，添加 --uninstall 选项
- `installer/src/index.js` — 主入口点，添加 uninstall 路由
- `installer/src/i18n/en.json` 和 `zh.json` — 添加 uninstall.* 翻译键

### Existing Code (REUSE detection functions)
- `installer/src/marketplace/plugin-installer.js` — `isPluginInstalled()`, `getSkillsDir()` 复用插件检测
- `installer/src/configurators/pushover.js` — `detectPushoverFull()`, `readRegistryEnvVar()` 复用环境变量检测
- `installer/src/hooks/hooks-installer.js` — `isHooksInstalled()`, `isHooksRegistered()`, `isCommandsInstalled()` 复用 hooks/commands 检测
- `installer/src/marketplace/config-manager.js` — `readClaudeConfig()` 复用 marketplace source 检测
- `installer/src/hooks/hooks-installer.js` — `readSettings()` 复用 settings.json 检测

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `plugin-installer.js`: `isPluginInstalled(pluginName)` — 检查 `~/.claude/skills/{name}/SKILL.md` 是否存在
- `pushover.js`: `detectPushoverFull()` — 双源检测 PUSHOVER_TOKEN/USER (process.env + 注册表)
- `pushover.js`: `readRegistryEnvVar(varName)` — 读取注册表 HKCU\Environment 中的环境变量
- `hooks-installer.js`: `isHooksInstalled()` — 检查 notify-stop.py 和 notify-attention.py 是否存在
- `hooks-installer.js`: `isHooksRegistered()` — 检查 settings.json 中是否有 hook 注册
- `hooks-installer.js`: `isCommandsInstalled()` — 检查 ~/.claude/commands/ 下 4 个 notify 命令是否存在
- `hooks-installer.js`: `readSettings()` — 读取 ~/.claude/settings.json
- `config-manager.js`: `readClaudeConfig()` — 读取 ~/.claude/config.json
- `cli.js`: `parseArgs()` — 已有 --verify 路由模式可参考

### Established Patterns
- **CLI routing**: options.xxxOnly 标志跳过主流程，直接进入子流程（见 --verify 模式）
- **i18n 集成**: 所有用户可见文本使用 `t('key')` 翻译
- **表格输出**: 使用 cli-table3 或手绘表格 + chalk 彩色状态图标
- **检测器模式**: 每个检测器导出 detect 函数，返回结构化结果

### Integration Points
- `installer/src/cli.js` — 添加 `--uninstall` 选项
- `installer/src/index.js` — 添加 `options.uninstallOnly` 路由到卸载检测流程
- `installer/src/i18n/en.json` 和 `zh.json` — 添加 `uninstall.*` 翻译键
- 新增模块: `installer/src/uninstall/` — 卸载检测模块目录

</code_context>

<specifics>
## Specific Ideas

- 环境变量名（代码实际值）：PUSHOVER_TOKEN, PUSHOVER_USER（不是 REQUIREMENTS.md 中的 PUSHOVER_API_KEY/PUSHOVER_USER_KEY）
- 检测所有 7 类：plugin dirs, plugin SKILL.md, hook scripts, hook registration, slash commands, marketplace source, env vars
- 两个插件名：claude-notify, windows-git-commit
- Hook scripts: notify-stop.py, notify-attention.py（在 ~/.claude/hooks/）
- Slash commands: notify-enable.md, notify-disable.md, notify-status.md, check-notify-env.md（在 ~/.claude/commands/）
- Marketplace source key: "work-skills"（在 config.json marketplaceSources 中）
- 检测结果表格按类别分组：Plugins / Hooks & Commands / Configuration / Environment
- --uninstall 与 --verify 互斥，同时指定时 --uninstall 优先

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-cli-entry-detection*
*Context gathered: 2026-03-30*
