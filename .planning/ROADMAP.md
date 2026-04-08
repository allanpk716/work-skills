# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-04-08

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- [x] **v1.3 - 智能配置检测** - Phases 20-21 (shipped 2026-03-29)
- [x] **v1.4 - 修复插件安装检测** - Phases 22-23 (shipped 2026-03-30)
- [x] **v1.5 - NPX 卸载功能** - Phases 24-25 (shipped 2026-03-30)
- [x] **v1.6 - 通知标志文件向上查找 + 全局控制** - Phases 26-28 (shipped 2026-04-01)
- [x] **v1.7 - 通知项目名称智能识别** - Phases 29-30 (shipped 2026-04-04)
- [ ] **v1.8 - 通知智能摘要与 Worktree 区分** - Phases 31-33 (in progress)

## Phases

<details>
<summary>v1.7 - 通知项目名称智能识别 (Phases 29-30) — SHIPPED 2026-04-04</summary>

- [x] Phase 29: Find-up Project Root Logic (2/2 plans) — completed 2026-04-04
- [x] Phase 30: Integration into Notification Scripts (1/1 plan) — completed 2026-04-04

</details>

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

## Phase Details

### v1.8 - 通知智能摘要与 Worktree 区分

**Milestone Goal:** 提升通知质量 -- 用 LLM 生成有意义的任务摘要,并支持多 worktree 场景区分

#### Phase 31: Worktree 区分
**Goal**: 用户在多个 worktree 并行工作时,能从通知标题区分来源项目和分支,且 Attention 通知可追溯到具体会话
**Depends on**: Phase 30 (通知项目名称智能识别已完成)
**Requirements**: WTREE-01, WTREE-02
**Success Criteria** (what must be TRUE):
  1. Stop hook 通知标题格式为 `[project:branch]`,在多个 worktree 并行时可区分每个通知来源
  2. 非 git 仓库场景下,通知标题退化为 `[project]` 格式,不影响已有功能
  3. Attention hook 通知内容包含 session_id 字段,用户可据此追溯到需要关注的具体会话
  4. 现有测试全部通过,新增 worktree 区分测试覆盖 git 和非 git 场景
**Plans**: TBD

Plans:
- [ ] 31-01: TBD
- [ ] 31-02: TBD

#### Phase 32: LLM 智能摘要核心
**Goal**: Stop hook 触发时,用户收到基于 git diff 生成的有意义的任务摘要;无 LLM 配置时自动降级,确保任何情况都有通知
**Depends on**: Phase 31 (通知标题格式已包含 worktree 区分)
**Requirements**: SUMM-01, SUMM-02, SUMM-03, SUMM-05
**Success Criteria** (what must be TRUE):
  1. 配置 LLM_API_KEY 后,Stop hook 通知包含基于 git diff 的 AI 生成摘要,描述本次任务完成的工作内容
  2. LLM API 不可用(无 key/网络错误/超时)时,自动降级到 `claude --print` 生成摘要,再降级到静态 fallback 消息,用户始终能收到通知
  3. 用户可通过环境变量 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL 控制摘要行为,无配置时跳过 LLM 直接到降级链下一级
  4. LLM API 调用在 5 秒内超时返回,Stop hook 整体执行在 10 秒内完成,不阻塞用户工作流
**Plans**: TBD

Plans:
- [ ] 32-01: TBD
- [ ] 32-02: TBD
- [ ] 32-03: TBD

#### Phase 33: 安装器 LLM 配置
**Goal**: 用户通过安装器交互式配置 LLM API 参数,无需手动设置环境变量
**Depends on**: Phase 32 (LLM 环境变量和行为已定义)
**Requirements**: SUMM-04
**Success Criteria** (what must be TRUE):
  1. 安装器运行时提供 LLM API 配置步骤(API key、base URL、model),用户可选择配置或跳过
  2. 用户选择跳过 LLM 配置时,安装器正常继续,通知功能保持现有降级行为不受影响
  3. 配置完成后,LLM_API_KEY、LLM_BASE_URL、LLM_MODEL 通过 setx 持久化为环境变量,重启后仍生效
**Plans**: TBD

Plans:
- [ ] 33-01: TBD
- [ ] 33-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 31 -> 32 -> 33

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 31. Worktree 区分 | v1.8 | 0/? | Not started | - |
| 32. LLM 智能摘要核心 | v1.8 | 0/? | Not started | - |
| 33. 安装器 LLM 配置 | v1.8 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-25*
*Last updated: 2026-04-08 — v1.8 roadmap created*
