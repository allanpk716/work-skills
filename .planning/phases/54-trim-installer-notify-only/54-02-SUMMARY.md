---
phase: 54-trim-installer-notify-only
plan: 02
subsystem: installer (NPX installer TESTS trim)
tags: [installer, trim, refactor, tests, jest, claude-notify]
requires:
  - phase: 54-trim-installer-notify-only (plan 01)
    provides: "Trimmed installer SOURCE (detectors/git.js, ssh-tools.js, configurators/git-ssh.js, git-user.js, marketplace/ deleted; uninstall/paths.js created exporting {getSkillsDir, isPluginInstalled}; uninstall subsystem scoped to single plugin claude-notify with 5 categories / 5 removal steps)"
provides:
  - "installer 测试树与裁剪后源码契约一致（2 detector / 1 configurator / 无 marketplace / uninstall 单 plugin + 无 marketplaceSource / paths.js mock）"
  - "Phase 54 SC5（RESCOPED：不引入新失败）满足 —— post-trim 失败套件 4 个，全部为 v3.0 前预存负债白名单，零新增失败"
  - "baseline-comparison 验证工件（54-02-baseline.txt + 54-02-posttrim.txt）"
affects: [Phase 55 (REL-01..04) — installer 测试树已稳定，可进入 README/CHANGELOG/版本同步/回归]
tech-stack:
  added: []
  patterns:
    - "CJS require/module.exports（不变）"
    - "paths.js mock 契约：detector.test.js 与 remover.test.js 均 jest.mock('../../src/uninstall/paths.js')，与 01 计划 NEW-MEDIUM-1 根因修复对齐（paths.js 仅导出 {getSkillsDir, isPluginInstalled}）"
key-files:
  created:
    - .planning/phases/54-trim-installer-notify-only/54-02-baseline.txt
    - .planning/phases/54-trim-installer-notify-only/54-02-posttrim.txt
  modified:
    - installer/tests/detectors/index.test.js
    - installer/tests/index.test.js
    - installer/tests/configurators/unified-flow.test.js
    - installer/tests/uninstall/detector.test.js
    - installer/tests/uninstall/remover.test.js
    - installer/tests/uninstall/formatter.test.js
    - installer/tests/uninstall/index.test.js
    - installer/tests/uninstall/reporter.test.js
  deleted:
    - installer/tests/detectors/git.test.js
    - installer/tests/detectors/ssh-tools.test.js
    - installer/tests/config-git-ssh-detect.js
    - installer/tests/config-git-ssh-guide.js
    - installer/tests/config-git-user-detect.js
    - installer/tests/configurators/git-ssh.test.js
    - installer/tests/configurators/git-user.test.js
    - installer/tests/marketplace/config-manager.test.js
    - installer/tests/marketplace/plugin-discovery.test.js
    - installer/tests/marketplace/plugin-installer.test.js
    - installer/tests/marketplace/（空目录）
    - installer/tests/run-all.js
decisions:
  - "run-all.js 选择删除（option b）而非裁剪为仅 pushover：config-pushover-*.js 为 pending-implementation 空壳，pushover 已有 jest 版 configurators/pushover.test.js 完整覆盖，runner 无测试价值"
  - "reporter.test.js 中 windows-git-commit 测试数据样本重命名为 extra-plugin（而非删除整行）：reporter 仅按 status 计数图标、不关心 plugin name，重命名保持用例计数与断言不变"
  - "unified-flow.test.js 顶层 process.exit IIFE 显式不修：v3.0 前预存负债（Jest 30 拦截 process.exit），经用户确认 out of scope，裁剪 git 用例后该套件仍因同一 IIFE 失败属可接受（非新增失败）"
patterns-established:
  - "baseline-comparison 闸门模式：当目标测试树为 RED 基线时，验收门为“post-trim 失败集合 ⊆ 基线失败集合”（零新增失败），而非“全部通过”"
requirements-completed: [INS-05]
coverage:
  - id: D1
    description: "已移除模块（git/ssh 检测、git 配置、marketplace）的 10 个测试文件已删除，tests/marketplace/ 空目录消失"
    requirement: INS-05
    verification:
      - kind: other
        ref: "Task 1 verify: test ! -f for all 10 files + test ! -d tests/marketplace — all PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "保留测试已更新以反映裁剪后源码：detectors/index 断言 2 项、index 无 marketplace、unified-flow 仅 pushover、uninstall/* 适配 paths.js + 单 plugin + 无 marketplaceSource"
    requirement: INS-05
    verification:
      - kind: unit
        ref: "installer/tests/detectors/index.test.js + installer/tests/index.test.js (jest 2 suites / 10 tests PASS)"
        status: pass
      - kind: unit
        ref: "installer/tests/uninstall/*.test.js (jest 5 suites / 52 tests PASS)"
        status: pass
    human_judgment: false
  - id: D3
    description: "NEW-MEDIUM-2：detector.test.js 与 remover.test.js 中无 readClaudeConfig/writeClaudeConfig/getConfigPath 残留引用"
    requirement: INS-05
    verification:
      - kind: other
        ref: "grep -nE 'readClaudeConfig|writeClaudeConfig|getConfigPath' installer/tests/uninstall/*.test.js — empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase 54 SC5（RESCOPED：不引入新失败）满足 —— post-trim 失败套件 4 个，全部在基线 4 套件白名单内，零新增失败"
    requirement: INS-05
    verification:
      - kind: other
        ref: "54-02-baseline.txt (10 failed) vs 54-02-posttrim.txt (4 failed) subset comparison; post-trim = {bin, verification/runner, pushover, unified-flow} ⊆ baseline"
        status: pass
    human_judgment: true
    rationale: "子集语义需人工确认 4 个失败套件均为预存白名单（grep 无法完全表达子集语义，见 54-02-PLAN Task 4 verify 注）；本 SUMMARY 已逐套件列出归属。"
duration: 14min
completed: 2026-06-26
status: complete
---

# Phase 54 Plan 02: trim-installer-notify-only (Wave 2 TESTS trim) Summary

裁剪 installer 测试树以匹配 01 计划裁剪后的源码：删除 10 个已移除模块（git/ssh 检测、git 配置、marketplace）的测试文件，更新 8 个保留测试以反映 2 detector / 1 configurator / 无 marketplace / uninstall 单 plugin + 无 marketplaceSource + paths.js mock 的新契约。post-trim jest 失败套件由 17 个（Wave 1 后源码已删、测试未修的峰值）降为 4 个，全部为 v3.0 前预存负债白名单（bin CRLF / verification python / pushover IIFE / unified-flow IIFE），**零新增失败**，满足 INS-05 RESCOPED 验收门。

## Performance

- **Duration:** 14 分钟
- **Started:** 2026-06-26T07:47:13Z
- **Completed:** 2026-06-26T08:00:52Z
- **Tasks:** 4
- **Files modified:** 8（修改）+ 12（删除，含空目录）+ 2（验证工件新建）

## Accomplishments

- **删除 10 个已移除模块的测试文件**（detectors/git + ssh-tools、config-git-ssh-detect/guide/user-detect、configurators/git-ssh + git-user、marketplace/config-manager + plugin-discovery + plugin-installer）+ tests/marketplace/ 空目录 —— 这些文件因引用 01 计划删除的源码模块而无法加载，删除后从失败计数中消失。
- **更新保留测试以匹配新契约**：detectors/index.test.js（2 detector + length===2）、index.test.js（无 marketplace mock）、unified-flow.test.js（仅 pushover 用例 + 清理 git cache helper）、uninstall/{detector,remover,formatter,index}.test.js（mock paths.js 而非 marketplace、单 plugin claude-notify、无 marketplaceSource、计数 9→6、{found,total} {8,8}/{0,8}/{3,8} → {6,6}/{0,6}/{3,6}）。
- **NEW-MEDIUM-2 修复**：删除 marketplace mock 后，detector.test.js 与 remover.test.js 中所有 readClaudeConfig/writeClaudeConfig/getConfigPath 残留引用（含 remover.test.js:115 的 "not toHaveBeenCalled" 断言）全部清理，避免 ReferenceError。
- **SC5 RESCOPED 闸门通过**：baseline-comparison 显示 post-trim 失败套件 4 个（bin / verification-runner / pushover / unified-flow）全部为预存白名单，零新增失败。

## Task Commits

每个任务原子提交：

1. **Task 1: 删除已移除模块的测试文件** — `07951a6` (test)
2. **Task 2: 更新 detectors/index、main index、unified-flow、删除 run-all runner** — `87591bd` (test)
3. **Task 3: 适配 uninstall 测试套件（paths.js + 单 plugin 契约）** — `492bf4c` (test)
4. **Task 4: baseline-comparison 验证闸门工件** — `12ebe53` (test)

## Baseline vs Post-trim Comparison（SC5 RESCOPED 闸门）

| 指标 | 基线（v3.0 前预存 RED） | Wave 1 后峰值（源码删、测试未修） | Post-trim（本计划后） |
|------|------------------------|-----------------------------------|----------------------|
| 失败套件数 | 10 | 17 | **4** |
| 失败测试数 | 8 | 9 | **5** |
| 通过套件数 | 20 | 13 | **19** |

**Post-trim 失败套件（4 个，全部预存白名单）：**

| 失败套件 | 失败原因 | 归属 |
|----------|---------|------|
| tests/bin.test.js | CRLF 行尾致 shebang `\r\n` ≠ `#!/usr/bin/env node` | 预存白名单（out of scope） |
| tests/verification/runner.test.js | python 脚本路径 `script_not_found`（环境问题） | 预存白名单（out of scope） |
| tests/configurators/pushover.test.js | 顶层 IIFE `process.exit(0)`，Jest 30 拦截 | 预存白名单（out of scope） |
| tests/configurators/unified-flow.test.js | 顶层 IIFE `process.exit(0/1)`，Jest 30 拦截 | 预存白名单（out of scope） |

**子集判定**：post-trim 失败集合 {bin, verification/runner, pushover, unified-flow} ⊆ 基线失败集合（含上述 4 个 + marketplace×3 + git-ssh + git-user + uninstall/detector 共 10 个）。基线中其余 6 个：marketplace×3 + git-ssh + git-user 因 Task 1 删除而消失（减少失败计数），uninstall/detector 因 Task 3 修复而转绿。**零新增失败**，闸门 PASS。

## Files Created/Modified

### 新建（验证工件）
- `.planning/phases/54-trim-installer-notify-only/54-02-baseline.txt` — 基线 npm test 输出（10 failed suites + 失败套件名单 + 4 白名单标注）
- `.planning/phases/54-trim-installer-notify-only/54-02-posttrim.txt` — post-trim 全量 npm test 输出（4 failed / 19 passed）

### 修改（保留测试）
- `installer/tests/detectors/index.test.js` — mock 从 4 detector → 2 detector（Python + requests），断言 results.length===2，删除 git/ssh mock+require+i18n 键
- `installer/tests/index.test.js` — 移除 jest.mock('../src/marketplace/index.js') 块（marketplace 已删）
- `installer/tests/configurators/unified-flow.test.js` — 删除 Test 2/3/13/14（git-user/git-ssh 用例）+ clearGitUserCache/clearGitSSHCache helper；Test 7 sampleResults 改为 Pushover 单元素；★ process.exit IIFE 预存负债未修（out of scope）
- `installer/tests/uninstall/detector.test.js` — mock paths.js 而非 marketplace/*；plugins 2→1（claude-notify）；删除 marketplaceSource 结构断言 + 3 个 marketplace 用例；删除所有 readClaudeConfig/getConfigPath 引用
- `installer/tests/uninstall/remover.test.js` — mock paths.js；fixtures 单 plugin + 无 marketplaceSource；移除计数 9→6（5 步 + 1 plugin）；删除 2 个 marketplace 专用用例；pluginCalls 2→1；删除 :115 readClaudeConfig 断言（NEW-MEDIUM-2）
- `installer/tests/uninstall/formatter.test.js` — 命令式删除 line 120 marketplace 类别断言（MEDIUM-3）；i18n mock 删除 marketplace 键；fixtures 单 plugin + 无 marketplaceSource
- `installer/tests/uninstall/index.test.js` — fixtures（2 helper + 内联 partial）单 plugin + 无 marketplaceSource；三对 {found,total} 重算为 {6,6}/{0,6}/{3,6}（MEDIUM-2）
- `installer/tests/uninstall/reporter.test.js` — windows-git-commit 测试数据样本重命名为 extra-plugin（Rule 2：Task 3 verify grep 要求 tests/uninstall/ 无 windows-git-commit）

### 删除（已移除模块的测试）
- `installer/tests/detectors/git.test.js`、`installer/tests/detectors/ssh-tools.test.js`
- `installer/tests/config-git-ssh-detect.js`、`installer/tests/config-git-ssh-guide.js`、`installer/tests/config-git-user-detect.js`
- `installer/tests/configurators/git-ssh.test.js`、`installer/tests/configurators/git-user.test.js`
- `installer/tests/marketplace/config-manager.test.js`、`installer/tests/marketplace/plugin-discovery.test.js`、`installer/tests/marketplace/plugin-installer.test.js`
- `installer/tests/marketplace/`（空目录）
- `installer/tests/run-all.js`（Phase 17 runner，依赖已删的 config-git-* 模块）

## Decisions Made

- **run-all.js 删除（option b）而非裁剪**：config-pushover-*.js 为 pending-implementation 空壳（"These will be implemented in Wave 1"），pushover 已有 jest 版 configurators/pushover.test.js 完整覆盖，runner 无测试价值。删除比裁剪更干净，避免保留依赖已删模块的代码路径。
- **reporter.test.js windows-git-commit 重命名而非删除**：reporter 仅按 status 计数图标（[v]/[x]/[-]），不关心 plugin name；将测试数据样本中的 windows-git-commit 重命名为 extra-plugin 保持用例计数与断言不变（3 个 [v]、{removed:2,failed:1,skipped:1} 等），同时满足 Task 3 verify grep（tests/uninstall/ 无 windows-git-commit）。
- **unified-flow.test.js process.exit IIFE 显式不修**：该 IIFE 是 Phase 17/20 遗留的手写 runner 模式（Jest 30 拦截测试文件内 process.exit），裁剪 git 用例后该套件仍因同一 IIFE 失败。这是 v3.0 前预存负债，经用户确认 out of scope（见 REQUIREMENTS.md Out of Scope 表）；裁剪后它在基线中本就失败，属可接受（非新增失败）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] reporter.test.js 清理 windows-git-commit 测试数据**
- **Found during:** Task 3（执行 Task 3 verify grep 时）
- **Issue:** 计划 Task 3 `<files>` 块未列出 reporter.test.js，但 Task 3 verify grep `! grep -q "windows-git-commit" installer/tests/uninstall/` 覆盖整个 uninstall 目录。reporter.test.js:45 与 :92 的 removalResults 测试数据样本含 windows-git-commit（Phase 53 已删技能），会使该 grep 闸门失败。
- **Fix:** 将两处 windows-git-commit 测试数据重命名为 extra-plugin（reporter 仅按 status 计数，不关心 plugin name，重命名不改变用例语义与计数）。
- **Files modified:** installer/tests/uninstall/reporter.test.js
- **Verification:** `grep -rn "windows-git-commit" installer/tests/uninstall/` 无命中；`npx jest tests/uninstall/` 5 suites / 52 tests 全绿。
- **Committed in:** 492bf4c（Task 3 commit）

**2. [Rule 3 - Blocking] 清理 detector.test.js / remover.test.js 注释中的 marketplace 字样**
- **Found during:** Task 3（执行 Task 3 verify grep 时）
- **Issue:** Task 3 verify grep `! grep -rn "marketplace" installer/tests/uninstall/` 是严格匹配（含注释）。执行器在 detector.test.js 与 remover.test.js 的注释中提及 "paths.js replaces marketplace" / "no marketplaceSource" 会使该 grep 失败。
- **Fix:** 改写注释，去除 marketplace 字样（如 "Phase 54: paths.js provides plugin detection helpers"），保持注释语义但满足 grep 闸门。
- **Files modified:** installer/tests/uninstall/detector.test.js、installer/tests/uninstall/remover.test.js
- **Verification:** `grep -rn "marketplace" installer/tests/uninstall/` 无命中。
- **Committed in:** 492bf4c（Task 3 commit）

---

**Total deviations:** 2 auto-fixed（1 missing critical、1 blocking）
**Impact on plan:** 均为满足计划自身的 verify grep 闸门而做的机械性清理，无 scope creep。reporter.test.js 的 windows-git-commit 清理是计划 files 块的遗漏（Task 3 verify 覆盖整个 uninstall 目录），属 Rule 2 的关键功能补全。

## Known Stubs

无。本计划为测试裁剪（删除/修改测试文件），无新增数据流或占位实现。unified-flow.test.js 的 process.exit IIFE 是预存负债（已在 Decisions 中声明 out of scope），非本计划引入的 stub。

## Threat Flags

无新增安全面。本计划仅删除/修改测试文件，未引入新的网络端点、认证路径、文件访问模式或信任边界 schema 变更。

## Scope Fences Honored

- **4 个预存失败套件未修**：bin.test.js（CRLF）、verification/runner.test.js（python 路径）、pushover.test.js（process.exit IIFE）、unified-flow.test.js（process.exit IIFE）—— 全部为 v3.0 前预存负债，经用户确认 out of scope（见 REQUIREMENTS.md Out of Scope 表）。本计划裁剪 unified-flow.test.js 的 git 用例但**不**修其 IIFE。
- **package.json version 未动** —— 留给 Phase 55（REL-03）。
- **installer/src/ 未动** —— Wave 1（54-01）已完成源码裁剪，本波仅动 tests/。
- **CJS only** —— 全部修改使用 require/module.exports，无 ESM。
- **NEW-MEDIUM-2 强制满足** —— `grep -nE "readClaudeConfig|writeClaudeConfig|getConfigPath" installer/tests/uninstall/*.test.js` 无命中（marketplace mock 删除后这些 helper 引用全部清理，避免 ReferenceError）。

## TDD Gate Compliance

不适用。本计划 `type: execute`（非 `type: tdd`），且任务为测试文件裁剪/迁移，无 `<behavior>` 块。NEW-MEDIUM-2 的残留引用扫描（grep 守卫）是运行时断言验证。

## Self-Check: PASSED

**Created files exist:**
- FOUND: .planning/phases/54-trim-installer-notify-only/54-02-baseline.txt
- FOUND: .planning/phases/54-trim-installer-notify-only/54-02-posttrim.txt

**Modified files exist (jest-verified):**
- FOUND: installer/tests/detectors/index.test.js（jest 2 suites / 10 tests PASS）
- FOUND: installer/tests/index.test.js（同上）
- FOUND: installer/tests/configurators/unified-flow.test.js（grep 无 git refs；IIFE 预存失败属预期）
- FOUND: installer/tests/uninstall/detector.test.js（jest 5 suites / 52 tests PASS）
- FOUND: installer/tests/uninstall/remover.test.js（同上）
- FOUND: installer/tests/uninstall/formatter.test.js（同上）
- FOUND: installer/tests/uninstall/index.test.js（同上）
- FOUND: installer/tests/uninstall/reporter.test.js（同上）

**Deleted files verified gone:** 10 测试文件 + tests/marketplace/ 空目录 + run-all.js 均物理消失（Task 1 + Task 2 verify 确认）。

**Commits exist (git log --oneline):**
- FOUND: 07951a6（Task 1）
- FOUND: 87591bd（Task 2）
- FOUND: 492bf4c（Task 3）
- FOUND: 12ebe53（Task 4）

**Gate verified:** post-trim 失败套件 4 个（bin / verification-runner / pushover / unified-flow）全部在基线 4 套件白名单内，零新增失败。`node -e "require('./installer/src/index.js')"` 退出码 0。

## Next Phase Readiness

- installer 测试树已与裁剪后源码稳定一致，Phase 54（INS-01..05）全部 Complete。
- Phase 55（REL-01..04）可进入：README/CHANGELOG 更新、package.json 版本同步升至 3.0.0、git tag v3.0、claude-notify Python 测试回归验证（REL-04）。
- 无阻塞项。4 个预存失败套件为已知 v3.0 前负债，不影响 Phase 55 发版（属未来单独的预存负债清理工作）。

---
*Phase: 54-trim-installer-notify-only*
*Completed: 2026-06-26*
