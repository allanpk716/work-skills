# Phase 53: remove-deprecated-skills - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure/pure-deletion phase — smart discuss grey areas skipped)

<domain>
## Phase Boundary

仓库物理上不再包含 windows-git-commit 与 codepoint 两个技能目录,清除 docs/codepoint 文档与调研工作区(保留 docs/claude-notify),并清理仓库内所有指向这两个技能的残留引用。本阶段只做删除与引用清理,不修改任何保留代码(claude-notify、installer)的行为。

**删除清单(来自 REM-01..03):**
- `windows-git-commit/` 整个目录(scanner/、hooks/、references/、README、plugin.json、.pytest_cache)
- `codepoint/` 整个目录(9 个 SKILL.md 含根 + 8 子技能、templates/、references/、README、plugin.json)
- `docs/codepoint/` 整个目录(plans/、research/ 含 workspace 与 images、specs/)

**保留(不动):** `claude-notify/`、`docs/claude-notify/`、`installer/`、根文件

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
纯删除/基础设施阶段 — 所有实现选择由 Claude 自主决定。删除目标已由 REM-01..03 明确枚举,无设计决策空间。引用清理(REM-04)为机械的 grep-and-fix。

**预设执行原则(来自项目上下文与上文确认):**
- 使用 `git rm -r` 删除目录以保留 git 历史(项目 Key Decision: "git mv 保留历史跟踪" 的同类原则,删除亦用 git 而非裸文件系统操作)
- 历史记录类文档(CHANGELOG 中既往版本的提及)视为合法历史,不在清理范围 — 仅清理"当前指向"的活跃引用(README 技能表、CLAUDE.md、package.json keywords、installer i18n 中仍把已删技能当现役的文案)
- 注意:REM-04 的"残留引用"清理中,installer 内 i18n/路径的清理在本阶段仅做"不破坏"级别 — installer 的深度裁剪属于 Phase 54(INS-01..05)。本阶段若 installer 代码因删除目录而 import 断裂,以最小改动保持 installer 可加载即可,深度重构留待 Phase 54。

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 无 — 本阶段为删除,不引入新代码

### Established Patterns
- 项目用 git 跟踪所有技能目录(含 .pyc 缓存),删除走 `git rm`
- claude-notify 已确认为自包含技能 — 早期 grep 验证 `claude-notify/` 内无任何 `windows-git-commit` 或 `codepoint` 引用,删除兄弟技能不会破坏 claude-notify

### Integration Points
- 根 README.md / README.zh.md:技能表格列出 3 个技能,需移除 2 行
- 根 package.json:keywords 含 `windows-git-commit`、`codepoint`,description 含 "Git workflow, and code observability"
- CHANGELOG.md:含历史版本记录(保留历史,不清理既往条目)
- installer/:深度引用已删技能(marketplace 发现、isPluginInstalled 检测),但深度裁剪在 Phase 54

</code_context>

<specifics>
## Specific Ideas

无具体额外要求 — 删除目标已在 ROADMAP 与 REQUIREMENTS 完全枚举。遵循标准删除流程。

</specifics>

<deferred>
## Deferred Ideas

无 — 讨论保持在阶段范围内。installer 深度裁剪(deferred 到 Phase 54)、claude-notify 自身 __pycache__ git 清理(Out of Scope,本里程碑不做)均已记录在他处。

</deferred>
