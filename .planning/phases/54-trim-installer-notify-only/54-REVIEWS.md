---
phase: 54
reviewers: [opencode]
reviewers_unavailable: [codex]
cycle: 2
reviewed_at: 2026-06-26T14:35:00Z
plans_reviewed:
  - 54-01-PLAN.md
  - 54-02-PLAN.md
baseline_test_state: "RED — 10 failed suites / 8 failed tests / 30 total (re-confirmed by opencode + orchestrator this cycle)"
cycle_focus: "convergence cycle 2 — verify cycle-1 findings (HIGH-1/2, MEDIUM-1/2/3) are RESOLVED in revised plans; catch NEW issues"
---

# Cross-AI Plan Review — Phase 54 (trim-installer-notify-only) — CONVERGENCE CYCLE 2

本轮为 **convergence cycle 2** —— 在 cycle 1 评审产出 HIGH-1/HIGH-2/MEDIUM-1/MEDIUM-2/MEDIUM-3 后，planner 已据以修订两份 PLAN.md（commit `42f53c0` "revise plans per codex+opencode convergence review (cycle 1)" + `e3c507f` "rescope INS-05"）。本轮任务：(1) 逐条核对每个 cycle-1 finding 是否在最新 PLAN.md 中 RESOLVED；(2) 检查修订是否引入新问题。

> **codex 本轮不可用**（详见下文 Codex Review 段）：其配置的 custom provider (model glm-5.2) 返回 `429 Too Many Requests`，重试上限耗尽（用了 61,108 tokens 后被速率限流击杀）。按工作流"若某 reviewer CLI 报错，记录之并用另一位继续"的规则，本轮由 opencode 单独完成。**作为补偿，orchestrator 独立对源码树复核了所有 cycle-1 findings 与本轮新发现**（见 Consensus 段），cycle-2 覆盖得以保全。

opencode **实跑了 jest 基线**（再次确认 `10 failed suites / 8 failed tests / 30 total`，与 cycle 1 与 orchestrator 三方吻合），并逐条 `file:line` 核对修订。

---

## Codex Review — UNAVAILABLE (CLI error this cycle)

Codex CLI 本轮报错，未产出评审。

**错误**：`ERROR: exceeded retry limit, last status: 429 Too Many Requests`，来自其配置的 custom provider（`model: glm-5.2`，`provider: custom`）。codex 在耗尽重试预算前已使用 61,108 tokens（从 stderr 可见它读到了计划中粘贴的 `uninstall/index.test.js` 片段，正准备比对源码时被限流）。这是 provider 端的速率限制/容量失败，**非**计划缺陷，**也非**静默空结果（stderr 有完整诊断）。

**已采取行动**：记录该错误；按 convergence workflow 的"若 reviewer CLI 报错，记录并继续另一位"规则，本轮仅以 opencode 完成。cycle-1 codex findings（源码级证据、planner 已在修订计划中回应）由 orchestrator 本轮独立对照活源码树复核（见 Consensus 各 finding 的 orchestrator 核对列），故 cycle-2 覆盖未被 codex 中断削弱。

---

## OpenCode Review (CONVERGENCE CYCLE 2)

> opencode 在仓库工作树内逐文件核对，并实跑 `npm test` 复核基线。

### 1. Summary

两份计划在 cycle 1 后实质增强。opencode 对照活源码树复核了每个 cycle-1 finding（并重跑基线 jest：**10 failed suites / 8 failed tests, 30 total** —— 确认 RED）。**HIGH-1/HIGH-2、MEDIUM-1、MEDIUM-2、MEDIUM-3 全部 RESOLVED。** baseline-comparison 闸门规范正确（子集语义 + 4 套件白名单，且显式拒绝修复预存负债）；detector.js import 已正确收窄；`{6,6}/{0,6}/{3,6}` 重算对 `countTotal = plugins.length + 5` 算术正确；formatter.test.js:120 移除已成命令式。一个**实质的新发现**：计划对 `detector.js` 应用了 MEDIUM-1 死 import 修复，却**遗漏了 `remover.js` 中的对称情形**——删除 Step 5/6 后，`readClaudeConfig`/`writeClaudeConfig` 在 remover.js 中也变成死 import。整体风险：**LOW–MEDIUM**，主要受一个一致性修正约束。

### 2. Cycle-1 Finding Disposition

| Finding | Status | Evidence |
|---|---|---|
| **HIGH-1/HIGH-2**（基线 RED；闸门 = "no new failures"，非 `npm test exits 0`） | **RESOLVED** | 重跑基线确认 `10 failed / 20 passed, 30 total; 8 failed / 155 passed` —— 与计划精确吻合。54-02 Task 4 将 SC5 rescope 为**子集闸门**（`post-trim failing ⊆ baseline`），白名单正是 4 个预存套件（bin.test.js CRLF、verification/runner.test.js python、pushover.test.js IIFE、unified-flow.test.js IIFE），并显式禁止修复它们。计划**未**尝试修复 IIFE/CRLF/python —— 正确（未违背用户决策的范围蔓延）。已确认 IIFE 位于 `pushover.test.js:172-188` 与 `unified-flow.test.js:395-410`。 |
| **MEDIUM-1**（detector.js import 收窄为 `{isPluginInstalled, getSkillsDir}`） | **RESOLVED** | 54-01 Task 2 step 2 现在仅 import `{ isPluginInstalled, getSkillsDir }` 并附显式理由。核实：`detector.js:3` import `isPluginInstalled, getSkillsDir`（用于 :20,:21）；`detector.js:5` import `readClaudeConfig, getConfigPath`（**仅**用于 :43,:46 的 Category-5 marketplace 块，该块正被删）。收窄正确——未丢失存活符号。 |
| **MEDIUM-2**（index.test.js fixture 显式重算） | **RESOLVED** | 54-02 Task 3 step 4 给出显式表格含全部三对 `{found,total}` + 推导。重新推导对照 `index.js:32-36`（countTotal）与 `index.js:15-25`（countInstalled）：post-trim `countTotal = plugins.length + 5` → 1 plugin 时 = **6**。all-installed = 6 found / 6 total → **{6,6}** ✓；nothing-installed = 0 / 6 → **{0,6}** ✓；partial（plugin+hooksScripts+token）= 3 / 6 → **{3,6}** ✓。三对皆合理且正确。 |
| **MEDIUM-3**（formatter.test.js:120 移除须命令式） | **RESOLVED** | 54-02 Task 3 step 3 现写作"**命令式删除**…必须删除，非可选"。核实 `formatter.test.js:120` 是 `expect(t).toHaveBeenCalledWith('uninstall.category.marketplace')`，位于 "includes all category headers" 用例（:112-122）；对应源码渲染块为 `formatter.js:57-63`。移除为强制，不再含糊。 |

### 3. Strengths

- **基线已验证非假设。** 计划的基线数字（10/8）与 opencode 实跑吻合；10 个失败套件被枚举且各自正确归类（5 个由 Task 1 删除、1 个由 Task 3 修复、4 个白名单）。Post-trim 预测（剩 4 个 = 白名单）算术健全：`10 − 5 deleted − 1 fixed = 4`。
- **MEDIUM-1 detector.js 收窄精确。** `detector.js:43,46` 是 `readClaudeConfig`/`getConfigPath` 的唯一调用点；两者都在被删的 Category-5 块内，故收窄 import 可证明无损。
- **unified-flow 裁剪内部自洽。** 实数 `unified-flow.test.js` 有 **14** 个 `test()` 调用；计划精确删除 4 个（git-user/git-ssh，:112,:130,:339,:375），保留 10 个 pushover/纯逻辑测试。helper `clearGitUserCache`（:53）/`clearGitSSHCache`（:57）及其在 `clearAllConfiguratorCaches`（:65）的调用被正确标删，防止保留的 pushover 测试传递性依赖已删 configurator。预存 IIFE 将仍是唯一失败因（非新因），因为 `pendingPromises` 保持非空。
- **detector.test.js → 绿有据。** 它当前 RED 仅因 Phase 53 已收窄 `PLUGIN_NAMES=['claude-notify']`（`detector.js:8`）而测试仍断言 `toHaveLength(2)` / `windows-git-commit`（`detector.test.js:64,66,80,221`）。Task 3 更新直接针对每个失败断言，故 RED→GREEN 转换真实（它正确地**未**被白名单）。
- **迁移落点选择得当。** `uninstall/paths.js` 是正确的解耦缝；5 个迁移 helper 与 `plugin-installer.js:17-29`（`getSkillsDir`,`isPluginInstalled`）和 `config-manager.js:11-47`（`getConfigPath`,`readClaudeConfig`,`writeClaudeConfig`）逐字吻合，且 `registerMarketplaceSource` 正确**未**迁移。

### 4. Concerns

- **[MEDIUM — NEW] remover.js 从 paths.js 过度 import —— 死 import（与 MEDIUM-1 同型，未修）。** 54-01 Task 2 step 3 指定 `const { readClaudeConfig, writeClaudeConfig, getSkillsDir } = require('./paths.js')`，但删除 Step 5（Marketplace Cache）与 Step 6（Marketplace Source）后，仅 `getSkillsDir` 保留调用点。证据：`remover.js:90` 用 `getSkillsDir`（Step 4，**保留**）；`remover.js:110`（`readClaudeConfig`）与 `remover.js:114`（`writeClaudeConfig`）**都在 Step 6 内，而 Step 6 被删**。故 `readClaudeConfig`/`writeClaudeConfig` 变死 import —— 正是 MEDIUM-1 为 detector.js 修复的同一缺陷。CJS 下非运行时/测试断裂，但属 reviewer 受托捕捉的不一致，且大概率 lint 命中。
- **[LOW — NEW] 54-02 Task 3 verify 用了脆弱的 grep 守卫。** `! grep -q "toHaveLength(2)" installer/tests/uninstall/detector.test.js` 在该文件日后被合理地重加任何 `toHaveLength(2)` 时会误判失败。今日可接受（仅 :64 那一处旧断言），但脆弱。
- **[LOW] 子集闸门检查为人工。** Task 4 verify 块承认子集语义无法完全用 `grep` 表达，依赖执行器手工 diff `baseline.txt` 与 `posttrim.txt` 的 "FAIL …" 行。鉴于基线为手工记录（非运行时重捕），10 套件清单的转录笔误可能掩盖新失败。风险低（预测简单：剩 4 个），但值得对两文件 `FAIL ` 行做脚本化 diff。
- **[LOW] unified-flow 保留测试 #9–12（Case A/B/C/D 映射，:260–330）** —— 计划断言它们"纯逻辑无 require"。无法完全确认它们无一个传递性触碰 `clearAllConfiguratorCaches`；计划的缓解（删 git cache helper）覆盖常见路径，但执行器应确认这四个在运行时不依赖已删模块。

### 5. Suggestions

- **将 MEDIUM-1 原则应用到 remover.js。** 把 54-01 Task 2 step 3 的 import 改为 `const { getSkillsDir } = require('./paths.js');`（丢掉 `readClaudeConfig`、`writeClaudeConfig`）。在 54-02 Task 3 step 2 的 `remover.test.js` paths.js mock 中镜像（保留 `getSkillsDir` 断言；两个曾 exercise `readClaudeConfig`/`writeClaudeConfig` 的 marketplace 专用用例已标删，故 mock 亦变未用）。这使 `detector.js` 与 `remover.js` 的死 import 处理对称。
- **加固子集闸门。** 给 Task 4 加一行 diff 两文件的 `FAIL ` 行，例如 `comm -23 <(grep '^FAIL ' posttrim.txt | sort) <(grep '^FAIL ' baseline.txt | sort)` 须为空 —— 把人工子集检查变为自动化断言。
- **可选：** 将 Task 3 detector verify 的 grep 从泛化的 `toHaveLength(2)` 收紧为具体旧断言串（`toHaveBeenCalledWith('windows-git-commit')`），避免上述脆弱性。

### 6. Risk Assessment

**LOW–MEDIUM.** 全部四个 cycle-1 findings 均已真正 RESOLVED，机制正确且有源码佐证；重算的 fixture 值算术健全。基线为真（执行再确认），rescoped 闸门规范正确。唯一实质未决项是 **remover.js 死 import 不一致**（一处 MEDIUM-1 对称遗漏）—— 在源码计划与测试计划各一行收窄即可。应用后，计划即就绪 convergence，执行风险低；Phase 54 后的残余 RED 将恰为 4 个白名单预存套件，与用户 RESCOPE 决策吻合。

---

## Orchestrator Independent Verification (compensating for codex outage)

由于 codex 本轮 429 中断，orchestrator 独立对照活源码树复核了 opencode 的每一条结论与 cycle-1 各 finding 的 RESOLVED 状态。结果：

| 核对项 | 结论 | 证据 |
|---|---|---|
| 基线 RED 数字 | ✅ 与计划完全吻合 | orchestrator 实跑：`Test Suites: 10 failed, 20 passed, 30 total` / `Tests: 8 failed, 155 passed, 163 total` |
| HIGH-1/2 resolved（闸门 rescope 为子集比较，4 套件白名单，不修预存） | ✅ | 54-02 Task 4 明列 4 白名单 + 子集判定 (b)；计划**未**处方修复 IIFE/CRLF/python（无范围蔓延） |
| MEDIUM-1 resolved（detector.js 仅 import `{isPluginInstalled,getSkillsDir}`） | ✅ | 源码核对：`detector.js:5` 的 `readClaudeConfig/getConfigPath` 仅用于 :43,:46（Category-5 块，被删）；54-01 Task 2 step 2 已收窄为两符号 |
| MEDIUM-2 resolved（`{6,6}/{0,6}/{3,6}` 显式重算且算术正确） | ✅ | `index.js` countTotal = plugins.length+5；fixture 当前 2 plugin+marketplaceSource，断言 `{:146,:157,:183}` 硬编码 `{8,8}/{0,8}/{3,8}`；重算后三对 = `{6,6}/{0,6}/{3,6}` 合理 |
| MEDIUM-3 resolved（formatter.test.js:120 移除成命令式） | ✅ | 源码核对：`formatter.test.js:120` 确为 `expect(t).toHaveBeenCalledWith('uninstall.category.marketplace')`；54-02 Task 3 step 3 已作"命令式删除…必须删除，非可选" |
| **NEW MEDIUM — remover.js 死 import** | ✅ **确认为真** | orchestrator 源码核对：`remover.js:110 readClaudeConfig()` 与 `:114 writeClaudeConfig()` 均**在 Step 6（Marketplace Source，:108-109 标记）内**，被删；`:90 getSkillsDir()` 在 Step 4（保留）。故 54-01 Task 2 step 3 处方的 `{readClaudeConfig, writeClaudeConfig, getSkillsDir}` 中前两者变死 import —— 与 MEDIUM-1 同型。 |

**NEW MEDIUM（remover.js 死 import）为本轮唯一实质可执行结论**，需 planner 回应。

---

## Consensus Summary（本轮：opencode 单独 + orchestrator 复核）

### Agreed（opencode + orchestrator 独立得出相同结论）

#### Resolved（cycle-1 findings，全部确认在最新 PLAN.md 中已处理）

- **HIGH-1/HIGH-2 RESOLVED**：基线 RED 三方再确认（10/8）；54-02 Task 4 闸门 rescope 为子集比较 + 4 白名单，不修预存负债，无范围蔓延。**符合用户 RESCOPE 决策。**
- **MEDIUM-1 RESOLVED**：detector.js import 收窄为 `{isPluginInstalled, getSkillsDir}`，源码核对无损。
- **MEDIUM-2 RESOLVED**：index.test.js 三对 `{found,total}` 显式重算为 `{6,6}/{0,6}/{3,6}`，对 countTotal=plugins.length+5 算术正确。
- **MEDIUM-3 RESOLVED**：formatter.test.js:120 移除成命令式。

### Agreed Concerns（本轮新发现 — 最高优先级）

#### NEW-MEDIUM-1（opencode 提出，orchestrator 源码核对确认）— remover.js 死 import 未处理（MEDIUM-1 对称遗漏）

54-01 Task 2 step 3 处方 remover.js 从 paths.js import `{ readClaudeConfig, writeClaudeConfig, getSkillsDir }`，但删除 Step 5（Marketplace Cache）与 Step 6（Marketplace Source）后，`readClaudeConfig`（`remover.js:110`）与 `writeClaudeConfig`（`:114`）的**唯一调用点随 Step 6 一起消失**；仅 `getSkillsDir`（`:90`，Step 4）保留。这是 MEDIUM-1 为 detector.js 修复的同一死 import 反模式，在 remover.js 中未修。

证据（orchestrator 实跑 grep 确认）：
- `remover.js:110 const config = readClaudeConfig();` —— 在 Step 6 块内（:108 `// Step 6 - Marketplace Source: remove from config.json`）
- `remover.js:114 writeClaudeConfig(config);` —— 同 Step 6 块内
- `remover.js:90 const pluginPath = path.join(getSkillsDir(), plugin.name);` —— Step 4（保留）

CJS 下非运行时/测试断裂，但：(1) 与 MEDIUM-1 处理不对称，cycle 1 既已将死 import 定级为 MEDIUM，本轮同型亦应同级；(2) lint 可能命中。

**必须的 PLAN 变更**：
1. 54-01 Task 2 step 3 的 remover.js import 改为 `const { getSkillsDir } = require('./paths.js');`（丢掉 `readClaudeConfig`、`writeClaudeConfig`）。相应地，54-01 Task 2 的 verify 块（`node -e` 解构 paths.js 导出）仍验证全部 5 导出（paths.js 仍导出它们供未来用），仅 remover.js 的 require 收窄。
2. 54-02 Task 3 step 2 的 `remover.test.js` paths.js mock：保留 `getSkillsDir` 断言；`readClaudeConfig`/`writeClaudeConfig` 在该套件仅被两个已标删的 marketplace 专用用例使用，删除后 mock 中这两个键也成未用（可保留 mock 键无害，或一并删以保持 mock 与被测 import 对称）。计划已正确标删那两个 marketplace 专用用例，故此修正与计划既有方向一致。

#### NEW-LOW-1（opencode）— detector verify grep 脆弱

54-02 Task 3 verify 用 `! grep -q "toHaveLength(2)"` 作守卫，若该文件日后合理重加任何 `toHaveLength(2)` 会误判。**建议**：收紧为 grep 具体旧断言串 `toHaveBeenCalledWith('windows-git-commit')`。

#### NEW-LOW-2（opencode）— 子集闸门人工 diff

54-02 Task 4 verify 承认子集语义 grep 表达不全，依赖执行器手工 diff。**建议**：加一行 `comm -23 <(grep '^FAIL ' posttrim.txt | sort) <(grep '^FAIL ' baseline.txt | sort)` 须为空，转自动化断言。

#### NEW-LOW-3（opencode）— unified-flow 保留测试 #9-12 传递依赖未完全确认

unified-flow.test.js Case A/B/C/D 映射用例（:260-330），计划断言"纯逻辑无 require"。缓解（删 git cache helper）覆盖常见路径，但执行器应在运行时确认这四个不依赖已删模块。（属执行时确认项，非计划缺陷。）

### Divergent Views

- 无实质分歧。opencode 与 orchestrator 独立得出一致结论。codex 因 429 中断未参与本轮，其 cycle-1 源码级发现由 orchestrator 复核保全。

---

## 行动清单（供 `/gsd-plan-phase 54 --reviews` 回灌）

**应当处理（PLAN 文本修正，本轮唯一实质项）**：
1. **NEW-MEDIUM-1**：54-01 Task 2 step 3 的 remover.js import 收窄为 `const { getSkillsDir } = require('./paths.js');`（丢 `readClaudeConfig`/`writeClaudeConfig` —— 删 Step 5/6 后两者在 remover.js 无调用点）；同步 54-02 Task 3 step 2 的 remover.test.js mock 以保持对称（可选，mock 键保留亦无害）。

**建议处理（清洁度/稳健性）**：
2. **NEW-LOW-1**：54-02 Task 3 detector verify 的 grep 收紧为 `toHaveBeenCalledWith('windows-git-commit')`。
3. **NEW-LOW-2**：54-02 Task 4 加 `comm -23` 自动化 diff 守卫。
4. **NEW-LOW-3**：执行时确认 unified-flow 保留用例 #9-12 不传递依赖已删模块。

**cycle-1 findings（全部 RESOLVED，无需再动）**：HIGH-1、HIGH-2、MEDIUM-1、MEDIUM-2、MEDIUM-3。

---

## CYCLE_SUMMARY

```
CYCLE_SUMMARY: current_high=0 current_actionable=1
```

- **current_high=0**：cycle-1 的 HIGH-1/HIGH-2（`npm test exits 0` 闸门不可达）已在最新 PLAN.md 中 RESOLVED（54-02 Task 4 rescope 为子集比较 + 4 白名单，不修预存负债，符合用户 RESCOPE 决策），本轮无未决 HIGH。
- **current_actionable=1**：NEW-MEDIUM-1（remover.js 死 import，MEDIUM-1 对称遗漏）—— 未在 PLAN.md 中处理，需 planner 回应（一行 import 收窄 + 可选 mock 对称）。其余 LOW 项（NEW-LOW-1/2/3）为建议性清洁度提升，非阻断。

（说明：本轮 codex 因 provider 429 中断，仅 opencode 产出评审；orchestrator 独立对照源码复核保全了 cycle-1 findings 的 RESOLVED 判定与 NEW-MEDIUM-1 的确认为真。）

### Current HIGH Concerns
None.

### Current Actionable Non-HIGH Concerns
- **NEW-MEDIUM-1（remover.js 死 import，未在 PLAN.md 处理）**：54-01 Task 2 step 3 处方 `const { readClaudeConfig, writeClaudeConfig, getSkillsDir } = require('./paths.js')`，但删 Step 5/6 后 `readClaudeConfig`（`remover.js:110`）与 `writeClaudeConfig`（`:114`）的唯一调用点随 Step 6 消失，仅 `getSkillsDir`（`:90` Step 4）保留 —— 与 MEDIUM-1 同型死 import。**需 PLAN 变更**：remover.js import 收窄为 `const { getSkillsDir } = require('./paths.js');`；同步 remover.test.js 的 paths.js mock（保留 getSkillsDir 断言，两个 marketplace 专用用例已标删故 readClaudeConfig/writeClaudeConfig mock 键可一并删或保留无害）。
