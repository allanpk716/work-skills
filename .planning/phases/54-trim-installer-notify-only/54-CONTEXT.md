# Phase 54: trim-installer-notify-only - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning (convergence mode: codex + opencode)
**Mode:** Auto-generated context (smart discuss — design decisions captured below; grey area INS-03 flagged for convergence review)

<domain>
## Phase Boundary

将 NPX 安装器 (`installer/`,npm 包 `@allanpk716/work-skills-setup`) 从"多技能安装+全环境配置"裁剪为"仅服务 claude-notify"。剥离与已删技能 (windows-git-commit、codepoint) 耦合的检测/配置/市场/卸载代码,保留 claude-notify 必需的 Windows 检测、Python/pip 检测、Pushover 配置、通知 hooks 注册、安装验证。裁剪后剩余 installer 测试全部通过。

**前置 (Phase 53 已完成):** windows-git-commit/、codepoint/、docs/codepoint/、docs/windows-git-commit/ 已删除;根元数据 (README/package.json) 已收窄;installer 做了"不破坏加载"级最小改动 (i18n verification 文案 + uninstall/detector.js PLUGIN_NAMES 已收窄为 `['claude-notify']`)。

**本阶段删除/裁剪目标 (INS-01..05):**
- `installer/src/detectors/git.js`、`installer/src/detectors/ssh-tools.js` (删)
- `installer/src/configurators/git-ssh.js`、`installer/src/configurators/git-user.js` (删)
- `installer/src/marketplace/` 整个目录 (删 — 多技能发现/安装,claude-notify 不依赖)
- `installer/src/uninstall/` (裁剪 — 见 INS-03 决策)
- `installer/src/detectors/index.js`、`installer/src/configurators/index.js`、`installer/src/index.js` (更新接线,移除对已删模块的 import 与调用)
- `installer/src/i18n/en.json`、`installer/src/i18n/zh.json` (移除 git/marketplace/多技能相关文案键)
- `installer/src/welcome.js` (横幅 feature 列表从 3 项收窄为 claude-notify)
- `installer/src/cli.js` (--uninstall 入口决策,见 INS-03)
- `installer/tests/` 中已删模块的测试文件 (删 — INS-05)

**保留 (不动):** `installer/src/detectors/python.js`、`installer/src/detectors/pip-package.js`、`installer/src/configurators/pushover.js`、`installer/src/hooks/` (hooks-installer.js = runHooksInstallation,notify-hooks-guard.js)、`installer/src/verification/`、`installer/src/installers/` (pip-installer.js)、`installer/src/platform.js`、`claude-notify/`(Phase 53 已确认自包含)。

</domain>

<decisions>
## Implementation Decisions

### INS-01: 检测器/配置器裁剪 (明确,无歧义)
- 删除 `detectors/git.js`、`detectors/ssh-tools.js`、`configurators/git-ssh.js`、`configurators/git-user.js`。
- `detectors/index.js`:`runAllDetectors` 的 `Promise.all` 从 4 项收为 2 项 `[detectPython(), detectPipPackage('requests')]`;主 `index.js` 中过滤 pip 安装候选的 `results.filter(r => r.name !== 'Python' && r.name !== 'Git' && !r.name.includes('TortoiseGit')...)` 简化为仅排除 Python(其余 Git/SSH 已不再产生 result)。
- `configurators/index.js`:`runAllConfigurators` 移除 Git SSH + Git User 两个步骤,仅保留 Pushover;`displayConfigSummary` 保留(Pushover 仍需)。
- 理由:Git/SSH/TortoiseGit 检测与配置仅服务于已删的 windows-git-commit (TortoisePlink/PuTTY 认证);claude-notify 只需 Python + requests。

### INS-02: marketplace 移除 (明确)
- 删除整个 `installer/src/marketplace/` 目录 (index.js, config-manager.js, plugin-discovery.js, plugin-installer.js)。
- 主 `index.js`:移除 `runMarketplaceIntegration` 的 import 与 Step 7 调用。
- **claude-notify 安装路径不受影响:** claude-notify 的 hook 注册由 `hooks/hooks-installer.js` (`runHooksInstallation`) 承担,技能本体通过 `npx skills add allanpk716/work-skills/claude-notify` 安装(Agent Skills 标准),不依赖 installer 的 marketplace 多技能发现机制。marketplace 仅用于发现/安装多个插件,单技能场景下冗余。
- 理由:marketplace 是多技能发现/安装机制;项目已回归单技能,且 `npx skills add` 是主安装方式。

### INS-03: uninstall 裁剪方式 (★ 关键设计决策 — 推荐"裁剪",交 convergence 复核 ★)
**推荐方案:裁剪 (trim) uninstall 为仅 claude-notify 组件,保留 `--uninstall` CLI 入口。**
- 保留 `uninstall/detector.js`、`uninstall/remover.js`、`uninstall/reporter.js`、`uninstall/formatter.js`、`uninstall/index.js`,但:
  - 移除 marketplace-source 组件检测(marketplace 已删,该类别失效)。
  - PLUGIN_NAMES 已为 `['claude-notify']` (Phase 53 完成);确保 detector 不再探测已删技能。
  - 保留 claude-notify 相关组件检测:plugin、notify hook scripts、notify hook registrations、notify slash commands、Pushover env vars。
- 保留 `cli.js` 的 `--uninstall` 选项与 `index.js` 的 runUninstall 分支。

**备选方案 (convergence 可提出):完全移除 uninstall/ 模块 + `--uninstall` 入口。**
- 更简单(少维护一个子系统),但丢失 claude-notify 的卸载 UX(用户无法一键清理 claude-notify 安装组件)。

**推荐裁剪而非移除的理由:** claude-notify 的卸载(plugin/hooks/commands/Pushover env 清理)仍是用户真实需求;保留 `--uninstall` 维持安装/卸载对称性;裁剪工作量与移除相近(都要处理 detector 对已删技能的引用)。但此为产品级决策,**若 codex/opencode convergence 复核认为"移除"更优或应交用户决定,则升级为用户决策**。

### INS-04: i18n + welcome 收窄 (明确)
- `i18n/en.json`、`i18n/zh.json`:移除与 git-ssh、git-user、TortoiseGit、PuTTY、marketplace、多技能安装相关、已删技能相关的文案键(detection/config/marketplace/uninstall 子树中对应条目)。保留 pushover、python、pip、hooks、verification、notify 相关键。移除后 JSON 必须合法且无孤立引用(被删键不能仍被代码 `t()` 引用)。
- `welcome.js`:feature 列表从 3 项(通知/Git/observability)收为 1 项(claude-notify 通知)。横幅文案更新为单一技能范围。

### INS-05: 测试裁剪 (明确)
- 删除已移除模块的测试文件:`tests/detectors/git.test.js`、`tests/detectors/ssh-tools.test.js`、`tests/config-git-ssh-*.js`、`tests/config-git-user-*.js`、`tests/configurators/git-ssh.test.js`、`tests/configurators/git-user.test.js`、`tests/configurators/unified-flow.test.js`(若仅测 git 配置流)、marketplace 相关测试、uninstall 测试(若 INS-03 选移除;若裁剪则保留并更新)。
- `tests/cli.test.js`、`tests/index.test.js`:更新以反映移除的 --uninstall/marketplace/git 检测行为。
- 剩余 installer 测试 (`jest`) 全部通过。
- 主 `index.js` 流程测试:更新对 runAllDetectors(2 项)、runAllConfigurators(仅 Pushover)、无 marketplace 步骤的预期。

### Claude's Discretion
- 具体测试文件删除清单的边界(unified-flow.test.js 是否含 pushover 流程而需保留部分)由 planner/executor 在读测试文件后判定。
- i18n 键删除后,自动 grep 确认无代码引用残留(`grep -rn "t('removed.key'" installer/src/`)。

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (保留模块)
- `detectors/python.js` (detectPython) — claude-notify 依赖 Python 3.8+
- `detectors/pip-package.js` (detectPipPackage) — 检测 requests 库
- `configurators/pushover.js` (configurePushover + detectPushoverFull) — Pushover 凭证配置与检测(uninstall 也复用 detectPushoverFull)
- `hooks/hooks-installer.js` (runHooksInstallation) — 注册全局通知 hooks(claude-notify 核心)
- `hooks/notify-hooks-guard.js` — hooks 防护
- `verification/` (parser.js 读 claude-notify/scripts/verify-installation.py 输出)
- `installers/pip-installer.js` — pip 安装 requests
- `platform.js` — Windows 检测

### Established Patterns
- CJS (require/module.exports),非 ESM — 保持不变
- i18n via `t()` 函数,en.json/zh.json 双语键
- `Promise.all` 并行检测,`runAll*` 聚合器模式
- commander CLI (cli.js),enquirer 交互

### Integration Points
- `installer/src/index.js` main() 流程:checkPlatform → parseArgs → [runUninstall if --uninstall] → [runVerification if --verify] → showWelcome → runAllDetectors → runInstaller(pip) → runAllConfigurators → **runMarketplaceIntegration (本阶段移除)** → runHooksInstallation(保留) → runVerification
- `cli.js`:`--uninstall` 选项 → index.js runUninstall 分支(INS-03 决策)
- `package.json` (根):`bin` → installer/bin/setup.js;`files: ["installer"]`;dependencies (boxen/chalk/commander/enquirer/execa/winreg)

### Phase 53 已做的最小改动 (本阶段在其上深化)
- `uninstall/detector.js` PLUGIN_NAMES → `['claude-notify']`
- `i18n/{en,zh}.json` verification.nextStep3/4 文案已收窄
- `uninstall/remover.js` JSDoc 注释已收窄

</code_context>

<specifics>
## Specific Ideas

- 安装器裁剪后,主流程应更简洁:Windows 检测 → 欢迎 → Python/pip 检测 → (pip 安装若缺) → Pushover 配置 → **hooks 注册** → 验证。无 marketplace、无 Git/SSH 配置。
- `welcome.js` 横幅应明确传达"安装 claude-notify 通知技能",不再提 Git workflow / observability。
- 根 `package.json` 的 `keywords`(Phase 53 已删 windows-git-commit/codepoint)与 `description`(已收窄)无需再动;`name` `@allanpk716/work-skills-setup` 保留(用户选择不改名)。版本号留给 Phase 55。

</specifics>

<deferred>
## Deferred Ideas

- npm 包改名 / 重新发布策略 → Out of Scope (用户明确保留包名)
- installer 架构重写 (如改 ESM、拆分 CLI 框架) → Out of Scope (仅裁剪,不重构设计)
- installer 的 `--quiet` 静默模式、配置导入导出 → 既往 Out of Scope,本里程碑不做
- `installer/package.json` 版本号升至 3.0.0 → Phase 55 (REL-03)

</deferred>
