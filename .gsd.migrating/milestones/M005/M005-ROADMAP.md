# M005: - 通知标志文件向上查找 + 全局控制 (Phases 26-28) — SHIPPED 2026-04-01

**Vision:** Work Skills 是一个 Claude Code 技能集合项目,包含通知插件(claude-notify)、Git 安全扫描(windows-git-commit)和独立 NPX 安装器。安装器支持智能配置检测和完整卸载功能,能自动识别已有环境配置并适配首次安装或重复运行场景。已安装插件在重复运行时自动跳过,无需用户手动干预。用户可通过 `--uninstall` 一键卸载所有已安装组件。通知标志文件支持向上查找和 `~/.

## Success Criteria


## Slices

- [x] **S01: Find Up Implementation — completed 2026 04 01** `risk:medium` `depends:[]`
  > After this: unit tests prove Find-up Implementation — completed 2026-04-01 works
- [x] **S02: Global Control — completed 2026 04 01** `risk:medium` `depends:[S01]`
  > After this: unit tests prove Global Control — completed 2026-04-01 works
- [x] **S03: Diagnostics & Testing — completed 2026 04 01** `risk:medium` `depends:[S02]`
  > After this: unit tests prove Diagnostics & Testing — completed 2026-04-01 works
