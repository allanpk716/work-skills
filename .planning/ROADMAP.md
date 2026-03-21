# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-03-21

## Milestones

- x **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- x **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- **v1.2 - 修复首次安装问题** - Phases 13-19 (in progress)

## Current Status

**Current Milestone:** v1.2 - 修复首次安装问题
**Started:** 2026-03-19

**Goal:** 创建独立的 npx 安装器,实现一步到位的安装体验,包括环境检测、交互式配置引导和安装后验证。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### v1.2 Milestone: 修复首次安装问题 (Phases 13-19)

- [x] **Phase 13: Notify Toggle Commands** - 添加 /notify-enable 和 /notify-disable 命令
- [x] **Phase 14: Installer Foundation** - 创建独立 npx 安装器基础框架
- [x] **Phase 15: Environment Detection** - 实现环境依赖检测功能
- [x] **Phase 16: Python Dependencies** - 实现 Python 依赖自动安装
- [x] **Phase 17: Interactive Configuration** - 实现交互式配置引导
- [ ] **Phase 18: Marketplace Integration** - 集成 Claude Code 技能市场
- [ ] **Phase 19: Installation Verification** - 实现安装后验证

## Phase Details

### Phase 13: Notify Toggle Commands

**Goal:** 用户可以通过斜杠命令启用/禁用通知渠道
**Depends on:** Phase 12
**Requirements:** (completed in previous milestone)
**Success Criteria** (what must be TRUE):
  1. User can run /notify-enable to enable notification channels
  2. User can run /notify-disable to disable notification channels
**Plans:** 2/2 plans complete

Plans:
- [x] 13-01: Implement /notify-enable command
- [x] 13-02: Implement /notify-disable command

### Phase 14: Installer Foundation

**Goal:** 用户可以通过 npx 命令运行独立安装器,并看到欢迎信息和帮助选项
**Depends on:** Phase 13
**Requirements:** INST-01, INST-02, INST-03, INST-04, INST-05
**Success Criteria** (what must be TRUE):
  1. User can run `npx @allanpk716/work-skills-setup` and see the installer start
  2. Installer displays a welcome message and feature introduction
  3. User can run `npx @allanpk716/work-skills-setup --help` to see available options
  4. User can run `npx @allanpk716/work-skills-setup --version` to see the version
  5. Installer shows appropriate error if not running on Windows
**Plans:** 1/2 plans complete

Plans:
- [x] 14-01-PLAN.md - Create npm package structure and entry point (INST-01, INST-02) - completed 2026-03-20
- [ ] 14-02-PLAN.md - Implement welcome screen and CLI options (INST-03, INST-04, INST-05)

### Phase 15: Environment Detection

**Goal:** 安装器能够检测所有必要的环境依赖并显示清晰的状态报告
**Depends on:** Phase 14
**Requirements:** ENV-01, ENV-02, ENV-03, ENV-04, ENV-05, ENV-06
**Success Criteria** (what must be TRUE):
  1. User sees clear pass/fail status for Python 3.8+ with version number
  2. User sees clear pass/fail status for Git with version number
  3. User sees clear pass/fail status for TortoiseGit or PuTTY installation
  4. User sees clear pass/fail status for requests Python library
  5. User sees installation guidance when dependencies are missing
**Plans:** 4 plans

Plans:
- [x] 15-01-PLAN.md - Implement Python and Git detection (ENV-01, ENV-02)
- [x] 15-02-PLAN.md - Implement TortoiseGit/PuTTY detection (ENV-03)
- [x] 15-03-PLAN.md - Implement pip package detector (ENV-04)
- [x] 15-04-PLAN.md - Integrate all detectors with status reporting (ENV-05, ENV-06)

### Phase 16: Python Dependencies

**Goal:** 安装器能够自动安装缺失的 Python 依赖库
**Depends on:** Phase 15
**Requirements:** DEPS-01, DEPS-02, DEPS-03
**Success Criteria** (what must be TRUE):
  1. User is prompted to install missing Python libraries automatically
  2. Installer successfully installs requests library using pip if missing
  3. User sees helpful error message and suggestions if installation fails
**Plans:** 2/2 plans complete

Plans:
- [x] 16-00-PLAN.md - Create TDD test skeletons for installer modules - completed 2026-03-20
- [x] 16-01-PLAN.md - Implement Python dependency installation with enquirer prompts and pip (DEPS-01, DEPS-02, DEPS-03) - completed 2026-03-20

### Phase 17: Interactive Configuration

**Goal:** 用户可以通过交互式引导配置 Pushover 凭证、Git SSH 和 Git 用户信息
**Depends on:** Phase 16
**Requirements:** CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06, CONF-07
**Success Criteria** (what must be TRUE):
  1. Installer detects and reports existing PUSHOVER_TOKEN and PUSHOVER_USER settings
  2. User can input Pushover credentials through interactive prompts (or skip)
  3. Pushover credentials are validated against Pushover API before saving
  4. Pushover credentials are saved to system environment variables via setx
  5. Installer detects and reports Git SSH configuration (core.sshCommand)
  6. User receives guidance for Git SSH configuration if not set (optional to configure)
  7. Installer detects and configures Git user.name and user.email (required)
**Plans:** 3 plans

Plans:
- [x] 17-00-PLAN.md - Create TDD test scaffolds for configurator modules - completed 2026-03-21
- [x] 17-01-PLAN.md - Implement Pushover configuration detection and guidance (CONF-01, CONF-02, CONF-03, CONF-04) - completed 2026-03-21
- [x] 17-02-PLAN.md - Implement Git SSH and user configuration detection (CONF-05, CONF-06, CONF-07) - completed 2026-03-21

### Phase 18: Marketplace Integration

**Goal:** 安装器能够将 work-skills 添加到 Claude Code 技能市场并显示可用插件
**Depends on:** Phase 17
**Requirements:** MKT-01, MKT-02, MKT-03
**Success Criteria** (what must be TRUE):
  1. Installer adds work-skills as a Claude Code skills marketplace source
  2. User sees list of available plugins (claude-notify, windows-git-commit)
  3. User can choose to install plugins through the installer
**Plans:** 1 plan

Plans:
- [ ] 18-01-PLAN.md - Implement Claude Code marketplace integration (MKT-01, MKT-02, MKT-03)

### Phase 19: Installation Verification

**Goal:** 安装完成后自动运行验证并提供清晰的通过/失败报告
**Depends on:** Phase 18
**Requirements:** VER-01, VER-02, VER-03, VER-04
**Success Criteria** (what must be TRUE):
  1. Installer automatically runs verify-installation.py after setup completes
  2. User sees a summary of pass/fail status for all verification checks
  3. User sees specific problems and resolution suggestions if verification fails
  4. User is shown the command to manually re-run verification
**Plans:** 1 plan

Plans:
- [ ] 19-01: Implement installation verification and reporting

---

## Phase History

<details>
<summary>x v1.1 - Git Security Scanning (Phases 6-12) - SHIPPED 2026-02-27</summary>

### Overview

为 `windows-git-commit` 技能添加提交前安全扫描功能,防止敏感信息泄露到版本控制。通过多层检测策略(正则模式 + 关键词 + 熵值分析),在 git commit 前扫描暂存区内容,发现问题时阻止提交并显示详细提示。

**Core Value:** 为 Windows 开发者提供即开即用的安全扫描工具,保护代码仓库免受敏感信息泄露

### Completed Phases

- [x] Phase 6: Core Scanning Infrastructure (2/2 plans) - completed 2026-02-26
- [x] Phase 7: Scanning Execution & Reporting (3/3 plans) - completed 2026-02-26
- [x] Phase 8: Internal Info Detection & Integration (2/2 plans) - completed 2026-02-26
- [x] Phase 9: Windows Testing & Optimization (3/3 plans) - completed 2026-02-26
- [x] Phase 10: UX Polish & Production Ready (2/2 plans) - completed 2026-02-26
- [x] Phase 11: Fix Orphaned Security Rules (1/1 plan) - completed 2026-02-26
- [x] Phase 12: Verify Phase 9 Completion (1/1 plan) - completed 2026-02-27

**Total:** 7 phases, 14 plans, all complete

**Performance:** 16.77ms 扫描时间(比 2000ms 目标快 116 倍)

**详细归档:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>x v1.0 - Claude Notify (Phases 1-5) - SHIPPED 2026-02-24</summary>

### Overview

Claude Code 任务完成通知技能,支持 Pushover 推送和 Windows 系统通知。

**Core Value:** 为 Claude Code 任务完成提供即时通知,提升工作流效率

### Completed Phases

- [x] Phase 1: 基础框架 (2/2 plans) - completed 2026-02-23
- [x] Phase 2: 环境变量管理 (1/1 plan) - completed 2026-02-23
- [x] Phase 3: Pushover 推送通知 (2/2 plans) - completed 2026-02-24
- [x] Phase 4: Windows 系统通知 (1/1 plan) - completed 2026-02-24
- [x] Phase 5: AI 摘要和文档 (1/1 plan) - completed 2026-02-24

**Total:** 5 phases, 7 plans, all complete

**详细归档:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

## Progress Summary

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Claude Notify | 1-5 | 7 | Complete | 2026-02-24 |
| v1.1 Git Security | 6-12 | 14 | Complete | 2026-02-27 |
| v1.2 Installer | 13-19 | - | In Progress | - |

### v1.2 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Notify Toggle Commands | 2/2 | Complete | 2026-02-27 |
| 14. Installer Foundation | 1/2 | In Progress | - |
| 15. Environment Detection | 4/4 | Complete | 2026-03-20 |
| 16. Python Dependencies | 2/2 | Complete | 2026-03-20 |
| 17. Interactive Configuration | 3/3 | Complete | 2026-03-21 |
| 18. Marketplace Integration | 0/1 | Planned | - |
| 19. Installation Verification | 0/1 | Not started | - |

---

*Roadmap created: 2026-02-25*
*Last updated: 2026-03-21 after Phase 18 planning*
