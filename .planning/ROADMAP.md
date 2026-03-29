# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-03-29

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- **v1.3 - 智能配置检测** - Phases 20-21 (in progress)

## Phases

<details>
<summary>v1.2 - Installer NPX 安装体验 (Phases 13-19) -- SHIPPED 2026-03-28</summary>

- [x] Phase 13: Notify Toggle Commands (2/2 plans) -- completed 2026-02-27
- [x] Phase 14: Installer Foundation (2/2 plans) -- completed 2026-03-20
- [x] Phase 15: Environment Detection (4/4 plans) -- completed 2026-03-20
- [x] Phase 16: Python Dependencies (2/2 plans) -- completed 2026-03-20
- [x] Phase 17: Interactive Configuration (3/3 plans) -- completed 2026-03-21
- [x] Phase 18: Marketplace Integration (1/1 plan) -- completed 2026-03-21
- [x] Phase 19: Installation Verification (3/3 plans) -- completed 2026-03-23

**Total:** 7 phases, 17 plans, all complete

**详细归档:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

### v1.3 Milestone: 智能配置检测 (Phases 20-21)

**Milestone Goal:** 安装器在配置步骤中自动检测已有配置，避免重复输入，提升重复运行体验

- [x] **Phase 20: Config Detection & Smart Interaction** - 检测已有配置并提供跳过/更新选择 (completed 2026-03-29)
- [ ] **Phase 21: Unified Flow Integration** - 统一首次安装和重复运行两种场景的端到端流程

## Phase Details

### Phase 20: Config Detection & Smart Interaction

**Goal:** 安装器能检测到用户已有的 Pushover 凭证和 Git 用户配置，并让用户选择跳过或更新
**Depends on:** Phase 19 (completed)
**Requirements:** CFGD-01, CFGD-02, INTX-01, INTX-02, INTX-03
**Success Criteria** (what must be TRUE):
  1. Installer detects existing Pushover credentials (PUSHOVER_TOKEN, PUSHOVER_USER) persisted via setx and reports their presence
  2. Installer detects existing Git user info (user.name, user.email) configured via git config --global and displays current values
  3. When existing Pushover config is detected, user sees masked API key and can choose to skip or re-enter
  4. When existing Git user info is detected, user sees current name/email and can choose to skip or re-enter
  5. User who chooses to re-enter gets the same validation and persistence flow as a fresh setup
**Plans:** 2/2 plans complete

Plans:
- [x] 20-01-PLAN.md -- Pushover registry detection + per-item Confirm interaction
- [x] 20-02-PLAN.md -- Git user skip/update Confirm + per-item interaction

### Phase 21: Unified Flow Integration

**Goal:** 首次安装和重复运行通过同一流程自动适配，用户无需关心安装模式
**Depends on:** Phase 20
**Requirements:** UFLOW-01, UFLOW-02
**Success Criteria** (what must be TRUE):
  1. Fresh install (no existing config) proceeds through full configuration prompts with zero detection overhead -- no "skip/update" prompts appear
  2. Re-run with existing config detects each configured item individually and offers skip/update choice per item, adapting to partial configurations
  3. A re-run that skips all detected items completes the configuration step instantly without unnecessary prompts
**Plans:** 1 plan

Plans:
- [ ] 21-01-PLAN.md -- Integration tests for unified flow (UFLOW-01 fresh install + UFLOW-02 re-run scenarios)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 20 -> 21

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 20. Config Detection & Smart Interaction | 2/2 | Complete    | 2026-03-29 |
| 21. Unified Flow Integration | 0/1 | Planning complete | - |

### v1.3 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 20. Config Detection & Smart Interaction | 0/2 | Planning complete | - |
| 21. Unified Flow Integration | 0/1 | Planning complete | - |

---

*Roadmap created: 2026-02-25*
*Last updated: 2026-03-29 for Phase 21 planning*
