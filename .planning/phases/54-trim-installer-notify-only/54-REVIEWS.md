---
phase: 54
reviewers: [codex, opencode]
reviewed_at: 2026-06-26T05:04:03Z
plans_reviewed:
  - 54-01-PLAN.md
  - 54-02-PLAN.md
baseline_test_state: "RED — 10 failed suites / 8 failed tests (jest@30.3.0); see Consensus HIGH-1"
cycle_focus: "convergence (codex + opencode) — INS-03 TRIM-vs-remove decision + marketplace→paths.js migration completeness + i18n safety + verification gate achievability"
---

# Cross-AI Plan Review — Phase 54 (trim-installer-notify-only)

本评审由 codex 与 opencode 两位外部 AI 独立完成，针对 Wave 1（54-01，源码裁剪）与 Wave 2（54-02，测试裁剪 + jest 回归）两份计划。两位评审均**在仓库工作树内逐条核对源码**（file:line 证据），opencode 额外实跑了当前 jest 基线。

> **关键背景（两位评审独立发现，已由本评审者实跑 `cd installer && npm test` 复核确认）：当前 `installer` 测试树基线为 RED。** 实测结果：`Test Suites: 10 failed, 20 passed, 30 total` / `Tests: 8 failed, 155 passed, 163 total`。详见下方 Consensus HIGH-1。这意味着 54-02 计划的 `npm test exits 0` 验收闸门在当前条件下**不可达成**，必须重新界定范围或显式处理遗留失败。

---

## Codex Review

### Verification caveat (codex)
Codex 的沙箱阻止了 jest 的 haste-map 临时写入（`EPERM` on `...\Temp\jest\haste-map-*`），**无法实跑 jest**。所有 pass/fail 判断均为源码级推演（如固定数组长度不匹配），非运行时确认。codex 因此未发现 `pushover.test.js` / `bin.test.js` / `verification/runner.test.js` 的预存在失败（这些由 opencode 实跑发现）。

#### Foundational finding (codex)
即便不跑 jest，codex 通过静态分析发现 **`uninstall/detector.test.js` 在 Phase 53 后已红**：`detector.test.js:56` 断言 `result.plugins.toHaveLength(2)` 与 `detector.test.js:59` 断言 `plugins[1].name === 'windows-git-commit'`，但 `src/uninstall/detector.js:7` 已是 `PLUGIN_NAMES = ['claude-notify']`（Phase 53 收窄了源码未收窄测试）。"baseline tests pass" 前提为假；`npm test` 是 Phase 54 的**目标终态**而非起点。54-02 修复了它，但两份计划都未承认这个预存在红。（本评审者实跑确认：`detector.test.js` 当前 3 个失败。）

---

### PLAN 54-01 (Wave 1 — 源码裁剪) — Codex

**Summary**
结构良好、顺序正确的裁剪。marketplace→paths.js 迁移完整且范围精确（5 个需要的 helper 全到位，`registerMarketplaceSource` 正确丢弃），`countTotal` 算术正确，INS-03 TRIM 决策合理，CJS 得到保持。主要缺口较小：`detector.js` 有两个被处方但实际未使用的 import，`remover.js` 的 `os` import 将变为死代码，以及计划未标注 hooks 模块合法地仍引用 "marketplace" 作为**文件系统路径**（非已删模块）——这是过度热心的执行者可能踩到的坑。

**Strengths**
- 迁移可证明完整。`detector.js:3` 需要 `isPluginInstalled, getSkillsDir`；`detector.js:5` 需要 `readClaudeConfig, getConfigPath`；`remover.js:19` 需要 `readClaudeConfig, writeClaudeConfig`；`remover.js:23` 需要 `getSkillsDir`。这恰好是 Task 2 迁移的 5 个 helper。`registerMarketplaceSource`（`config-manager.js:53`）在 marketplace 删除后无调用者（仅 `marketplace/index.js:6` 调用，该文件被删）——正确丢弃。
- 顺序安全。Task 1 裁剪聚合器，Task 2 重接 uninstall→paths.js，Task 3 最后删 marketplace。每个中间态 `require('./installer/src/index.js')` 都能解析。无断裂中间态。
- `countTotal` 算术正确。`uninstall/index.js:35` 为 `plugins.length + 6`（1 hooks + 1 hookReg + 1 commands + 1 marketplace + 2 env）。去掉 marketplace → `+5`。单 plugin（`detector.js:7`）下 total=6。`countInstalled` 第 21 行 marketplace 行一致移除。
- i18n 删除范围准确。codex 计数 `zh.json` 中 `marketplace.*|gitSSH.*|gitUser.*|ssh.*` = 48 = 21+12+12+3，与 CONTEXT 完全吻合。`t()` 回退（`i18n/index.js:62`）在 miss 时返回原始 key，故孤立引用不会*崩溃*——但 Task 4 的 grep 校验仍是正确的严谨度。
- CJS 保持：`package.json` 无 `"type"` 字段；Task 2 显式指定 `paths.js` 为 CJS 带 `'use strict'`。无 ESM 泄漏。
- INS-03 TRIM 是正确决策（见 Cross-Plan）。`reporter.js` 正确未动（完全泛型于 results 数组——无 category 逻辑）。

**Concerns**

- **MEDIUM — `uninstall/detector.js` 死 import 处方。** Task 2 处方 `const { isPluginInstalled, getSkillsDir, readClaudeConfig, getConfigPath } = require('./paths.js')`。但移除 marketplace 块（`detector.js:43-46`）后，`readClaudeConfig`/`getConfigPath` 在 detector.js 中不再被任何地方使用——仅 `isPluginInstalled`（`detector.js:16`）与 `getSkillsDir`（`detector.js:17`）存活。计划按字面会交付两个未使用 import。修复：仅 import `{ isPluginInstalled, getSkillsDir }`。
- **LOW — `uninstall/remover.js` 的 `os` import 变死。** `remover.js:14` `require('os')` *仅*被 Step 5（`remover.js:98` `os.homedir()`）使用。Task 2 删 Step 5 后，`os` 未使用（`path`/`fs`/`execa` 仍用）。运行时无害；lint 洁癖。注意计划说 paths.js 需要 `os`（正确——用于 homedir）但未告诉 remover.js 丢弃自己的 `os` require。
- **LOW — "marketplace" 字符串按设计存留于 KEPT hooks 模块。** `hooks-installer.js:218-227` `cleanMarketplaceCache()` 与 `hooks/index.js:31` 引用 `~/.claude/plugins/marketplaces/work-skills/...`。这是 Claude Code 自身插件加载器创建的*文件系统清理路径*（防止重复 notify hooks），**不是**已删的 marketplace *集成模块*。计划正确未动 hooks/，54-02 残留扫描只 grep `require.*marketplace`（hooks 不做）——闸门范围正确。标注以免执行者"热心地" ripping 它出来并破坏重复通知防护。
- **LOW — 预存在红基线未文档化。** 54-01 验收注释说旧测试"会因模块删除而失败"，但未指出 detector.test.js 在 Phase 53 后*已*红。以绿基线度量进度的执行者会困惑。

**Suggestions**
- 将 Task 2 step 2 处方的 detector.js import 改为仅 `{ isPluginInstalled, getSkillsDir }`。
- 在删除 Step 5 旁加一个显式"丢弃 `require('os')` from remover.js"子步骤。
- 在 54-01 加一行说明 uninstall detector 测试在当前 commit 已红，让执行者正确设定期望。

**Risk Assessment — LOW/MEDIUM**
LOW 于正确性（裁剪逻辑健全且自洽），MEDIUM 仅因这是破坏性多文件删除，安全性取决于 Task 2→3 顺序被顺序执行。verify 闸门（`require` load + grep）足以捕捉遗漏的重接。

---

### PLAN 54-02 (Wave 2 — 测试) — Codex

**Summary**
正确识别每个断裂的测试文件并处方正确编辑。fixture 数学（9→6 移除结果、total 8→6、plugins 2→1）对照裁剪后源码追踪正确。主要风险是手写 `unified-flow.test.js` 与 `index.test.js` 计数重算的欠规范，执行者必须重算计划留作隐式的若干 `found`/`total` 对。计划也正确未动 `reporter.test.js`、`i18n.test.js`、`welcome.test.js`。

**Strengths**
- 准确映射每个断裂测试。`detectors/index.test.js:56` `toHaveLength(4)` → 2；`index.test.js` marketplace mock 移除；`remover.test.js` `toBe(9)`（`lines 88/92/107/109`）→ `toBe(6)`；`pluginCalls` 过滤丢弃 `windows-git-commit` 且 `toBe(2)→toBe(1)`。全部与裁剪后源码一致。
- `paths.js` mock 迁移完整：detector.test.js 与 remover.test.js 都从 `../../src/marketplace/*` mock 切换到单一 `../../src/uninstall/paths.js` mock，匹配 54-01 新 import 目标。
- 正确观察到裁剪后 `detector.js` 不再调用 `readClaudeConfig`，故 `detector.test.js` 的 `expect(readClaudeConfig).toHaveBeenCalled()` 必须移除——正确，因唯一 `readClaudeConfig` 调用点（`detector.js:43` marketplace 块）已删。
- 正确未动 `reporter.test.js`（仅 mock `uninstall.remove.summary`；reporter 泛型）与 `i18n.test.js`（仅引用 `welcome.title` + `nonexistent.key`）。
- Task 4 残留扫描 `! grep -rn "require.*marketplace" src tests` 是正确的最终闸门，能捕捉任何遗漏重接。

**Concerns**

- **HIGH — `unified-flow.test.js` 是非 Jest 手写 runner，但 Jest 仍收集它。** 它用自己的 `test()`/`assert`（`lines 11-31`）带尾部自执行 `Promise.all(...)` 摘要可 `process.exit`。因文件名匹配 `*.test.js`，Jest 运行它。它在测试体内 `require` 已删模块（`line 114` `git-user.js`，`lines 132/377` `git-ssh.js`）。删 Tests 2/3/13/14（Task 2 step 3）正确，但计划还须保证尾部摘要/exit 块在失去 4 个测试后仍干净终止——计划说"保持摘要块不变"，这*仅当*块动态派生计数（`testCount`/`passCount` 每次 `test()` 调用递增）时才 OK。值得显式复查，因 Jest 运行中途的游离 `process.exit` 可掩盖其他套件失败。**（本评审者注：实跑确认该套件当前报 "Test suite failed to run — must contain at least one test"，正是 Jest 30 不识别自定义 `test()` 的问题；详见 Consensus HIGH-1。）**
- **MEDIUM — `uninstall/index.test.js` 计数重算留作隐式。** 该文件断言 `{found:8,total:8}`、`{found:0,total:8}`、`{found:3,total:8}`。54-01 后 countTotal = `plugins.length+5`。计划说"total=6"，但 fixture 当前带 2 plugins + `marketplaceSource`；执行者必须 (a) 把 fixture 降到 1 plugin 并移除 `marketplaceSource`，且 (b) 重算 `found`：all-installed 8→6、nothing 0、partial 仍为 3（claude-notify + hooksScripts + token）。计划陈述"total=6"而未枚举这些， invites 算术滑错。grep 闸门 `! grep "marketplace" tests/uninstall/` 至少会强制 `marketplaceSource` 移除。
- **（codex 未发现 pushover.test.js 同病——因沙箱禁 jest。opencode 补强，见下。）**

**Suggestions**
- 在 Task 3 step 4 为 `index.test.js` 加显式重算表：列出 1-plugin/no-marketplace fixture 变更后的全部三对 `{found,total}`。
- 使 Task 3 step 3 命令式："移除 `expect(t).toHaveBeenCalledWith('uninstall.category.marketplace')` 行"而非条件式。
- 若保留 run-all.js（option a），加一条 verify 行 `node tests/run-all.js` exits 0。

**Risk Assessment — MEDIUM**
编辑方向正确，但套件无法在此环境证明全绿，且两个测试文件（`unified-flow.test.js`、`index.test.js`）有计划留给执行者的重算。仔细的执行者按计划成功；仓促的可在计数断言中交付算术漂移。

---

## OpenCode Review

### Verification note (opencode)
Opencode **实跑了当前 jest 套件**建立基线：`10 failed suites / 8 failed tests`，这实质影响了评审。所有发现均追踪到 `file:line`。

---

### PLAN 54-01 (Wave 1 — 源码裁剪) — OpenCode

**Summary**
结构良好的裁剪计划。marketplace→uninstall 耦合迁移顺序正确，5-helper 集完整。`countTotal`/`countInstalled` 算术核对通过。主要缺口是 KEPT `hooks/` 模块中留下一组 "marketplace cache" 引用，以及计划继承了 Phase 53 后本已错误的陈旧注释。INS-03（TRIM）是可辩护的决策。

**Strengths**
- **迁移顺序健全。** Task 2 创建 `uninstall/paths.js` 并重接 `detector.js`/`remover.js` *先于* Task 3 `git rm -r marketplace`。避免了 `require('../marketplace/...')` 解析到已删文件的窗口。
- **5-helper 迁移完整。** 追踪 uninstall 模块每个 `require('../marketplace/...')`：
  - `uninstall/detector.js:3` 需 `{isPluginInstalled, getSkillsDir}`（自 plugin-installer），`:5` 需 `{readClaudeConfig, getConfigPath}`（自 config-manager）。
  - `uninstall/remover.js:17-19` 需 `{readClaudeConfig, writeClaudeConfig}`，`:22-23` 需 `{getSkillsDir}`。
  - 并集 = `{getSkillsDir, isPluginInstalled, getConfigPath, readClaudeConfig, writeClaudeConfig}` —— 恰为计划迁移的 5 个。无第 6 个 helper 遗留。
- **`registerMarketplaceSource` 正确排除** —— 唯一调用者是 `marketplace/index.js:77`（整目录删除）。无孤儿。
- **`countTotal` 算术正确。** `uninstall/index.js:35` 当前 `plugins.length + 6`；移除单一 `marketplaceSource` 类别后，类别 = plugins + hooksScripts + hooksRegistered + commandsInstalled + envVars.token + envVars.user = `N + 5`。`+6 → +5` 正确。
- **`countInstalled` 一致** —— 移除 `index.js:21` 匹配。
- **Step 5 pip-filter 收窄正确。** `index.js:44-47` 过滤 Python/Git/TortoiseGit/PuTTY/SSH；detector 裁剪后仅 `Python` + `requests` 残留，故 `r.name !== 'Python'` 正确保留 pip 行。死 Git/SSH 条件无害但计划移除它们。
- **`reporter.js` 正确未动** —— 核实 `reporter.js:1-62` 是泛型 result-driven 格式化器，零 marketplace 引用（连 JSDoc param 都没有）。
- **i18n 删除安全。** 每个被删 key 仅被计划删除/裁剪的文件引用。Task 4 grep 校验是正确保险。

**Concerns**

- **[MEDIUM] marketplace 引用留在 KEPT `hooks/` 模块。** `hooks-installer.js:222` 定义 `cleanMarketplaceCache()`；`:218` JSDoc "Clean up stale marketplace hooks"；`:224,:227` 硬编码 `.claude/plugins/marketplaces/work-skills/...`；`:309` "Clean marketplace cache"；`hooks/index.js:31` 打印 "Cleaning up marketplace cache..."。计划从不触碰这些。*功能上*它们仍工作（路径是 Claude Code 运行时工件，不依赖已删 `marketplace/` 源码模块），故不会断 `require`。但这与 Phase 目标"marketplace 耦合剥离"矛盾且留下误导文案。建议加一行注释澄清或显式 deferral 说明。
- **[LOW] 继承自 Phase 53 的陈旧注释。** `uninstall/index.js:33-34` 注释说 "= 8" 假设 2 plugins，但 `detector.js:8` 已是 `PLUGIN_NAMES = ['claude-notify']`（1 plugin），故*当前* total 已是 7 而非 8。计划更新了注释——好——但计划文本自身仍说"comment 7→5 categories"这是 JSDoc 类别计数（正确），区别于 `= 8` 行注释。确保执行者同时修 JSDoc（detector/remover 7→5）与内联 `= 8`/`= 7` 行。
- **[LOW] `detectors/index.test.js` Step-5 收窄假设。** 计划收窄过滤为 `r.name !== 'Python'`。确认 `pip-package.js` 返回 `name: 'requests'`（据 `detectors/index.test.js:87` 确实如此），故存活行正确。

**Suggestions**
- 在 Task 3（或 deferral 说明）加显式条目承认 `hooks-installer.js`/`hooks/index.js` marketplace-cache 引用被有意保留（运行时缓存，非源码耦合）。
- Task 2 显式陈述新 `paths.js` 仅用 `require('fs/path/os')` —— 匹配 `config-manager.js:3-5` 与 `plugin-installer.js:3-6` ——以满足 CJS 保持检查。

**Risk Assessment: LOW–MEDIUM.** 源码变更机械且有序；require-load 闸门对 Wave 1 充分。唯一真实残留是 `hooks/` 中装饰性 marketplace-cache 遗留，不阻塞正确性。

---

### PLAN 54-02 (Wave 2 — 测试) — OpenCode

**Summary**
测试裁剪意图对被删模块正确，但**验证闸门是坏的**：计划承诺 `npm test exits 0` 针对当前红的套件，且有 *4 个与 Phase 54 无关的失败套件*，计划未处理两个手写 runner 文件（`pushover.test.js`、`unified-flow.test.js`），jest 30 因它们在顶层 IIFE 中调用 `process.exit()` 而拒绝。`uninstall/index.test.js` 数学更新也欠规范。必须修复否则闸门永不通过。

**Strengths**
- **正确识别当前已断的 `detector.test.js`。** 它期望 2 plugins（`detector.test.js:64,66,221` 引用 `windows-git-commit`）但 `detector.js:8` 已仅 `['claude-notify']`（Phase 53 收窄）——故此套件**今日已失败**。54-02 Task 3 修复它。好捕捉，即便计划未注明是预存在失败。
- **`remover.test.js` delta 正确。** `toBe(9)` 于 `:88,:92,:107,:109` → `toBe(6)`；2 个 marketplace 用例（`:202-221` source removal、`:257-274` cache removal）正确锁定；`pluginCalls` 过滤 `:234` 丢弃 `windows-git-commit`。
- **`formatter.test.js` marketplace 断言正确标记**（`:120` `expect(t).toHaveBeenCalledWith('uninstall.category.marketplace')` 一旦 `formatter.js:58` 块移除将失败）。
- **被删测试文件范围正确** —— 每个被删套件仅测一个被移除模块。无删除目标同时覆盖 KEPT 模块。

**Concerns**

- **[HIGH] `npm test exits 0` 闸门按字面不可达成。** Opencode 实跑基线：`10 failed suites / 8 failed tests`。54-02 删 5 套件（marketplace ×3、git-ssh、git-user）并修 `detector.test.js` 后，**至少 4 个失败套件残留且计划从未触碰**：
  1. `tests/bin.test.js` —— `bin/setup.js` 第 1 行是 `#!/usr/bin/env node` 带尾随空格/CRLF（`od -c` 实测 `\r\n`）vs 期望 `#!/usr/bin/env node`（`bin.test.js:16`）。预存在，与 Phase 54 无关。
  2. `tests/configurators/pushover.test.js` —— KEPT 模块，但它是手写 runner，`process.exit(0)` 于 `:183` 在顶层 IIFE（实测 `:172-188`）。Jest 30 报 `process.exit called with "0"` 为失败。**计划从未提及此文件。**
  3. `tests/configurators/unified-flow.test.js` —— 同 `process.exit` IIFE 模式（实测 `:395-410`，含 `process.exit(0/1)` 于 `:405,:408`）。裁剪 git 测试**并不**移除 process.exit，故保持红。
  4. `tests/verification/runner.test.js` —— `script_not_found` 错误（verification python 脚本路径），环境问题，无关（实测 4 个失败测试）。
  闸门必须重定为"相对于裁剪基线无*新*失败"或这 4 个必须显式修复/延期。
- **[HIGH] `process.exit` runner 模式未处理。** `pushover.test.js:172-188` 与 `unified-flow.test.js:395-410` 都把自定义 `test()` runner 包在 async IIFE 中调用 `process.exit(0/1)`。Jest 30（`package.json` devDeps `jest@^30.3.0`）拦截测试文件内的 `process.exit` 并判失败。计划裁剪 `unified-flow.test.js` 内*哪些测试跑*但保留致命 IIFE。要么 (a) 删 IIFE/`process.exit` 让 async assert 以 unhandled-rejection 浮现（仍非 jest 惯用），要么 (b) 转为 `describe/it`。按现状，`unified-flow.test.js` 裁剪后仍红。
- **[MEDIUM] `uninstall/index.test.js` fixture 数学欠规范。** 计划仅说"adapt countTotal new formula (total=6)"。但 `index.test.js` mock detector 并喂自己的 fixture：`makeAllInstalledResults()`（`:54-69`）有 **2 plugins** + `marketplaceSource`。54-01 `index.js` 裁剪后：`countTotal = plugins.length + 5 = 2 + 5 = 7`，`countInstalled` 不再计 `marketplaceSource`，故 found = 7 而非 8。然套件硬编码 `total: 8` 于 `:146,:157,:183` 且 `found: 8` 于 `:146`。要真正达到计划所述 `total: 6`，执行者还须*把 fixture plugins 2→1* 并从两个 helper 移除 `marketplaceSource`，然后重算每对 `{found,total}`。计划一行注释隐藏了 3 个 fixture 对象 + 3 个断言点。高风险执行者停在公式而留 3 个失败断言。
- **[LOW] `run-all.js` 延期决策。** `tests/run-all.js:10-12` require 已删 `config-git-ssh-detect.js`/`config-git-ssh-guide.js`/`config-git-user-detect.js`。Jest **不**跑它（文件名缺 `.test.`），故不断 `npm test`，但留带死 require 的脚本是邋遢的。建议显式 `git rm`。

**Suggestions**
- **重定验证闸门。** 用以下替换 "npm test exits 0"：*"Phase 54 前通过的测试套件在 Phase 54 后无失败；所有触及裁剪代码的套件为绿。"* 显式列出 4 个已知预存在失败以免归咎于本阶段。
- **修复或转换两个手写 runner。** 最低可行：从 `unified-flow.test.js` 与 `pushover.test.js` 剥离 `(async () => {... process.exit()})()` IIFE 让 jest 停止在 `process.exit` 报错。（内部 assert 已在 import 时同步运行；无 IIFE 时它们在模块加载时执行，jest 干净报告未捕获断言失败。）
- **详述 `index.test.js` fixture 变更** 为具体子任务：两 helper 中 plugins 2→1，移除 `marketplaceSource` key，重算 3 对 `{found,total}` 为 `{7,7}`/`{0,6}`/`{2,6}`（或单 plugin 数学所得）——并注明这些是 *fixture-driven*，非真实 `countTotal` 驱动。
- 把 `detectors/index.test.js` 加入显式编辑列表：移除 `jest.mock('../../src/detectors/git.js')`（`:10`）与 `ssh-tools.js`（`:14`），两 `require`（`:43,:44`），所有 `detectGit.mockResolvedValue`/`detectSSHTools.mockResolvedValue` 块，与 `toHaveLength(4)`→`(2)`（`:97`）。

**Risk Assessment: HIGH.** 不是因为删除错误——它们正确——而是因 success criterion（"剩余 installer 测试全通过"/"npm test exits 0"）若不同时面对预存在 `process.exit` runner 失败与 `bin.test.js`/`verification/runner.test.js` 问题则不可达。按字面跟计划的执行者会以为 Wave 2 失败了，而它实际在其本职上成功了。

---

## Consensus Summary

两位评审独立、源码级核对，opencode 额外实跑 jest（codex 沙箱禁 jest）。两者高度一致，opencode 因实跑补强了 codex 无法触及的运行时失败。本评审者已实跑 `cd installer && npm test` 独立复核基线 RED（10 failed suites / 8 failed tests），与 opencode 数字精确吻合。

### Agreed Strengths（两位评审一致）

- **marketplace→paths.js 迁移完整且顺序正确**：5 helper 并集（`getSkillsDir`/`isPluginInstalled`/`getConfigPath`/`readClaudeConfig`/`writeClaudeConfig`）恰好覆盖 uninstall 全部 `require('../marketplace/...')`；`registerMarketplaceSource` 无调用者正确排除；Task 2 迁移先于 Task 3 物理删除，无断裂中间态。
- **`countTotal`/`countInstalled` 算术正确**：`+6 → +5`、移除 `marketplaceSource.installed` 行，与源码一致。
- **`reporter.js` 正确未动**（泛型 results 驱动，零 marketplace 引用）。
- **`i18n` 删除范围准确且安全**：key 组计数与 CONTEXT 完全吻合；`i18n.test.js`、`reporter.test.js`、`welcome.test.js` 不受影响，正确保留。
- **CJS 保持**：无 `"type"` 字段，`paths.js` 显式 CJS。
- **INS-03 TRIM 决策正确，不应升级为用户决策**（详见下）。

### Agreed Concerns（两位评审一致 — 最高优先级）

#### HIGH-1（共识）— `npm test exits 0` 验收闸门按字面不可达成；`process.exit` 手写 runner 模式未被处理

两位评审均独立标记（codex 静态分析 `unified-flow.test.js` 的 IIFE/`process.exit`；opencode 实跑并补强 `pushover.test.js` 同病，外加 `bin.test.js` 与 `verification/runner.test.js` 预存在失败）。**本评审者实跑 `cd installer && npm test` 复核确认基线：`Test Suites: 10 failed, 20 passed, 30 total` / `Tests: 8 failed, 155 passed, 163 total`。**

10 个失败套件分类（对照两份计划的处理）：

| # | 失败套件 | 失败原因 | 54-02 是否处理 |
|---|---------|---------|---------------|
| 1 | `tests/bin.test.js` | CRLF 行尾致 shebang `\r\n` ≠ `#!/usr/bin/env node`（`bin.test.js:16`） | ❌ 未处理（预存在/环境） |
| 2 | `tests/verification/runner.test.js` | 4 失败，python 脚本路径 `script_not_found` | ❌ 未处理（预存在/环境） |
| 3 | `tests/marketplace/config-manager.test.js` | Jest 30 "must contain at least one test"（自定义 `test()`） | ✅ Task 1 删除 |
| 4 | `tests/marketplace/plugin-discovery.test.js` | 同上 | ✅ Task 1 删除 |
| 5 | `tests/marketplace/plugin-installer.test.js` | 同上 | ✅ Task 1 删除 |
| 6 | `tests/configurators/git-user.test.js` | 同上 | ✅ Task 1 删除 |
| 7 | `tests/configurators/git-ssh.test.js` | 同上 | ✅ Task 1 删除 |
| 8 | `tests/uninstall/detector.test.js` | 3 失败，2-plugin vs 1-plugin（Phase 53 后已红） | ✅ Task 3 修复 |
| 9 | `tests/configurators/pushover.test.js` | "no tests" + 顶层 IIFE `process.exit(0)`（`pushover.test.js:172-188`） | ❌ **未处理（KEPT 文件）** |
| 10 | `tests/configurators/unified-flow.test.js` | "no tests" + 顶层 IIFE `process.exit(0/1)`（`unified-flow.test.js:395-410`） | ⚠️ Task 2 仅裁剪 test 体内 git 用例，**未移除致命 IIFE/process.exit** |

**两份计划执行后**：#3–#7 删除（5 套件消失）、#8 修复，但 **#1、#2、#9、#10 仍红**。`npm test exits 0` 不可达成。

**根因（两位评审一致）**：`pushover.test.js` 与 `unified-flow.test.js` 是 Phase 17/20 遗留的手写 `test()`/`assert` runner，文件名匹配 `*.test.js` 故被 Jest 收集，但 (a) Jest 30 不识别其自定义 `test()`（报"must contain at least one test"），且 (b) 顶层 `(async () => {... process.exit(0/1) })()` IIFE 被 Jest 30 拦截并判失败。54-02 Task 2 裁剪 `unified-flow.test.js` 的 git 用例但保留致命 IIFE；`pushover.test.js` 根本未被提及。

**必须的 PLAN 变更（两位评审共同建议）**：
1. **重定 54-02 Task 4 验收闸门**：把 `npm test exits 0` 改为 *"Phase 54 前通过的套件在 Phase 54 后无失败；所有触及裁剪代码的套件为绿；4 个预存在失败（bin.test.js CRLF、verification/runner.test.js python 路径、pushover.test.js process.exit、unified-flow.test.js process.exit）显式列为本阶段 out-of-scope deferral"*。或：
2. **修复两个手写 runner**：从 `pushover.test.js`（`:172-188`）与 `unified-flow.test.js`（`:395-410`）剥离 `(async () => {... process.exit()})()` IIFE（最低可行）；理想是转换为 `describe/it` 惯用法。
3. **`uninstall/index.test.js` fixture 数学显式化**（见 MEDIUM-2）。

#### HIGH-2（codex 单独提出，opencode 实跑印证其机制）— `unified-flow.test.js` 裁剪后 IIFE 仍可掩盖其他套件失败

Codex 指出：即便移除 Tests 2/3/13/14，若尾部 `process.exit` IIFE 未处理，Jest 运行中途的游离 `process.exit` 可掩盖其他套件失败。Opencode 实跑确认该套件当前即报"must contain at least one test"——IIFE 与自定义 `test()` 双重问题。这与 HIGH-1 同源，合并处理即可。

#### MEDIUM-1（共识）— `uninstall/detector.js` 死 import 处方

两位评审均指出：54-01 Task 2 处方 detector.js import `{ isPluginInstalled, getSkillsDir, readClaudeConfig, getConfigPath }`，但移除 marketplace 块（`detector.js:43-46`）后 `readClaudeConfig`/`getConfigPath` 在 detector.js 中已无调用点（仅 `isPluginInstalled`/`getSkillsDir` 存活）。计划按字面交付两个未使用 import。**修复**：detector.js 仅 import `{ isPluginInstalled, getSkillsDir }`。（`readClaudeConfig`/`writeClaudeConfig`/`getConfigPath` 仍由 remover.js / paths.js 需要，仅在 detector.js 中不再需要。）

#### MEDIUM-2（共识）— `uninstall/index.test.js` fixture 数学欠规范

两位评审均指出：计划仅说"total=6"，但该套件喂自己的 fixture（`makeAllInstalledResults()` 当前 2 plugins + `marketplaceSource`，硬编码 `total:8`/`found:8` 于 `:146,:157,:183`）。执行者必须把 fixture 降至 1 plugin、移除 `marketplaceSource`、并重算三对 `{found,total}`。计划一行注释隐藏了 3 个 fixture 对象 + 3 个断言点。**修复**：加显式重算子任务与重算表。

#### MEDIUM-3（opencode 单独）— `formatter.test.js` 有具体 marketplace 断言，计划描述含糊

Opencode 指出 `formatter.test.js:120` 有具体断言 `expect(t).toHaveBeenCalledWith('uninstall.category.marketplace')`，54-01 移除 `formatter.js:58` marketplace 块后该断言必失败。54-02 Task 3 step 3 用条件式措辞（"若用例仅泛测…保留"）风险执行者留下它。**修复**：改为命令式"移除该 `toHaveBeenCalledWith('uninstall.category.marketplace')` 断言行"。（Codex 也间接提及，但 opencode 给出具体行号。）

#### LOW-1（共识）— `uninstall/remover.js` 的 `os` import 变死

54-01 Task 2 删 Step 5（Marketplace Cache，唯一 `os.homedir()` 调用点 `remover.js:98`）后，`remover.js:14` `require('os')` 未使用。运行时无害，lint 洁癖。**修复**：在删 Step 5 旁加"丢弃 remover.js `require('os')`"子步骤。

#### LOW-2（共识）— "marketplace" 字符串按设计存留于 KEPT hooks 模块

`hooks-installer.js:218-227,309` `cleanMarketplaceCache()` 与 `hooks/index.js:31` 引用 `~/.claude/plugins/marketplaces/work-skills/...`（Claude Code 运行时工件，防重复 notify hooks，非已删源码模块）。两位评审均标注以免执行者误删破坏重复通知防护。**修复**：加 deferral 说明条目承认有意保留。

#### LOW-3（共识）— `run-all.js` 决策延期但建议显式 `git rm`

两位评审均指出 `tests/run-all.js:10-12` require 已删模块；Jest 不跑它（非 `*.test.js`）故不断 `npm test`，但留死 require 邋遢。Codex 建议 option (a) 裁剪为 pushover runner；opencode 倾向显式 `git rm`。两者都要求决策不要无限延期。

#### LOW-4（codex 单独）— 预存在红基线未在计划中文档化

54-01 验收注释说旧测试"会因模块删除而失败"，但未指出 `detector.test.js` 在 Phase 53 后*已*红。以绿基线度量进度的执行者会困惑。**修复**：在 54-01 加一行说明当前 commit 的 uninstall detector 测试已红。

### Divergent Views（分歧）

- **run-all.js 处理方式**：codex 倾向 option (a) 裁剪为 pushover runner 保留价值；opencode 倾向显式 `git rm`。两者均非阻断性，执行者择优。
- **jest 实跑能力**：codex 沙箱禁 jest（故未发现 pushover.test.js/bin.test.js/verification 运行时失败）；opencode 实跑补强。本评审者已实跑独立复核，以 opencode 数字为准。

### INS-03 决策（两位评审一致：TRIM 正确，不升级）

两位评审独立得出相同结论：**TRIM 是正确决策，不应升级为用户决策**。理由（共识）：
- 裁剪后的 uninstall 流程仍交付真实用户价值（移除 claude-notify 5 类组件：plugin dir、hook scripts、hook registration、4 个 slash commands、Pushover env vars via registry——`remover.js:121`）。
- TRIM 成本确实 ≈ remove 成本（无论删或留都要编辑 `detector.js`/`remover.js`/`formatter.js`/`index.js` 解耦 marketplace）；完全移除 `--uninstall` 还需额外动 `cli.js` 与 `index.js` 的 `--uninstall` 分支，工作不减反增。
- `paths.js` 迁移是保持 uninstall 工作的唯一可行方式（5 helper 无其他归宿）。

---

## 行动清单（供 `/gsd-plan-phase 54 --reviews` 回灌）

**必须处理（阻断 `npm test exits 0` 闸门）**：
1. HIGH-1：重定 54-02 Task 4 验收闸门为"相对裁剪基线无新失败"，显式列出 4 个预存在失败为 deferral；或修复两个手写 runner 的 `process.exit` IIFE（`pushover.test.js:172-188`、`unified-flow.test.js:395-410`）。
2. HIGH-2：合并于 HIGH-1，确保 `unified-flow.test.js` IIFE 处理后不掩盖其他套件失败。

**应当处理（PLAN 文本修正）**：
3. MEDIUM-1：54-01 Task 2 detector.js import 改为仅 `{ isPluginInstalled, getSkillsDir }`。
4. MEDIUM-2：54-02 Task 3 step 4 加 `uninstall/index.test.js` fixture 重算子任务与显式 `{found,total}` 重算表。
5. MEDIUM-3：54-02 Task 3 step 3 改为命令式移除 `formatter.test.js:120` 的 `toHaveBeenCalledWith('uninstall.category.marketplace')` 断言。

**建议处理（清洁度）**：
6. LOW-1：54-01 Task 2 加"丢弃 remover.js `require('os')`"子步骤。
7. LOW-2：加 deferral 说明承认 hooks 模块 marketplace-cache 引用有意保留。
8. LOW-3：对 `run-all.js` 做明确决策（裁剪或 `git rm`），不要无限延期。
9. LOW-4：54-01 加一行说明当前 commit uninstall detector 测试已红。
