# M001: - Codepoint 测试归档与调研文档整理 (Phases 38-40) — SHIPPED 2026-04-20

**Vision:** Work Skills 是一个 Claude Code 技能集合项目,包含通知插件(claude-notify)、Git 安全扫描(windows-git-commit)和独立 NPX 安装器。安装器支持智能配置检测和完整卸载功能,能自动识别已有环境配置并适配首次安装或重复运行场景。已安装插件在重复运行时自动跳过,无需用户手动干预。用户可通过 `--uninstall` 一键卸载所有已安装组件。通知标志文件支持向上查找和 `~/.

## Success Criteria


## Slices

- [x] **S01: E2e Test Migration** `risk:medium` `depends:[]`
  > After this: 将 tmp/ 下 5 个 E2E 测试项目迁移到 tests/e2e/codepoint-v2/，使用正确的 git 策略（tracked 用 git mv，untracked 用 cp + git add），排除构建产物，添加 .
- [x] **S02: Research Doc Archive** `risk:medium` `depends:[S01]`
  > After this: 创建 docs/research/codepoint/ 目录结构，归档主调研文档和微信配图。

Purpose: 建立代码点方法论的持久化归档目录，保存原作者核心调研内容。
Output: docs/research/codepoint/ 目录，包含主调研文档和重命名后的配图。
- [x] **S03: Codepoint Design Review** `risk:medium` `depends:[S02]`
  > After this: 对照代码点方法论原作者的核心原则（全局思维、集合论、密度校验），逐条审查 Codepoint V2 技能的 scan/plan/implement 三阶段设计，识别设计偏差与合理偏离，输出包含可执行改进建议的反省文档。

Purpose: 为后续版本的 Codepoint 技能改进提供设计输入，确保技能方向与方法论核心原则对齐
Output: `docs/research/codepoint/2026-04-19-design-review.
