# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-02-27

## Milestones

- ✅ **v1.0 - Claude Notify** — Phases 1-5 (shipped 2026-02-24)
- ✅ **v1.1 - Git Security Scanning** — Phases 6-12 (shipped 2026-02-27)
- 📋 **v1.2 - 待规划** — Phases 13+ (planned)

## Current Status

**Latest Release:** v1.1 - Windows Git Commit Security Scanning
**Shipped:** 2026-02-27

**Key Features:**
- 敏感信息检测(密钥、密码、私钥、PGP、PEM)
- 缓存文件、配置文件、内部信息检测
- 双语支持(中英文)
- Windows 性能优化(16.77ms,比目标快 116 倍)
- 紧急跳过机制(带风险警告)
- 完整测试覆盖(12/12 通过)

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

## Active Development

**Next Milestone:** v1.2 (待规划)

可能的增强方向:
- 性能监控和分析工具
- 代码质量检查集成
- 团队协作功能
- 更多检测规则(数据库连接串、加密货币钱包等)

运行 `/gsd:new-milestone` 开始规划 v1.2。

---

## Phase History

<details>
<summary>✅ v1.1 - Git Security Scanning (Phases 6-12) — SHIPPED 2026-02-27</summary>

### Overview

为 `windows-git-commit` 技能添加提交前安全扫描功能,防止敏感信息泄露到版本控制。通过多层检测策略(正则模式 + 关键词 + 熵值分析),在 git commit 前扫描暂存区内容,发现问题时阻止提交并显示详细提示。

**Core Value:** 为 Windows 开发者提供即开即用的安全扫描工具,保护代码仓库免受敏感信息泄露

### Completed Phases

- [x] Phase 6: Core Scanning Infrastructure (2/2 plans) — completed 2026-02-26
- [x] Phase 7: Scanning Execution & Reporting (3/3 plans) — completed 2026-02-26
- [x] Phase 8: Internal Info Detection & Integration (2/2 plans) — completed 2026-02-26
- [x] Phase 9: Windows Testing & Optimization (3/3 plans) — completed 2026-02-26
- [x] Phase 10: UX Polish & Production Ready (2/2 plans) — completed 2026-02-26
- [x] Phase 11: Fix Orphaned Security Rules (1/1 plan) — completed 2026-02-26
- [x] Phase 12: Verify Phase 9 Completion (1/1 plan) — completed 2026-02-27

**Total:** 7 phases, 14 plans, all complete

**Performance:** 16.77ms 扫描时间(比 2000ms 目标快 116 倍)

**详细归档:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.0 - Claude Notify (Phases 1-5) — SHIPPED 2026-02-24</summary>

### Overview

Claude Code 任务完成通知技能,支持 Pushover 推送和 Windows 系统通知。

**Core Value:** 为 Claude Code 任务完成提供即时通知,提升工作流效率

### Completed Phases

- [x] Phase 1: 基础框架 (2/2 plans) — completed 2026-02-23
- [x] Phase 2: 环境变量管理 (1/1 plan) — completed 2026-02-23
- [x] Phase 3: Pushover 推送通知 (2/2 plans) — completed 2026-02-24
- [x] Phase 4: Windows 系统通知 (1/1 plan) — completed 2026-02-24
- [x] Phase 5: AI 摘要和文档 (1/1 plan) — completed 2026-02-24

**Total:** 5 phases, 7 plans, all complete

**详细归档:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

## Progress Summary

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Claude Notify | 5 | 7 | ✅ Complete | 2026-02-24 |
| v1.1 Git Security | 7 | 14 | ✅ Complete | 2026-02-27 |
| v1.2 待规划 | - | - | 📋 Planned | - |

### Phase 13: Add slash commands /notify-enable and /notify-disable to claude-notify plugin for toggling notification channels (pushover/windows)

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 0
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 13 to break down)

---

*Roadmap created: 2026-02-25*
*Last updated: 2026-02-27 after v1.1 milestone completion*
