# M012: - 前端自动化测试体系

**Vision:** Work Skills 是一个 Claude Code 技能集合项目,包含通知插件(claude-notify)、Git 安全扫描(windows-git-commit)和独立 NPX 安装器。安装器支持智能配置检测和完整卸载功能,能自动识别已有环境配置并适配首次安装或重复运行场景。已安装插件在重复运行时自动跳过,无需用户手动干预。用户可通过 `--uninstall` 一键卸载所有已安装组件。通知标志文件支持向上查找和 `~/.

## Success Criteria


## Slices

- [ ] **S01: Test Specification Foundation** `risk:medium` `depends:[]`
  > After this: Create the test-plan skill and probe snippet library for standardized frontend test flow planning.
- [ ] **S02: Codepoint Data Integration** `risk:medium` `depends:[S01]`
  > After this: unit tests prove Codepoint Data Integration works
- [ ] **S03: Instrumentation First Planning** `risk:medium` `depends:[S02]`
  > After this: unit tests prove Instrumentation-First Planning works
- [ ] **S04: Verification Automation** `risk:medium` `depends:[S03]`
  > After this: unit tests prove Verification Automation works
- [ ] **S05: Skill UX Orchestration** `risk:medium` `depends:[S04]`
  > After this: unit tests prove Skill UX Orchestration works
- [ ] **S06: Progressive Validation** `risk:medium` `depends:[S05]`
  > After this: unit tests prove Progressive Validation works
