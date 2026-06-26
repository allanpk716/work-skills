# Roadmap

## M001: - Codepoint 测试归档与调研文档整理 (Phases 38-40) — SHIPPED 2026-04-20

- [x] **Phase 01: e2e-test-migration** — E2e Test Migration
- [x] **Phase 02: research-doc-archive** — Research Doc Archive
- [x] **Phase 03: codepoint-design-review** — Codepoint Design Review

## M002: Codepoint V2 E2E 测试 (Phases 32-37) — SHIPPED 2026-04-19

- [x] **Phase 04: go-completed-2026-04-18** — Go 单语言计算器验证 — completed 2026 04 18
- [x] **Phase 05: python-completed-2026-04-18** — Python 单语言计算器验证 — completed 2026 04 18
- [x] **Phase 06: completed-2026-04-18** — 单语言问题修复 — completed 2026 04 18
- [x] **Phase 07: go-js-completed-2026-04-19** — Go+JS 全栈跨语言集成 — completed 2026 04 19
- [x] **Phase 08: python-ts-completed-2026-04-19** — Python+TS 全栈跨语言集成 — completed 2026 04 19
- [x] **Phase 09: completed-2026-04-19** — 全栈问题修复 — completed 2026 04 19

## M003: - Worktree 区分 (Phase 31) — SHIPPED 2026-04-09

- [x] **Phase 10: worktree** — Worktree

## M004: - 通知项目名称智能识别 (Phases 29-30) — SHIPPED 2026-04-04

- [x] **Phase 11: find-up-project-root-logic-completed-2026-04-04** — Find Up Project Root Logic — completed 2026 04 04
- [x] **Phase 12: integration-into-notification-scripts-completed-2026-04-04** — Integration into Notification Scripts — completed 2026 04 04

## M005: - 通知标志文件向上查找 + 全局控制 (Phases 26-28) — SHIPPED 2026-04-01

- [x] **Phase 13: find-up-implementation-completed-2026-04-01** — Find Up Implementation — completed 2026 04 01
- [x] **Phase 14: global-control-completed-2026-04-01** — Global Control — completed 2026 04 01
- [x] **Phase 15: diagnostics-testing-completed-2026-04-01** — Diagnostics & Testing — completed 2026 04 01

## M006: - NPX 卸载功能 (Phases 24-25) — SHIPPED 2026-03-30

- [x] **Phase 16: cli-entry-detection-completed-2026-03-30** — CLI Entry & Detection — completed 2026 03 30
- [x] **Phase 17: uninstall-execution-ux-completed-2026-03-30** — Uninstall Execution & UX — completed 2026 03 30

## M007: - 修复插件安装检测 (Phases 22-23) — SHIPPED 2026-03-30

- [x] **Phase 18: plugin-install-detection** — Plugin Install Detection
- [x] **Phase 19: smart-reinstall-flow** — Smart Reinstall Flow

## M008: - 智能配置检测 (Phases 20-21) — SHIPPED 2026-03-29

- [x] **Phase 20: config-detection-smart-interaction** — Config Detection & Smart Interaction
- [x] **Phase 21: unified-flow-integration** — Unified Flow Integration

## M009: - Installer NPX 安装体验 (Phases 13-19) — SHIPPED 2026-03-28

- [x] **Phase 22: add-slash-commands** — Add Slash Commands
- [x] **Phase 23: installer-foundation** — Installer Foundation
- [x] **Phase 24: environment-detection** — Environment Detection
- [x] **Phase 25: python-dependencies** — Python Dependencies
- [x] **Phase 26: interactive-configuration** — Interactive Configuration
- [x] **Phase 27: marketplace-integration** — Marketplace Integration
- [x] **Phase 28: installation-verification** — Installation Verification

## M010: - Git Security Scanning (Phases 6-12) — SHIPPED 2026-02-27

- [x] **Phase 29: core-scanning-infrastructure** — Core Scanning Infrastructure
- [x] **Phase 30: scanning-execution-reporting** — Scanning Execution & Reporting
- [x] **Phase 31: internal-info-detection-integration** — Internal Info Detection & Integration
- [x] **Phase 32: windows-testing-optimization** — Windows Testing & Optimization
- [x] **Phase 33: ux-polish-production-ready** — UX Polish & Production Ready
- [x] **Phase 34: fix-orphaned-security-rules** — Fix Orphaned Security Rules
- [x] **Phase 35: verify-phase-9-completion** — Verify Phase 9 Completion

## M011: - Claude Notify (Phases 1-5) — SHIPPED 2026-02-24

- [x] **Phase 36: core-infrastructure** — Core Infrastructure
- [x] **Phase 37: hook-claude-code-skill** — Hook Claude Code Skill
- [x] **Phase 38: configuration-diagnostics** — Configuration Diagnostics
- [x] **Phase 39: documentation-efficiency** — Documentation & Efficiency
- [x] **Phase 40: fix-missing-features** — Fix Missing Features

## M012: ✅ 前端自动化测试体系 (Phases 41-46) — SHIPPED 2026-04-20

- [x] **Phase 41: s01** — S01
- [x] **Phase 42: s02** — S02
- [x] **Phase 43: s03** — S03
- [x] **Phase 44: s04** — S04
- [x] **Phase 45: s05** — S05
- [x] **Phase 46: s06** — S06

## M013-g7bbz6: ✅ Agent Skills 标准迁移 (Phases 47-48) — SHIPPED 2026-04-20

- [x] **Phase 47: s01** — S01
- [x] **Phase 48: s02** — S02

## M014-kr0crh: ✅ Project Cleanup: Final Form (Phases 49-52) — SHIPPED 2026-04-20

- [x] **Phase 49: s01** — S01
- [x] **Phase 50: s02** — S02
- [x] **Phase 51: s03** — S03
- [x] **Phase 52: s04** — S04

## M015: 🚧 v3.0 聚焦 claude-notify 重构 (Phases 53-55) — IN PROGRESS

**Milestone Goal:** 将多技能集合瘦身回归单一技能项目，只保留 claude-notify；移除 windows-git-commit 与 codepoint 两个技能及其文档；将 NPX 安装器裁剪为仅服务于 claude-notify；更新根项目元数据并升级版本至 v3.0.0。这是破坏性删除/裁剪里程碑，不引入新功能，claude-notify 自身代码不动（仅作为回归验证对象）。

**Phase Numbering:** 本里程碑延续全局阶段编号（前一里程碑 v2.1 结束于 Phase 52，本里程碑从 Phase 53 起）。

- [x] **Phase 53: remove-deprecated-skills** - 移除 windows-git-commit 与 codepoint 技能目录及其文档，清理仓库内残留引用
- [x] **Phase 54: trim-installer-notify-only** - 裁剪 NPX 安装器，剥离 git/marketplace/uninstall 耦合代码，仅服务 claude-notify
- [ ] **Phase 55: release-v3-metadata-regression** - 更新根 README/CHANGELOG/package.json 为单一技能项目，升版 v3.0.0，回归验证 claude-notify

## Phase Details (M015)

### Phase 53: remove-deprecated-skills

**Goal**: 仓库物理上不再包含 windows-git-commit 与 codepoint 两个技能，相关文档与调研工作区一并清除，且仓库内不存在指向这两个技能的残留引用
**Depends on**: Nothing (本里程碑首阶段，前一里程碑 v2.1 已 SHIPPED)
**Requirements**: REM-01, REM-02, REM-03, REM-04
**Success Criteria** (what must be TRUE):

  1. `windows-git-commit/` 目录（含 scanner/、hooks/、references/、README、plugin.json）在仓库中不再存在
  2. `codepoint/` 目录（含 8 个子技能、templates/、references/、README、plugin.json）在仓库中不再存在
  3. `docs/codepoint` 文档与调研工作区（research/workspace、specs、plans、images）已删除，而 `docs/claude-notify` 保留完好
  4. 仓库内（README、README.zh、CHANGELOG、CLAUDE.md、package.json、installer 的 i18n/路径）grep 检索 `windows-git-commit` 与 `codepoint` 无残留指向引用（历史 CHANGELOG 记录除外）

**Plans**: 1 plan (Phase 53 为纯删除/引用清理, 单一关注点, 单计划三任务足够)

- [x] 53-01-PLAN.md — 删除 windows-git-commit/codepoint/docs/codepoint/docs/windows-git-commit 四目录, 收窄 README/package.json/installer 最小引用

### Phase 54: trim-installer-notify-only

**Goal**: NPX 安装器仅服务于 claude-notify 单一技能，剥离 git/marketplace/uninstall 耦合代码，其剩余测试全部通过
**Depends on**: Phase 53
**Requirements**: INS-01, INS-02, INS-03, INS-04, INS-05
**Success Criteria** (what must be TRUE):

  1. 安装器不再检测/配置 git-ssh、git-user、TortoiseGit、PuTTY（`detectors/git.js`、`detectors/ssh-tools.js`、`configurators/git-ssh.js`、`configurators/git-user.js` 已移除），同时保留 `detectors/python.js`、`detectors/pip-package.js`、`configurators/pushover.js`
  2. 安装器不再运行多技能 marketplace 集成（`marketplace/` 目录已移除），claude-notify 的安装与 hook 注册仅由现有 `hooks/` 模块（`runHooksInstallation`）承担
  3. 安装器卸载流程已裁剪——与已删技能耦合的 `uninstall/` 模块已移除或裁剪为仅清理 claude-notify 通知组件，且 `--uninstall` CLI 入口相应移除或调整
  4. 安装器 i18n（en.json / zh.json）与 welcome 横幅文案已更新为单一技能（claude-notify）范围，无 git/marketplace/多技能相关文案
  5. 已移除模块（git/ssh 检测、git 配置、marketplace、uninstall）的测试文件已删除，剩余 installer 测试全部通过

**Plans**: 2 plans (源码裁剪 + 测试裁剪/回归；源码侧 4 INS 集中耦合于 installer/src/，测试侧独立为 Wave 2)
**Wave 1**

- [x] 54-01-PLAN.md — 裁剪 installer 源码: 删 git/ssh detector+configurator、删 marketplace 目录、迁移路径 helper 到 uninstall/paths.js 并裁剪 uninstall 模块、裁剪主 index.js、收窄 i18n/welcome

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 54-02-PLAN.md — 裁剪 installer 测试: 删已删模块测试、更新 detectors/index+main+unified-flow+uninstall 套件、全量 jest 回归

### Phase 55: release-v3-metadata-regression

**Goal**: 根项目元数据完整反映单一技能（claude-notify）形态，版本升至 v3.0.0 并与 git tag 一致，且 claude-notify 回归测试通过证明瘦身未破坏其功能
**Depends on**: Phase 54
**Requirements**: REL-01, REL-02, REL-03, REL-04
**Success Criteria** (what must be TRUE):

  1. 根 `README.md` / `README.zh.md` 已更新为单一技能（claude-notify）项目（技能表格、项目结构、Quick Start 命令均不再提及 windows-git-commit / codepoint）
  2. `CHANGELOG.md` 新增 v3.0.0 条目，记录移除的技能与安装器裁剪范围
  3. 根 `package.json` 与 `installer/package.json` 版本同步为 3.0.0，且与新建 git tag `v3.0` 一致（遵循项目发布规范）
  4. 重构后 claude-notify 的全部 Python 测试通过（回归验证，确认移除/裁剪未破坏 claude-notify）

**Plans**: TBD

## Progress (M015)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 53. remove-deprecated-skills | 1/1 | Complete    | 2026-06-26 |
| 54. trim-installer-notify-only | 2/2 | Complete | 2026-06-26 |
| 55. release-v3-metadata-regression | 0/TBD | Not started | - |
