# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-04-01

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- [x] **v1.3 - 智能配置检测** - Phases 20-21 (shipped 2026-03-29)
- [x] **v1.4 - 修复插件安装检测** - Phases 22-23 (shipped 2026-03-30)
- [x] **v1.5 - NPX 卸载功能** - Phases 24-25 (shipped 2026-03-30) — [Archive](milestones/v1.5-ROADMAP.md)
- [ ] **v1.6 - 通知标志文件向上查找 + 全局控制** - Phases 26-28 (in progress)

## Phases

<details>
<summary>v1.5 - NPX 卸载功能 (Phases 24-25) — SHIPPED 2026-03-30</summary>

- [x] Phase 24: CLI Entry & Detection (2/2 plans) — completed 2026-03-30
- [x] Phase 25: Uninstall Execution & UX (2/2 plans) — completed 2026-03-30

</details>

<details>
<summary>v1.4 - 修复插件安装检测 (Phases 22-23) — SHIPPED 2026-03-30</summary>

- [x] Phase 22: Plugin Install Detection (1/1 plan)
- [x] Phase 23: Smart Reinstall Flow (1/1 plan)

</details>

<details>
<summary>v1.3 - 智能配置检测 (Phases 20-21) — SHIPPED 2026-03-29</summary>

- [x] Phase 20: Config Detection & Smart Interaction (2/2 plans)
- [x] Phase 21: Unified Flow Integration (1/1 plan)

</details>

<details>
<summary>v1.2 - Installer NPX 安装体验 (Phases 13-19) — SHIPPED 2026-03-28</summary>

- [x] Phase 13: Add Slash Commands (1/1 plan)
- [x] Phase 14: Installer Foundation (3/3 plans)
- [x] Phase 15: Environment Detection (3/3 plans)
- [x] Phase 16: Python Dependencies (2/2 plans)
- [x] Phase 17: Interactive Configuration (3/3 plans)
- [x] Phase 18: Marketplace Integration (3/3 plans)
- [x] Phase 19: Installation Verification (2/2 plans)

</details>

<details>
<summary>v1.1 - Git Security Scanning (Phases 6-12) — SHIPPED 2026-02-27</summary>

- [x] Phase 06: Core Scanning Infrastructure
- [x] Phase 07: Scanning Execution & Reporting
- [x] Phase 08: Internal Info Detection & Integration
- [x] Phase 09: Windows Testing & Optimization
- [x] Phase 10: UX Polish & Production Ready
- [x] Phase 11: Fix Orphaned Security Rules
- [x] Phase 12: Verify Phase 9 Completion

</details>

<details>
<summary>v1.0 - Claude Notify (Phases 1-5) — SHIPPED 2026-02-24</summary>

- [x] Phase 01: Core Infrastructure
- [x] Phase 01.1: Hook Claude Code Skill
- [x] Phase 02: Configuration Diagnostics
- [x] Phase 03: Documentation & Testing
- [x] Phase 03.1: Fix Missing Features

</details>

## Phase Details

### v1.6 - 通知标志文件向上查找 + 全局控制 (In Progress)

**Milestone Goal:** 修复 `.no-windows` / `.no-pushover` 在子目录中失效的问题，并支持 `~/.claude/` 全局通知控制

#### Phase 26: Find-up Implementation
**Goal**: 通知标志文件检测支持在父目录中向上查找，子目录中的 Claude Code 会话也能正确响应 `.no-xxx` 标志
**Depends on**: Phase 25 (v1.5)
**Requirements**: FIND-01, FIND-02
**Success Criteria** (what must be TRUE):
  1. 在项目子目录中运行 Claude Code 时，父目录中的 `.no-pushover` 文件能被正确检测到，Pushover 通知不发送
  2. 在项目子目录中运行 Claude Code 时，父目录中的 `.no-windows` 文件能被正确检测到，Windows 系统通知不发送
  3. `notify-attention.py` 中的检测逻辑与 `check_notification_flags()` 保持同步，行为一致
  4. 当整个目录链中不存在 `.no-xxx` 文件时，通知正常发送，无性能影响
**Plans**: 2 plans

Plans:
- [x] 26-01-PLAN.md — TDD: Create shared flags.py module with find-up traversal
- [x] 26-02-PLAN.md — Integrate shared module into notify.py, notify-attention.py, and installer

#### Phase 27: Global Control
**Goal**: 用户可通过 `~/.claude/.no-xxx` 文件全局屏蔽所有项目的通知，无需逐项目配置
**Depends on**: Phase 26
**Requirements**: GLOB-01, GLOB-02
**Success Criteria** (what must be TRUE):
  1. 用户在 `~/.claude/` 目录创建 `.no-pushover` 文件后，所有项目的 Pushover 通知均被屏蔽
  2. 用户在 `~/.claude/` 目录创建 `.no-windows` 文件后，所有项目的 Windows 系统通知均被屏蔽
  3. 项目级 `.no-xxx` 文件优先于全局 `~/.claude/.no-xxx`，项目级存在时忽略全局设置
  4. 无项目级文件时，全局 `~/.claude/.no-xxx` 作为回退生效
**Plans**: 2 plans

Plans:
- [x] 27-01-PLAN.md — TDD: Add global fallback to flags.py with tests
- [ ] 27-02-PLAN.md — Add --global flag to slash commands and update notify-status

#### Phase 28: Diagnostics & Testing
**Goal**: 诊断模式可见向上查找和全局控制结果，新增测试覆盖所有新查找场景
**Depends on**: Phase 27
**Requirements**: DIAG-01, TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. 运行诊断模式时，输出中显示项目级 `.no-xxx` 文件的查找路径和结果（含向上遍历到的父目录路径）
  2. 运行诊断模式时，输出中显示全局 `~/.claude/.no-xxx` 文件的检测结果
  3. 测试覆盖父目录查找场景：文件在直接父目录、文件在更上层目录、整个目录链无文件
  4. 测试覆盖全局查找场景：`~/.claude/.no-xxx` 存在、不存在、与项目级文件共存时的优先级
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 26 -> 27 -> 28

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 26. Find-up Implementation | v1.6 | 2/2 | Complete    | 2026-04-01 |
| 27. Global Control | v1.6 | 1/2 | In Progress|  |
| 28. Diagnostics & Testing | v1.6 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-25*
*Last updated: 2026-04-01 — Phase 27 planned (2 plans, 1 wave)*
