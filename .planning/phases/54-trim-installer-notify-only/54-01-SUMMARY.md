---
phase: 54-trim-installer-notify-only
plan: 01
subsystem: installer (NPX installer source trim)
tags: [installer, trim, refactor, breaking-change, claude-notify]
requires:
  - "Phase 53 (remove-deprecated-skills) — PLUGIN_NAMES already narrowed to ['claude-notify']; i18n verification text already narrowed"
provides:
  - "installer/src/uninstall/paths.js — getSkillsDir/isPluginInstalled helpers (migrated from deleted marketplace)"
  - "Trimmed installer source tree that loads via require('./installer/src/index.js')"
  - "runAllDetectors (2 items: Python + requests), runAllConfigurators (Pushover only)"
  - "uninstall subsystem scoped to claude-notify components (5 categories, 5 removal steps)"
affects:
  - "installer/src/index.js main() flow (no marketplace step; pip filter narrowed)"
  - "installer/tests/ — NOT modified this wave; tests referencing deleted marketplace modules will fail until plan 54-02 (Wave 2)"
tech-stack:
  added: []
  patterns:
    - "CJS require/module.exports (unchanged)"
    - "NEW-MEDIUM-1 root-cause fix: paths.js exports ONLY actually-consumed helpers (no dead exports)"
key-files:
  created:
    - installer/src/uninstall/paths.js
  modified:
    - installer/src/detectors/index.js
    - installer/src/configurators/index.js
    - installer/src/uninstall/detector.js
    - installer/src/uninstall/remover.js
    - installer/src/uninstall/formatter.js
    - installer/src/uninstall/index.js
    - installer/src/index.js
    - installer/src/welcome.js
    - installer/src/i18n/en.json
    - installer/src/i18n/zh.json
  deleted:
    - installer/src/detectors/git.js
    - installer/src/detectors/ssh-tools.js
    - installer/src/configurators/git-ssh.js
    - installer/src/configurators/git-user.js
    - installer/src/marketplace/index.js
    - installer/src/marketplace/config-manager.js
    - installer/src/marketplace/plugin-discovery.js
    - installer/src/marketplace/plugin-installer.js
decisions:
  - "INS-03 采用裁剪 (trim) 而非完全移除 uninstall/：保留 --uninstall 入口与 claude-notify 组件清理 (plugin/hooks/commands/Pushover env)，移除 marketplace source 检测/移除类别"
  - "NEW-MEDIUM-1 根因修复：paths.js 仅导出 {getSkillsDir, isPluginInstalled} —— 另 3 个 config helper (readClaudeConfig/writeClaudeConfig/getConfigPath) 在 uninstall 下零消费者，不迁移以免死导出"
  - "Rule 3 偏离：remover.js 删除 Step 5 (marketplace cache) 后 os require 变为死 import，同步移除 (与 NEW-MEDIUM-1 同型对称清理)"
metrics:
  duration: 11m
  completed: 2026-06-26T07:39:04Z
  tasks: 4
  files_created: 1
  files_modified: 10
  files_deleted: 8
  net_loc: -1015
status: complete
---

# Phase 54 Plan 01: trim-installer-notify-only (Wave 1 SOURCE trim) Summary

裁剪 NPX 安装器源码 (installer/src/) 为仅服务 claude-notify 单技能：删除 git/ssh 检测器+配置器、删除整个 marketplace 目录、裁剪 uninstall 模块并迁移 paths.js、收窄 i18n 与 welcome 横幅。主入口 `require('./installer/src/index.js')` 加载通过，uninstall 仍可用，--uninstall 入口保留。

## What Was Built

### Task 1 — 删除 git/ssh 检测器+配置器，裁剪聚合器 (INS-01) [commit c1fb2fd]
- `git rm` 删除 4 个模块：`detectors/git.js`、`detectors/ssh-tools.js`、`configurators/git-ssh.js`、`configurators/git-user.js`（仅服务于已删的 windows-git-commit）
- `detectors/index.js`：`runAllDetectors` 的 `Promise.all` 从 4 项 (Python/Git/SSH/requests) 收为 2 项 (Python + requests)，移除 `detectGit`/`detectSSHTools` import
- `configurators/index.js`：`runAllConfigurators` 移除 Git SSH + Git User 两个步骤，仅保留 Pushover；`displayConfigSummary` 导出保留

### Task 2 — 迁移 paths.js + 裁剪 uninstall 模块 (INS-03) [commit 5502c67]
- 新建 `installer/src/uninstall/paths.js`，**仅**导出 `{getSkillsDir, isPluginInstalled}`（NEW-MEDIUM-1 根因修复：3 个 config helper 在 uninstall 下零消费者，不迁移）
- `detector.js`：import 改为 `const { isPluginInstalled, getSkillsDir } = require('./paths.js')`；移除 Category-5 marketplace 检测块与 `marketplaceSource` 返回字段；`hasAnyInstalled` 聚合表达式删去 marketplace 项；JSDoc 从 7 类更新为 5 类
- `remover.js`：import 改为 `const { getSkillsDir } = require('./paths.js')`；删除 Step 5 (Marketplace Cache) 与 Step 6 (Marketplace Source)；保留 5 步；移除因 Step 5 删除而变死的 `os` require（Rule 3 偏离，见 Deviations）；JSDoc 从 7 步更新为 5 步
- `formatter.js`：移除 "Marketplace Source" 类别渲染块
- `index.js`：`countTotal` 公式 `plugins.length + 6` → `plugins.length + 5`；`countInstalled` 移除 `marketplaceSource` 项；注释从 "2 plugins + ... = 8" 更新为 "1 plugin (claude-notify) + ... = 6"

### Task 3 — 物理删除 marketplace 目录，裁剪主 index.js (INS-02, INS-03) [commit 41513d5]
- `git rm -r installer/src/marketplace/` 删除整个目录（4 文件：index.js / config-manager.js / plugin-discovery.js / plugin-installer.js）
- `index.js`：移除 `runMarketplaceIntegration` import 与 Step 7 调用；原 Step 7.5 重编号为 Step 7
- `index.js`：Step 5 pip 过滤收窄 —— 从排除 `Python/Git/TortoiseGit/PuTTY/SSH` 简化为仅排除 `Python`（detectors 已不再产出 Git/TortoiseGit/PuTTY/SSH 结果）
- `cli.js`：zero-touch（`--uninstall` 选项与 `uninstallOnly` 字段保留，描述文案已足够通用）

### Task 4 — 收窄 i18n + welcome 横幅 (INS-04) [commit 9a73f2e]
- `en.json` / `zh.json` 删除约 50 个 git/marketplace/多技能键（en 与 zh 同步）：`guidance.installGit/installTortoiseGit/installPuTTY/installSSHTools`、`ssh.*` (3 键)、`config.section.gitSSH/gitUser`、全部 `gitSSH.*` (12 键)、全部 `gitUser.*` (12 键)、全部 `marketplace.*` (21 键)、`uninstall.category.marketplace`、`uninstall.item.marketplaceSource`、`welcome.feature2`、`welcome.feature3`
- `welcome.feature1` 改为 claude-notify 通知语义（en+zh）；`welcome.subtitle` 收窄为单技能语义（en+zh）；`welcome.title` 保持 "Work Skills" 不变
- `welcome.js`：features 数组从 3 项收为 1 项（仅 `welcome.feature1`）

## Verification Results

计划层 `<verification>` 5 项闸门全部 PASS：

| 闸门 | 结果 |
|------|------|
| V1: `node -e "require('./installer/src/index.js')"` 退出码 0 | PASS |
| V2: `test ! -d installer/src/marketplace` | PASS（目录消失） |
| V3: detectors/git.js、ssh-tools.js、configurators/git-ssh.js、git-user.js 均不存在 | PASS |
| V4: detectors/configurators/uninstall 各模块 require 不抛异常 | PASS |
| V5: en.json / zh.json 合法 JSON 且无已删键 | PASS |

附加验证：
- `paths.js` 导出恰好 `{getSkillsDir, isPluginInstalled}`（无死 config helper）
- `grep require.*marketplace installer/src/uninstall/` 无命中
- `grep marketplaceSource installer/src/uninstall/{detector,remover}.js` 无命中
- `grep "Marketplace Cache\|Marketplace Source" remover.js` 无命中
- `grep uninstall.category.marketplace formatter.js` 无命中
- `grep runMarketplaceIntegration\|marketplace installer/src/index.js` 无命中
- `grep "TortoiseGit\|PuTTY\|'Git'\|includes('SSH')" installer/src/index.js` 无命中
- 孤立 `t()` 引用扫描：`grep -rnE "t\('(gitSSH\.|gitUser\.|marketplace\.|...)"` 在 `installer/src/` 无命中
- `cli.js` `parseArgs(['--uninstall']).uninstallOnly === true`
- `welcome.js` 渲染输出含 claude-notify 语义（实测 banner 正确）

**关于 jest 测试**：本波 (Wave 1) 不运行全量 jest —— 计划明确将测试裁剪归为 54-02 (Wave 2)。`installer/tests/` 中引用已删 marketplace 模块的测试此时会失败是**预期的**，由 54-02 修复。源码加载闸门 (V1/V4) 是本波的判定标准，全部通过。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking dead import] 移除 remover.js 中变死的 `os` require**
- **Found during:** Task 2（裁剪 remover.js Step 5 后）
- **Issue:** Step 5 (Marketplace Cache) 使用 `os.homedir()` 构造 cache 目录路径；删除 Step 5/6 后，`os` 在 remover.js 中不再有任何调用点（`getSkillsDir()` 已迁移到 paths.js，其内部自行 require os）。保留 `const os = require('os')` 即为死 import。
- **Fix:** 移除 remover.js 顶部的 `const os = require('os');` 一行。
- **Files modified:** installer/src/uninstall/remover.js
- **Commit:** 5502c67
- **Rationale:** 与 NEW-MEDIUM-1（detector.js/remover.js 不引入死 import）同型的对称清理。计划 `<action>` step 3 未显式枚举此 os require（仅说 import 改指向 paths.js 并移除 marketplace requires），但留下死 import 违反 NEW-MEDIUM-1 的根因修复精神。属 Rule 3（阻碍任务完成的清理）而非 Rule 4（架构变更）。

**2. [计划明确许可] cli.js zero-touch**
- 计划 Task 3 step 3 明确说 "本 Task 对 cli.js 原则上 zero-touch；如执行器发现无必要改动则跳过"。执行器确认 cli.js 描述文案已足够通用（"Work Skills Setup - Claude Code skills installer for Windows developers"），`--uninstall` 选项保留，无需改动。

## Known Stubs

无。本计划为源码裁剪（删除/收窄），无新增数据流或占位实现。所有保留模块（python/pip-package/pushover/hooks/verification）的数据源在 Phase 53 已确认自包含。

## Threat Flags

无新增安全面。本计划仅删除代码（detectors/configurators/marketplace）与收窄文案，未引入新的网络端点、认证路径、文件访问模式或信任边界 schema 变更。`uninstall/paths.js` 的 `getSkillsDir`/`isPluginInstalled` 是从已删 marketplace 原样迁移（实现 byte-equivalent），不引入新行为。

## Scope Fences Honored

- **paths.js exports ONLY {getSkillsDir, isPluginInstalled}** — 实测 `Object.keys(paths) === ['getSkillsDir','isPluginInstalled']`，无 config helper（NEW-MEDIUM-1 根因）。
- **detector.js imports {isPluginInstalled, getSkillsDir}** — 实测匹配。
- **remover.js imports {getSkillsDir} ONLY** — 实测匹配。
- **installer/tests/ UNTOUCHED** — `git diff --name-only HEAD~4 HEAD -- installer/tests/` 输出为空。
- **CJS only** — 全部新增/修改文件使用 require/module.exports，无 ESM。
- **package.json version 未动** — 留给 Phase 55 (REL-03)。

## TDD Gate Compliance

不适用。本计划 `type: execute`（非 `type: tdd`），且任务为源码裁剪/迁移，无 `<behavior>` 块。NEW-MEDIUM-1 的根因修复（paths.js 仅导出实际使用的 helper）已在源码层通过 `Object.keys()` 运行时断言验证。

## Self-Check: PASSED

**Created files exist:**
- FOUND: installer/src/uninstall/paths.js

**Commits exist (git log --oneline):**
- FOUND: c1fb2fd (Task 1)
- FOUND: 5502c67 (Task 2)
- FOUND: 41513d5 (Task 3)
- FOUND: 9a73f2e (Task 4)

**Deletions verified:** 8 文件删除（4 git/ssh 模块 + 4 marketplace 模块）均为计划预期的有意删除，无意外删除。

**Scope fences verified:** tests/ 未动；paths.js 导出恰好 2 个 helper；index.js require 加载通过。
