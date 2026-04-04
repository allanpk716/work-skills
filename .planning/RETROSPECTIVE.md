# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.7 — 通知项目名称智能识别

**Shipped:** 2026-04-04
**Phases:** 2 | **Plans:** 3 | **Sessions:** 1

### What Was Built
- find_project_root() upward traversal detecting .git directories and CLAUDE.md files
- get_project_name() returning directory name or cwd basename fallback
- 13 TDD test cases (9 find_project_root + 4 get_project_name) using mock-based Path traversal
- Migrated both notification scripts (notify.py, notify-attention.py) from local os.getcwd-based implementations to shared flags.py module
- Total: 85 tests passing (9 test_notify + 29 test_flags + 47 others)

### What Worked
- TDD RED→GREEN flow was seamless — 13 tests defined behavioral contract, implementation made them all pass in 1 minute
- Reusing flags.py upward traversal pattern from v1.6 (Phase 26) reduced design decisions to near-zero
- Single-session completion (5 min execution time) — tightest scope milestone yet
- No deviations from plan — all three plans executed exactly as written

### What Was Inefficient
- None identified — milestone was optimally scoped at 2 phases / 3 plans

### Patterns Established
- Dual marker detection: .git (is_dir) checked first, CLAUDE.md (is_file) second — covers Git and non-Git projects
- Single source of truth: flags.py now owns all shared notification logic (flag checking + project name detection)
- Mock setup convention: both is_dir and is_file set to False on all mock paths to prevent MagicMock truthiness

### Key Lessons
1. Building on established patterns (v1.6 upward traversal) enables sub-minute implementation phases
2. TDD contract-first approach eliminates ambiguity — all 13 tests passed without modification
3. Milestones that reuse infrastructure from previous milestones are dramatically faster

### Cost Observations
- Model mix: ~95% sonnet, ~5% opus
- Sessions: 1
- Notable: Fastest execution time — ~5 min total, demonstrating compound returns on infrastructure investment (v1.6 → v1.7)

---

## Milestone: v1.6 — 通知标志文件向上查找 + 全局控制

**Shipped:** 2026-04-01
**Phases:** 3 | **Plans:** 5 | **Sessions:** 1

### What Was Built
- Shared flags.py module with upward directory traversal for .no-xxx detection
- Global ~/.claude/.no-xxx fallback detection with project-level priority
- --global flag for notify-enable/disable commands
- notify-status showing project-level vs global source annotation
- diagnose_configuration() updated with source labels
- 72 Python tests all passing

### What Was Worked
- 3-phase split (find-up → global → diagnostics) was clean and logical
- TDD for shared module caught issues early — all tests stable
- Installer updated to deploy flags.py alongside scripts

### What Was Inefficient
- None identified — milestone was well-scoped

### Patterns Established
- Shared flags.py as notification infrastructure module
- 6-key return dict for separating project-level and global-level path info
- Per-channel independence in flag checking

### Key Lessons
1. Shared modules (flags.py) enable DRY and become the foundation for future features (v1.7 proves this)
2. Project-level vs global-level priority is a clean abstraction for file-based configuration
3. Diagnostic mode should use the same data source as production code, not duplicate logic

### Cost Observations
- Model mix: ~90% sonnet, ~10% opus
- Sessions: 1
- Notable: 5 plans in 1 session, establishing flags.py infrastructure paid off immediately in v1.7

---

## Milestone: v1.5 — NPX 卸载功能

**Shipped:** 2026-03-30
**Phases:** 2 | **Plans:** 4 | **Sessions:** 2

### What Was Built
- `--uninstall` CLI entry point with 7-component detection (plugins, hooks scripts, hooks registration, commands, marketplace source, marketplace cache, env vars)
- ASCII colored table for detection results display
- 7-step fault-tolerant removal execution (remover.js) with per-step try/catch
- Colored ASCII result report (reporter.js) with [v]/[x]/[-] status icons
- Full detect→confirm→remove→report orchestration via enquirer Confirm (default: No)
- Bilingual i18n support (26 uninstall.* keys in en/zh)
- CLI routing update from runUninstallDetection to runUninstall

### What Worked
- Phase 24 (detection) and Phase 25 (execution) separation was clean — detection tested independently before building execution on top
- TDD for remover.js (17 tests) caught edge cases early — fault tolerance worked correctly on first try
- SUMMARY.md one-liners from Phase 24 directly informed Phase 25's integration plan
- Key-links verification between waves caught no gaps — clean dependency chain

### What Was Inefficient
- Phase 25 could have been a single plan (orchestration is straightforward), but splitting into remover+reporter vs orchestration allowed parallel test writing
- Pre-existing test suite failures (8 suites) unrelated to v1.5 caused noise in regression gate — should clean those up

### Patterns Established
- removeStep helper: per-step try/catch with status tri-state (removed/failed/skipped), never throws
- Structured return pattern: runUninstall() returns { success, aborted?, nothingToRemove?, results? }
- enquirer Confirm initial:false as safety default for destructive operations
- Module separation: detector/remover/reporter as independent testable units, index.js as thin orchestrator

### Key Lessons
1. Fault-tolerant design (continue on failure) is essential for uninstall — file locks and permission issues are common on Windows
2. Detection and removal as separate phases enables clean testing — detect first, then remove
3. Confirm default:No prevents accidental data loss — user must actively opt-in
4. Pre-existing test debt should be cleaned up between milestones to keep regression gates useful

### Cost Observations
- Model mix: ~90% sonnet, ~10% opus
- Sessions: 2
- Notable: 2-phase milestone completed in single session (auto-advance), ~20 min total execution time

---

## Milestone: v1.4 — 修复插件安装检测

**Shipped:** 2026-03-30
**Phases:** 2 | **Plans:** 2 | **Sessions:** 1

### What Was Built
- Flattened windows-git-commit plugin directory from nested skills/ subdirectory to root level
- Verified isPluginInstalled() detection end-to-end through real installer reinstallation
- Confirmed no regression in claude-notify detection

### What Worked
- Root cause analysis was precise: SKILL.md path mismatch between installer expectations and actual plugin structure
- Minimal fix approach — restructure plugin directory instead of modifying installer code — kept blast radius small
- git mv preserved full history tracking during directory restructure
- E2E verification through actual installer (push to remote, reinstall, verify) caught a real issue (unpushed commits)

### What Was Inefficient
- Phase 23 discovered Phase 22 commits hadn't been pushed to remote — installer cloned stale code
- Small milestone could have been a single phase (fix + verify) but keeping structure/verification separate was cleaner for traceability

### Patterns Established
- Plugin root layout convention: plugins/<name>/SKILL.md at root level (matches claude-notify pattern)
- E2E verification: push structural fix to remote, reinstall via real installer, verify detection
- Auto-approve deterministic checkpoints when code path analysis proves the result is guaranteed

### Key Lessons
1. Always verify remote state before testing installer flows — local != remote
2. Structural fixes (directory layout) can solve detection issues without touching detection logic
3. v1.4 continued the tight-scope pattern from v1.3 — 1 session, 2 phases, fast ship

### Cost Observations
- Model mix: ~80% sonnet, ~20% opus
- Sessions: 1
- Notable: Fastest milestone yet — single session from requirements to shipped

---

## Milestone: v1.3 — 智能配置检测

**Shipped:** 2026-03-29
**Phases:** 2 | **Plans:** 3 | **Sessions:** 2

### What Was Built
- Dual-source Pushover credential detection (process.env + Windows registry fallback)
- Per-item Confirm interaction for both Pushover and Git user configurators (4-case handling)
- Unified install flow: fresh install and re-run auto-adapt with zero detection overhead
- 14 integration tests covering all UFLOW scenarios with detection-level testing strategy

### What Worked
- Focused scope (2 phases) delivered quickly — 2 days from requirements to shipped
- Detection-level testing strategy avoided the complexity of mocking interactive enquirer prompts
- Per-item Confirm pattern (4-case: both/only token/only user/neither) proved reusable across configurators
- GSD audit caught all gaps before milestone completion (7/7 requirements, 12/12 integration)

### What Was Inefficient
- Phase 20 started then paused at WIP stage, requiring a session restart to complete
- Test helper needed async fix (Promise.all) — latent issue from earlier phases that surfaced here
- npm test (Jest) doesn't run configurator tests (pre-existing) — self-executing scripts workaround

### Patterns Established
- Dual-source detection: process.env priority + registry fallback for setx-persisted values
- Per-item Confirm: initial:true default keep, fall-through to full input on decline
- Detection-level integration tests: test detect*() functions + orchestration structure, not interactive prompts
- Unified save block: single persistence point after all cases determine final values

### Key Lessons
1. Small milestones (2-3 phases) ship faster and are easier to audit — keep scope tight
2. Testing interactive CLI flows at the detection/orchestration level is more reliable than mocking prompts
3. GSD milestone audit before completion catches integration gaps early (12/12 exports verified)

### Cost Observations
- Model mix: ~70% sonnet, ~30% opus
- Sessions: 2
- Notable: v1.3 was the fastest milestone — 2 days, 2 phases, demonstrating the value of tight scope

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.2 | 8 | 7 | NPX installer foundation, full TDD workflow |
| v1.3 | 2 | 2 | Tight scope, fast delivery, audit-first |
| v1.4 | 1 | 2 | Single-session ship, structural fix over code fix |
| v1.5 | 2 | 2 | Uninstall flow, fault-tolerant removal, auto-advance |
| v1.6 | 1 | 3 | Shared flags.py, global control, upward traversal infrastructure |
| v1.7 | 1 | 2 | TDD project root detection, fastest execution (~5 min) |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.2 | 128+ | Full | 0 new deps |
| v1.3 | 163+ | Full | 0 new deps |
| v1.4 | 163+ | Full | 0 new deps (verification only) |
| v1.5 | 220+ | Full | 0 new deps (57 uninstall tests) |
| v1.6 | 72 Python | Full | 0 new deps (shared flags.py) |
| v1.7 | 85 Python | Full | 0 new deps (38 notification tests) |

### Top Lessons (Verified Across Milestones)

1. CJS + zero new dependencies keeps the installer lightweight and compatible
2. Bilingual support (en + zh) should be added alongside features, not retrofitted
3. Detection-level testing is the right abstraction for interactive CLI features
4. Tight-scope milestones (1-2 sessions) consistently outperform large ones — keep it small
5. Fault-tolerant design (continue-on-failure) is essential for Windows uninstall — file locks are inevitable
6. Confirm default:No prevents accidental data loss in destructive operations — always use initial:false
