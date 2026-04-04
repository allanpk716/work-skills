# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-04-04

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- [x] **v1.3 - 智能配置检测** - Phases 20-21 (shipped 2026-03-29)
- [x] **v1.4 - 修复插件安装检测** - Phases 22-23 (shipped 2026-03-30)
- [x] **v1.5 - NPX 卸载功能** - Phases 24-25 (shipped 2026-03-30)
- [x] **v1.6 - 通知标志文件向上查找 + 全局控制** - Phases 26-28 (shipped 2026-04-01)
- [ ] **v1.7 - 通知项目名称智能识别** - Phases 29-30 (in progress)

## Phases

<details>
<summary>v1.6 - 通知标志文件向上查找 + 全局控制 (Phases 26-28) — SHIPPED 2026-04-01</summary>

- [x] Phase 26: Find-up Implementation (2/2 plans) — completed 2026-04-01
- [x] Phase 27: Global Control (2/2 plans) — completed 2026-04-01
- [x] Phase 28: Diagnostics & Testing (1/1 plan) — completed 2026-04-01

</details>

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

### v1.7 - 通知项目名称智能识别 (In Progress)

**Milestone Goal:** `get_project_name()` 通过向上查找 `.git` 或 `CLAUDE.md` 定位项目根目录,替代不可靠的 `os.path.basename(os.getcwd())`

#### Phase 29: Find-up Project Root Logic
**Goal**: 向上查找项目根目录的核心逻辑就绪,通过 TDD 测试验证所有场景
**Depends on**: Phase 28 (flags.py find-up pattern already established)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-06, PROJ-07
**Success Criteria** (what must be TRUE):
  1. 在项目子目录中调用查找函数,能正确定位到含 `.git` 或 `CLAUDE.md` 的项目根目录并返回文件夹名
  2. 在嵌套项目中(如 vendor/project),返回最近的包含 `.git` 或 `CLAUDE.md` 的目录名称(非最外层)
  3. 在没有 `.git` 或 `CLAUDE.md` 的目录中调用,回退到 `os.getcwd()` 的 basename
  4. 遍历逻辑复用 flags.py 的模式:最大深度限制、遇到 CLAUDE.md 标记时停止、到达文件系统根时停止
  5. TDD 测试覆盖子目录、嵌套项目、无标记回退、根目录停止等全部场景
**Plans**: 2 plans

Plans:
- [x] 29-01-PLAN.md — TDD RED phase: write 13 test cases for find_project_root and get_project_name
- [x] 29-02-PLAN.md — TDD GREEN phase: implement find_project_root() and get_project_name() in flags.py

#### Phase 30: Integration into Notification Scripts
**Goal**: notify.py 和 notify-attention.py 使用新的项目名称查找逻辑,在子目录执行时显示正确的项目名
**Depends on**: Phase 29
**Requirements**: PROJ-04, PROJ-05
**Success Criteria** (what must be TRUE):
  1. 在项目子目录中触发通知时,通知中显示的是项目根目录名称(如 "work-skills"),而非子目录名
  2. notify.py 和 notify-attention.py 都使用相同的查找逻辑,行为一致
**Plans**: 1 plan

Plans:
- [x] 30-01-PLAN.md — Migrate get_project_name() from local implementations to flags.py import in both scripts, update test mocks

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 26. Find-up Implementation | v1.6 | 2/2 | Complete | 2026-04-01 |
| 27. Global Control | v1.6 | 2/2 | Complete | 2026-04-01 |
| 28. Diagnostics & Testing | v1.6 | 1/1 | Complete | 2026-04-01 |
| 29. Find-up Project Root Logic | v1.7 | 2/2 | Complete    | 2026-04-04 |
| 30. Integration into Notification Scripts | v1.7 | 1/1 | Complete   | 2026-04-04 |

---
*Roadmap created: 2026-02-25*
*Last updated: 2026-04-04 — Phase 30 plan created*
