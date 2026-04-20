# M010: - Git Security Scanning (Phases 6-12) — SHIPPED 2026-02-27

**Vision:** Work Skills 是一个 Claude Code 技能集合项目,包含通知插件(claude-notify)、Git 安全扫描(windows-git-commit)和独立 NPX 安装器。安装器支持智能配置检测和完整卸载功能,能自动识别已有环境配置并适配首次安装或重复运行场景。已安装插件在重复运行时自动跳过,无需用户手动干预。用户可通过 `--uninstall` 一键卸载所有已安装组件。通知标志文件支持向上查找和 `~/.

## Success Criteria


## Slices

- [x] **S01: Core Scanning Infrastructure** `risk:medium` `depends:[]`
  > After this: unit tests prove Core Scanning Infrastructure works
- [x] **S02: Scanning Execution & Reporting** `risk:medium` `depends:[S01]`
  > After this: unit tests prove Scanning Execution & Reporting works
- [x] **S03: Internal Info Detection & Integration** `risk:medium` `depends:[S02]`
  > After this: unit tests prove Internal Info Detection & Integration works
- [x] **S04: Windows Testing & Optimization** `risk:medium` `depends:[S03]`
  > After this: unit tests prove Windows Testing & Optimization works
- [x] **S05: UX Polish & Production Ready** `risk:medium` `depends:[S04]`
  > After this: unit tests prove UX Polish & Production Ready works
- [x] **S06: Fix Orphaned Security Rules** `risk:medium` `depends:[S05]`
  > After this: unit tests prove Fix Orphaned Security Rules works
- [x] **S07: Verify Phase 9 Completion** `risk:medium` `depends:[S06]`
  > After this: unit tests prove Verify Phase 9 Completion works
