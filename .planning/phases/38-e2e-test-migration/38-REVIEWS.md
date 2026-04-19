---
phase: 38
reviewers: [opencode]
reviewed_at: "2026-04-19T09:00:00.000Z"
plans_reviewed: [38-01-PLAN.md, 38-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 38

## OpenCode Review

### Plan 38-01: Migrate Test Projects

#### Summary
Well-structured migration plan that correctly distinguishes between git-tracked and untracked files, applies appropriate strategies for each, and includes build verification. The task breakdown is logical and the artifact exclusion list is comprehensive. A few edge cases around the `frontend/dist/` tracking and Go build path sensitivity warrant attention.

#### Strengths
- **Correct git strategy split**: `git mv` for tracked files preserves history; `cp + git add` for untracked is appropriate since there's no history to preserve
- **Artifact cleanup before migration**: Cleaning `node_modules/`, `__pycache__/`, `.exe` before `git mv` avoids bloating the repo
- **Explicit "do NOT commit yet"** in Task 1 prevents premature partial commits
- **Build verification as part of migration** catches path-related breakage immediately
- **Threat model correctly scoped** — pure file migration, no code changes

#### Concerns
- **MEDIUM — frontend/dist/ handling ambiguity**: Research notes say `gojs-calculator/frontend/dist/` is tracked and required for Go's `//go:embed`, but Task 1 says "Clean... frontend/dist/" from `pyts-calculator`. The plan should explicitly confirm `gojs-calculator/frontend/dist/` is preserved, not just implicitly omitted. A careless operator could misread and delete it.
- **MEDIUM — Go build verification path assumption**: `go build ./...` works from within the module directory. The plan doesn't specify `workdir` — running from project root would fail. Need explicit `cd tests/e2e/codepoint-v2/gojs-calculator && go build ./...` or equivalent.
- **LOW — No disk space consideration**: `node_modules/` cleanup is ~240MB but the plan doesn't check if remaining disk space is adequate for the copy operations in Task 2 (copying before cleaning untracked projects).
- **LOW — Missing `.gitignore` consideration**: After migration, the new `tests/e2e/codepoint-v2/` location may need a `.gitignore` to prevent future build artifacts from being accidentally committed again.

#### Suggestions
- Add an explicit assertion step: "Verify `gojs-calculator/frontend/dist/` still exists and contains files after cleanup"
- Specify working directory for `go build` commands — e.g., `workdir="tests/e2e/codepoint-v2/gojs-calculator"`
- Add a `.gitignore` to `tests/e2e/codepoint-v2/` with patterns: `node_modules/`, `__pycache__/`, `*.exe`, `.playwright-cli/`
- Consider running `git status` between Task 1 and Task 2 to confirm renames are staged correctly before adding new files

---

### Plan 38-02: Clean tmp/ and Update Documentation

#### Summary
Clean follow-up plan that correctly identifies the dependency on 38-01, explicitly protects archived milestone docs from modification, and targets only active documentation. The selective cleanup approach (5 specific directories, not `rm -rf tmp/*`) is good practice.

#### Strengths
- **Selective rm**: Only removes the 5 migrated directories, not `rm -rf tmp/*` — avoids deleting any unrelated tmp content
- **Milestone protection**: Explicit "Do NOT touch .planning/milestones/" prevents contaminating historical records (926 references)
- **Reads 38-01-SUMMARY.md first**: Proper dependency gate — confirms migration succeeded before cleaning source
- **Documentation cross-references**: Updates PROJECT.md, STATE.md, REQUIREMENTS.md, and ROADMAP.md comprehensively

#### Concerns
- **MEDIUM — Missing verification of project functionality post-cleanup**: After deleting from `tmp/`, the plan doesn't re-verify that `tests/e2e/codepoint-v2/` projects still build. If something went wrong with the migration, the originals are now gone.
- **MEDIUM — Task 2 scope may miss references**: The plan lists 4 specific files to update, but doesn't mention searching for all `tmp/` references in active (non-milestone) `.planning/` files. Research found 926 references total — some may exist in `todos/`, `phases/`, or `STATE.md` beyond the 4 listed files.
- **LOW — No checkpoint before deletion**: Deleting `tmp/` directories is irreversible. A `git commit` after 38-01 but before 38-02's cleanup would provide a recovery point. The plan doesn't mention committing 38-01's work first.

#### Suggestions
- Run a `grep` for `tmp/` references across `.planning/` (excluding `milestones/`) before starting Task 2 to ensure complete coverage
- Add a "re-verify builds" step in Task 1 after confirming migration but before any deletion
- Commit 38-01 results before starting 38-02 — this creates a natural rollback point
- Consider whether `docs/research/codepoint/` references need updating (per R3 requirements)

---

### Overall Risk Assessment: LOW-MEDIUM

**Justification**: The plans are well-scoped with clear boundaries. The primary risk is the **`frontend/dist/` deletion ambiguity** in 38-01 Task 1 — if misread, it breaks `gojs-calculator` builds. The secondary risk is **incomplete documentation reference updates** in 38-02, which could leave stale `tmp/` paths in planning files. Both are mitigable with the suggestions above. The migration itself is straightforward file operations with no code changes, no network calls, and no trust boundary concerns.

---

## Consensus Summary

> 基于单一外部评审者 (OpenCode) 的反馈综合

### Agreed Strengths (评审者共识)
- Git 策略正确区分了 tracked/untracked 文件
- 清理构建产物在迁移之前执行是好的设计
- 选择性删除（仅删 5 个目录，非 `rm -rf tmp/*`）
- 明确保护归档里程碑文档不被修改
- 依赖门控：Plan 02 读取 Plan 01 的 SUMMARY.md 确认完成后再清理

### Key Concerns (需关注)
1. **MEDIUM — `frontend/dist/` 删除歧义**: Plan 01 Task 1 清理说明中 `pyts-calculator/frontend/dist/` 的删除可能被误读为也删除 `gojs-calculator/frontend/dist/`（后者是 Go embed 必需的）
2. **MEDIUM — Go build 命令缺少工作目录指定**: `go build ./...` 必须在模块目录内执行，计划中虽有 `cd` 命令但应更明确
3. **MEDIUM — 清理后缺少重新验证**: Plan 02 删除 tmp/ 前未重新确认 tests/e2e/ 中的项目功能正常
4. **MEDIUM — 文档引用可能遗漏**: Plan 02 仅列出 4 个文件需更新，未全面搜索 .planning/ 下所有活跃文档

### Divergent Views
- 单一评审者，无分歧观点

### Suggested Actions (优先级排序)
1. 在 Plan 01 Task 1 中增加明确断言：验证 `gojs-calculator/frontend/dist/` 保留且非空
2. 考虑在 `tests/e2e/codepoint-v2/` 添加 `.gitignore` 防止未来构建产物被提交
3. 在 Plan 02 Task 1 删除 tmp/ 前增加构建验证步骤
4. 在 Plan 02 开始前 grep 搜索 .planning/ 下所有 tmp/ 引用（排除 milestones/）
5. 考虑在 Plan 01 和 Plan 02 之间增加 commit 检查点
