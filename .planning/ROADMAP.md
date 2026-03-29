# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-03-29

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- [x] **v1.3 - 智能配置检测** - Phases 20-21 (shipped 2026-03-29)
- [ ] **v1.4 - 修复插件安装检测** - Phases 22-23 (in progress)

## Phases

<details>
<summary>v1.3 - 智能配置检测 (Phases 20-21) -- SHIPPED 2026-03-29</summary>

- [x] Phase 20: Config Detection & Smart Interaction (2/2 plans) -- completed 2026-03-29
- [x] Phase 21: Unified Flow Integration (1/1 plan) -- completed 2026-03-29

**Total:** 2 phases, 3 plans, all complete

**详细归档:** `.planning/milestones/v1.3-ROADMAP.md`

</details>

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

---

### v1.4 - 修复插件安装检测 (In Progress)

**Milestone Goal:** 修复 windows-git-commit 插件重复运行安装器时始终提示安装的问题

- [x] **Phase 22: Plugin Structure Fix** - 扁平化 windows-git-commit 插件目录,使 SKILL.md 位于插件根目录 (completed 2026-03-29)
- [ ] **Phase 23: Detection & Regression Verification** - 修复安装器检测逻辑并验证两个插件均正常工作

## Phase Details

### Phase 22: Plugin Structure Fix
**Goal**: windows-git-commit 插件的 SKILL.md 位于插件根目录,与 claude-notify 结构一致
**Depends on**: Nothing (structural fix is independent)
**Requirements**: STRUCT-01, STRUCT-02
**Success Criteria** (what must be TRUE):
 1. windows-git-commit 插件目录中 SKILL.md 位于根层级(非 skills/ 子目录内)
 2. 将插件安装到 ~/.claude/skills/ 后,SKILL.md 可在 ~/.claude/skills/windows-git-commit/SKILL.md 直接访问
 3. 插件功能(git commit 安全扫描)在结构变更后仍然正常工作
**Plans**: 1 plan

Plans:
- [x] 22-01-PLAN.md — Flatten plugin directory and update path references

### Phase 23: Detection & Regression Verification
**Goal**: 安装器能正确检测已安装的 windows-git-commit 插件,且不破坏 claude-notify 的检测
**Depends on**: Phase 22
**Requirements**: DETECT-01, DETECT-02, DETECT-03
**Success Criteria** (what must be TRUE):
 1. windows-git-commit 安装后,`isPluginInstalled('windows-git-commit')` 返回 true
 2. 重复运行安装器时,windows-git-commit 在插件列表中显示 `[installed]` 标记且不提示重新安装
 3. claude-notify 的安装检测(`isPluginInstalled('claude-notify')`)仍返回正确结果,不受本次修改影响
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 22 -> 23

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 22. Plugin Structure Fix | v1.4 | 1/1 | Complete   | 2026-03-29 |
| 23. Detection & Regression Verification | v1.4 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-25*
*Last updated: 2026-03-29 — Phase 22 planned (1 plan)*
