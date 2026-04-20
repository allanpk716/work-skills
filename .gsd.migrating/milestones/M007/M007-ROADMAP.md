# M007: - 修复插件安装检测 (Phases 22-23) — SHIPPED 2026-03-30

**Vision:** Work Skills 是一个 Claude Code 技能集合项目,包含通知插件(claude-notify)、Git 安全扫描(windows-git-commit)和独立 NPX 安装器。安装器支持智能配置检测和完整卸载功能,能自动识别已有环境配置并适配首次安装或重复运行场景。已安装插件在重复运行时自动跳过,无需用户手动干预。用户可通过 `--uninstall` 一键卸载所有已安装组件。通知标志文件支持向上查找和 `~/.

## Success Criteria


## Slices

- [x] **S01: Plugin Install Detection** `risk:medium` `depends:[]`
  > After this: unit tests prove Plugin Install Detection works
- [x] **S02: Smart Reinstall Flow** `risk:medium` `depends:[S01]`
  > After this: unit tests prove Smart Reinstall Flow works
