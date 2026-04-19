---
phase: 38
reviewers: [opencode]
reviewed_at: "2026-04-19T12:00:00.000Z"
plans_reviewed: [38-01-PLAN.md, 38-02-PLAN.md]
review_round: 2
---

# Cross-AI Plan Review — Phase 38 (Round 2)

> 第二轮评审，基于已纳入第一轮反馈的修订版计划。

## OpenCode Review

### Plan 38-01: Migrate Test Projects

#### Summary

Plan 01 is well-structured with clear separation between tracked (git mv) and untracked (cp) project migration strategies. The inclusion of build artifact cleanup before migration and the critical safeguard around `gojs-calculator/frontend/dist/` demonstrates good awareness of the codebase's specific needs. However, the plan would benefit from explicit rollback procedures and more precise handling of the `.gitkeep` file placement.

#### Strengths

- Correctly differentiates git-tracked vs untracked projects and uses appropriate migration commands for each
- Explicit assertion on `frontend/dist/` preservation addresses the highest-risk data loss scenario
- Pre-migration artifact cleanup (240MB+ node_modules) keeps the git history clean
- `.gitignore` established first prevents accidental artifact commits during/after migration
- Go build verification runs from within module directories, correctly simulating real usage
- Commit checkpoint before Plan 02's irreversible deletion creates a safe recovery point

#### Concerns

- **MEDIUM**: No explicit rollback plan if `git mv` partially fails or if verification fails post-migration. While the checkpoint commit helps, the plan should state what happens if `go build` fails in Task 2 — does the executor revert the `git mv`, or attempt an in-place fix?
- **LOW**: Task 1 mentions staging `.gitkeep` — but no directory is specified as needing a `.gitkeep`. The `.gitignore` plus the migrated project directories themselves would keep `tests/e2e/codepoint-v2/` tracked. This is a minor unnecessary step.
- **LOW**: "Clean build artifacts from gojs-calculator and pyts-calculator BEFORE git mv" — the plan doesn't specify whether to clean from the working tree only or also from git tracking. If `node_modules/` or `*.exe` files were previously committed (which they shouldn't be, but might be), `git mv` would carry them along.
- **LOW**: The `cp -r` command for untracked projects on Windows should be verified — Git Bash supports it, but if execution uses PowerShell, `Copy-Item -Recurse` would be needed. No explicit shell assumption is stated.

#### Suggestions

- Add an explicit failure mode: "If go build fails post-migration, revert with `git reset HEAD~1` and investigate before proceeding"
- Verify whether any build artifacts are actually git-tracked in gojs-calculator/pyts-calculator before migration — `git ls-files tmp/gojs-calculator | grep -E '(node_modules|\.exe)'` would confirm
- Drop the `.gitkeep` reference unless there's a specific empty subdirectory that needs it
- Specify the shell environment assumption (Git Bash vs PowerShell) for Windows compatibility

#### Risk Assessment: **LOW**

The plan is methodical and the most critical risk (`frontend/dist/` loss) is explicitly guarded. The checkpoint commit before deletion in Plan 02 provides a safety net. Primary remaining risk is a silent migration failure that passes verification, which is unlikely given the explicit build checks.

---

### Plan 38-02: Clean tmp/ and Update Documentation

#### Summary

Plan 02 adds a valuable second verification gate before the irreversible `tmp/` deletion, and the targeted per-project deletion approach (vs `rm -rf tmp/*`) shows good discipline. The documentation update scope is well-defined with the explicit milestone exclusion. The dependency on reading Plan 01's summary file is a clean handoff pattern, though the plan could be more specific about which documentation files to verify exist.

#### Strengths

- Re-verification of builds AFTER migration but BEFORE deletion is the correct safety gate for irreversible operations
- Targeted `rm -rf` per project directory (not `rm -rf tmp/*`) prevents accidental deletion of any other `tmp/` content that may exist
- Explicit exclusion of `.planning/milestones/` from documentation updates prevents historical record corruption
- Comprehensive grep search ensures completeness of reference updates
- Sequential commit (cleanup first, then docs) keeps git history clean and bisectable

#### Concerns

- **MEDIUM**: The plan says "Remove only the 5 migrated test project dirs from tmp/" but doesn't address what happens if `tmp/` still contains other files or if the 5 directories don't match expected names exactly. A pre-deletion `ls tmp/` to confirm contents would be prudent.
- **MEDIUM**: The documentation update task updates 4+ files (PROJECT.md, STATE.md, REQUIREMENTS.md, ROADMAP.md) in a single task without specifying the order or what exact changes to make in each. This is a broad scope that could miss files or make inconsistent edits.
- **LOW**: "Read 38-01-SUMMARY.md to confirm Plan 01 completed" — there's no handling if the summary file indicates partial failure. The plan should state "proceed only if summary confirms full success; halt otherwise."
- **LOW**: The final verification grep only checks that no stale references remain, but doesn't verify that the NEW paths (`tests/e2e/codepoint-v2/`) are correctly referenced. A positive assertion would be stronger.

#### Suggestions

- Add a pre-deletion listing step: `ls tmp/` to confirm only expected directories exist and match the 5 project names
- Split documentation updates into clearer sub-steps or list the specific fields/sections to change in each file (e.g., "PROJECT.md: change R1 status from pending → complete, update path column")
- Add a guard clause: "If 38-01-SUMMARY.md indicates any failure or partial completion, STOP and report"
- After the final grep for stale references, add a positive check: `grep -r "tests/e2e/codepoint-v2/" .planning/ --include="*.md"` to confirm new references are in place

#### Risk Assessment: **LOW**

The plan's two-gate verification (read summary + re-verify builds) and targeted deletion approach minimize the risk of data loss. Documentation updates carry only low risk of inconsistency. Overall execution is straightforward with well-defined safety boundaries.

---

### Overall Phase Assessment

#### Strengths

- Clear separation of concerns: migration (Plan 01) → cleanup + documentation (Plan 02)
- Wave ordering with explicit dependency prevents premature deletion
- Research findings are thoroughly integrated into plan safeguards
- The checkpoint commit between plans is an excellent practice for irreversible operations

#### Cross-Plan Concerns

- **MEDIUM**: Neither plan addresses what happens to `tmp/` itself after the 5 project directories are removed. If `tmp/` becomes empty, should it be removed? Should it retain its `.gitignore`?
- **LOW**: No mention of whether the migrated test projects have any path-sensitive configuration (e.g., hardcoded `tmp/` paths in test files themselves, go.mod module paths, or fixture references).

#### Overall Risk: **LOW**

These are well-designed plans with appropriate safeguards for the risk level involved. The primary data loss scenario (Go embed directory) is explicitly guarded, irreversible operations have verification gates, and the commit checkpoint provides rollback capability.

**Recommendation: Approve with minor improvements** — address the rollback/failure-mode gap in Plan 01 and the pre-deletion confirmation in Plan 02.

---

## Consensus Summary

> 基于 1 个外部评审者 (OpenCode) 的反馈。运行环境为 Claude Code — 跳过自评审以保证独立性。

### 第一轮 vs 第二轮对比

| 关注点 | 第一轮状态 | 第二轮状态 |
|--------|-----------|-----------|
| `frontend/dist/` 保留断言 | 未提及 | **已解决** — Plan 01 Task 1 Step 7 增加显式断言 |
| Go build 工作目录 | 未明确 | **已解决** — 使用 `cd C:/WorkSpace/... && go build` |
| `.gitignore` 防护 | 未提及 | **已解决** — Plan 01 Task 1 Step 2 创建 |
| 清理后重新验证 | 未提及 | **已解决** — Plan 02 Task 1 增加构建重验证 |
| 文档引用全面搜索 | 仅列 4 文件 | **已解决** — Plan 02 Task 2 Step 1 全面 grep |
| Commit 检查点 | 未提及 | **已解决** — Plan 01 Task 2 Step 6 提交 |

### 第二轮新发现

| 优先级 | 关注点 | 建议 |
|--------|--------|------|
| MEDIUM | 无显式回滚计划（git mv 失败时） | 添加失败模式：`git reset HEAD~1` |
| MEDIUM | 删除前未列出 tmp/ 内容确认 | 添加 `ls tmp/` 预检步骤 |
| MEDIUM | 文档更新单任务覆盖 4+ 文件 | 拆分为更清晰的子步骤 |
| MEDIUM | tmp/ 目录最终状态未明确 | 说明保留空 tmp/ 还是移除 |
| LOW | `.gitkeep` 放置无充分理由 | 除非有空子目录需要，否则移除 |
| LOW | Shell 环境假设未显式说明 | 标注 Git Bash 要求 |
| LOW | Plan 01 部分失败无处理 | 添加：summary 显示部分失败时终止 |
| LOW | 新路径引用缺少正面断言 | 添加 grep 确认 `tests/e2e/codepoint-v2/` |

### 整体评价

第二轮评审中，第一轮的 5 个主要关注点已全部在修订版计划中解决。第二轮发现的关注点多为操作细节优化（回滚计划、预检步骤、文档拆分），不影响计划的核心安全性。

**最终建议：批准并执行** — 可选择性采纳第二轮建议以进一步提升操作健壮性。
