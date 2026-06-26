# Phase 55: release-v3-metadata-regression - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure/release phase — smart discuss grey areas skipped)

<domain>
## Phase Boundary

完成 v3.0 里程碑的发版收尾:根项目元数据(README、CHANGELOG)完整反映单一技能(claude-notify)形态,版本号从 1.9.0 升至 3.0.0(root package.json + installer/package.json 同步)并打 git tag `v3.0`,claude-notify 全量 Python 测试通过证明瘦身未破坏其功能。本阶段为元数据/发版,不修改任何业务代码(claude-notify 代码不动,installer 已于 Phase 54 裁剪完毕)。

**REL-01 (README):** 根 `README.md` / `README.zh.md` — Phase 53 已收窄技能表/项目结构/Quick Start,但需复核是否仍有多技能残留(如 `npx skills add ... --all`、 Credits 提及),并确保 Quick Start 命令指向 `npx skills add allanpk716/work-skills/claude-notify`。
**REL-02 (CHANGELOG):** 在 `CHANGELOG.md` 顶部(## [1.6.0] 之前)新增 `## [3.0.0] - 2026-06-26` 条目,记录 v3.0 范围:移除 windows-git-commit + codepoint、裁剪 installer、回归通过。
**REL-03 (version + tag):** `package.json` version `1.9.0` → `3.0.0`;`installer/package.json` version `1.9.0` → `3.0.0`;`package.json` description/keywords 已于 Phase 53/54 收窄,复核;新建 git tag `v3.0`(注:项目历史 tag 用 `vX.Y` 或 `vX.Y.Z` 混合,最新为 `v2.1`;ROADMAP/REQUIREMENTS 指定 tag `v3.0`,遵循之)。遵循项目发布规范(CLAUDE.md 发布规范:version 与最新 tag 一致)。
**REL-04 (回归):** `python -m pytest claude-notify/tests/ -q` 全部通过(Phase 54 已验证 105 passed;本阶段再跑确认)。

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
纯发版/元数据阶段 — 所有实现选择由 Claude 自主决定。版本号、tag 名、CHANGELOG 条目内容均已由 ROADMAP/REQUIREMENTS 枚举。

**预设执行原则(来自项目上下文与 CLAUDE.md 发布规范):**
- 版本同步:root `package.json` 与 `installer/package.json` 都升到 3.0.0(installer 的 welcome.js/cli.js 读 installer/package.json 的 version,CLAUDE.md 明确要求两者同步)。
- tag 命名:ROADMAP SC3 指定 `v3.0`,遵循(即使历史有 `vX.Y.Z` 形式)。
- CHANGELOG 风格:遵循现有 Keep a Changelog 格式(## [version] - date,### Removed/Changed 分节)。v3.0.0 条目放 `## [1.6.0]` 之前(最新在上)。**保留所有历史条目**(1.6.0 及之前)。
- README Quick Start:`npx skills add allanpk716/work-skills/claude-notify`(单技能路径,Phase 53 后的形态)。若 README 仍有 `--all` 或多技能措辞,移除。
- npm 发布/deprecate:本里程碑**不执行** `npm publish`(仅本地版本+tag 准备;实际 npm 发布是用户的手动发布动作,需要 .npm-token 与发布时机决策)。REL-03 验收为"版本同步 + git tag 一致",不含 npm publish。

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 无新代码。仅编辑 README.md、README.zh.md、CHANGELOG.md、package.json、installer/package.json。

### Established Patterns
- CHANGELOG: Keep a Changelog 格式,最新版本在上,中英混合(历史条目中文为主)
- tag: 项目历史 tag — v1.7.1, v1.8, v1.8.1...v2.0, v2.0.1, v2.1(混合 X.Y 与 X.Y.Z)
- 版本读取: installer welcome.js (line 14: `require('../package.json').version`) + cli.js (line 12: `require('../package.json').version`) 读 **installer/package.json**,不是根 package.json — 故两者必须同步

### Integration Points
- 根 package.json: version (行3), description (行4 已收窄), keywords (Phase 53 已删 windows-git-commit/codepoint)
- installer/package.json: version — welcome.js/cli.js 读取此值显示给用户
- README.md / README.zh.md: Phase 53 已收窄,复核 Quick Start 与 Credits
- CHANGELOG.md: 在 ## [1.6.0] 前插入 ## [3.0.0]

</code_context>

<specifics>
## Specific Ideas

- v3.0.0 CHANGELOG 条目建议结构:
  `### Removed` — windows-git-commit 技能、codepoint 技能链(8 子技能)、installer 的 git/ssh 检测配置、marketplace 集成、uninstall 中 marketplace 组件
  `### Changed` — installer 裁剪为仅服务 claude-notify;i18n/welcome 收窄;项目回归单一通知技能形态;版本 3.0.0
- git tag 创建后不推送(用户决定何时 push tag + npm publish)。

</specifics>

<deferred>
## Deferred Ideas

- npm publish / npm deprecate 旧版本 → 用户手动发布动作(需要 .npm-token、发布时机),本里程碑仅准备版本+tag,不含发布
- claude-notify __pycache__ git 清理 → Out of Scope (用户选择"仅做删除")
- git push (commits + tag) → 用户决定何时推送

</deferred>
