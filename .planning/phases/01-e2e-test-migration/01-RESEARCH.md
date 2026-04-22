# Phase 38: E2E Test Migration - Research

**Researched:** 2026-04-19
**Domain:** File migration / git operations / directory restructuring
**Confidence:** HIGH

## Summary

Phase 38 migrates 5 E2E test projects from `tmp/` (temporary directory) to `tests/e2e/codepoint-v2/` (permanent test archive). The migration is primarily a file-move operation with git tracking adjustments and doc reference updates.

**Key discovery:** Only 2 of 5 test projects are tracked by git (`gojs-calculator`: 35 files, `pyts-calculator`: 30 files). The other 3 (`go-calculator`, `python-calculator`, `template-test`) were never committed -- they exist only on disk, likely created by E2E test execution scripts during v1.9.1. This means `go-calculator`, `python-calculator`, and `template-test` must be freshly added to git at their new location, while `gojs-calculator` and `pyts-calculator` can use `git mv` to preserve history.

**Primary recommendation:** Use `git mv` for tracked files (gojs-calculator, pyts-calculator), use regular `cp` + `git add` for untracked files (go-calculator, python-calculator, template-test). Clean build artifacts (`__pycache__`, `node_modules`, `.playwright-cli`, `.exe`) before or during migration.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R1 | E2E test project migration from tmp/ to tests/e2e/codepoint-v2/ | Git tracking audit per project; artifact identification; migration strategy per tracked/untracked |
| R3 | Directory structure standardization for E2E tests | Target directory structure; naming conventions; independence verification |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File migration | Filesystem / Git | - | Pure file-move with git tracking |
| Git history preservation | Git | - | `git mv` for tracked files preserves rename history |
| Build artifact cleanup | Filesystem | - | Remove caches, binaries before migration |
| Documentation updates | Docs / Config | - | Update path references in planning docs and CLAUDE.md |
| Go module validation | Build tooling | - | `go build` and `go test` after move to verify module integrity |
| Python import validation | Build tooling | - | `pytest` after move to verify no broken imports |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| git | 2.x | File migration with history preservation | Standard VCS, `git mv` preserves rename detection [VERIFIED: git ls-files] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Go 1.24 | 1.24.11 | Build/test go-calculator and gojs-calculator | Post-migration verification |
| Python 3.11 | 3.11.x | Run tests for python-calculator and pyts-calculator | Post-migration verification |
| Node.js | current | npm install for frontend projects | Post-migration if re-running frontend builds |

**Installation:** No new packages needed -- this is a migration phase using existing tools.

## Architecture Patterns

### System Architecture Diagram

```
tmp/                              tests/e2e/codepoint-v2/
  go-calculator/          -->       go-calculator/
  python-calculator/      -->       python-calculator/
  gojs-calculator/        -->       gojs-calculator/
  pyts-calculator/        -->       pyts-calculator/
  template-test/          -->       template-test/

Tests/ (existing)                  Tests/ (after migration)
  .gitkeep                          .gitkeep
  test_security_rules.py            test_security_rules.py
                                    e2e/
                                      codepoint-v2/        <-- NEW
                                        go-calculator/
                                        python-calculator/
                                        gojs-calculator/
                                        pyts-calculator/
                                        template-test/
```

### Recommended Project Structure
```
tests/
  .gitkeep                                    # existing
  test_security_rules.py                      # existing
  e2e/
    codepoint-v2/                             # NEW - matches milestone version
      go-calculator/                          # Go single-language
        .codepoints/                          # codepoint scan results
        codepoint/                            # Go codepoint library
        internal/                             # Go internal packages
        main.go
        go.mod
        tests/                                # integration tests
      python-calculator/                      # Python single-language
        api/
        batch/
        calculator/
        codepoint/
        history/
        main.py
        tests/
      gojs-calculator/                        # Go+JS fullstack
        codepoint/
        frontend/
          src/
          package.json
          dist/                               # built assets
        internal/
        main.go
        go.mod
      pyts-calculator/                        # Python+TS fullstack
        api/
        batch/
        calculator/
        codepoint/
        frontend/
          src/
          package.json
        history/
        main.py
        tests/
      template-test/                          # probe template verification
        go/
        python/
```

### Pattern 1: Git-aware Migration
**What:** Use different strategies based on git tracking status
**When to use:** When moving files that may or may not be tracked
**Example:**
```bash
# For TRACKED files (gojs-calculator, pyts-calculator):
mkdir -p tests/e2e/codepoint-v2
git mv tmp/gojs-calculator tests/e2e/codepoint-v2/gojs-calculator
git mv tmp/pyts-calculator tests/e2e/codepoint-v2/pyts-calculator

# For UNTRACKED files (go-calculator, python-calculator, template-test):
# Copy source files only (exclude __pycache__, .exe, node_modules, .playwright-cli)
mkdir -p tests/e2e/codepoint-v2/go-calculator
cp -r tmp/go-calculator/. tests/e2e/codepoint-v2/go-calculator/
# Then clean artifacts from the copy
find tests/e2e/codepoint-v2/ -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
git add tests/e2e/codepoint-v2/go-calculator/
```

### Pattern 2: Artifact Cleanup Before Migration
**What:** Remove build artifacts and caches before moving to permanent home
**When to use:** Always when migrating from tmp/ to a permanent directory

**Artifacts to remove per project:**
| Artifact | Projects Affected | Reason |
|----------|-------------------|--------|
| `__pycache__/` | python-calculator, pyts-calculator, template-test | Python bytecode cache, regenerable |
| `node_modules/` | gojs-calculator, pyts-calculator | ~120MB each, regenerable via `npm install` |
| `.playwright-cli/` | gojs-calculator | Test execution logs, not source |
| `*.exe` | gojs-calculator (8.9MB) | Compiled binary, regenerable via `go build` |

### Anti-Patterns to Avoid
- **Moving node_modules/:** Never migrate 120MB of npm packages. Exclude and use `npm install` to regenerate.
- **Moving `__pycache__`:** These are platform-specific bytecode files that should not be committed.
- **Moving `.exe` binaries:** Compiled artifacts have no place in git.
- **Using `cp -r` for tracked files:** Loses git history. Use `git mv` instead.
- **Forgetting to update .gitignore:** The `tmp/` pattern in `.gitignore` means new files under `tests/e2e/` need no special handling, but the old tracked files in `tmp/` need to be removed from git.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File migration script | Custom shell script | `git mv` + `cp` | git mv preserves history; cp handles untracked files |
| Artifact cleanup | Manual file-by-file deletion | `find -name __pycache__ -exec rm -rf` | One-liner handles nested directories |
| Path reference update | Manual grep-and-replace | `grep -rl` + targeted edits | Ensures nothing is missed |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None -- test projects are stateless (no databases, no persistent stores) | None |
| Live service config | None -- no external services depend on tmp/ paths | None |
| OS-registered state | None -- no OS-level registrations (no Task Scheduler, no systemd, no pm2) | None |
| Secrets/env vars | None -- no secrets or env vars reference tmp/ paths | None |
| Build artifacts | gojs-calculator.exe (8.9MB), node_modules/ (~240MB total), `__pycache__/` (13 directories), `.playwright-cli/` (39KB) | Delete before/during migration, do NOT migrate |

**Nothing found in categories 1-4.** These are self-contained test projects with no external runtime dependencies. Build artifacts (category 5) must be cleaned.

## Common Pitfalls

### Pitfall 1: Git Tracking Split
**What goes wrong:** 3 of 5 projects have no git history. Using `git mv` on them will fail silently or create empty commits.
**Why it happens:** `tmp/` is in `.gitignore`. Only gojs-calculator and pyts-calculator were force-added during v1.9.1 development phases.
**How to avoid:** Check `git ls-files -- tmp/$PROJECT/` for each project before choosing `git mv` vs `cp + git add`. [VERIFIED: git ls-files output]
**Warning signs:** `git mv tmp/go-calculator` produces "fatal: not under version control"

### Pitfall 2: Go Module Path Integrity
**What goes wrong:** Go files use module name in import paths (e.g., `"gojs-calculator/codepoint"`). Moving the directory does NOT break this because `go.mod` defines the module name, not the directory path. However, running `go build` from the wrong directory will fail.
**Why it happens:** Go modules are identified by `module` directive in `go.mod`, not by filesystem path.
**How to avoid:** Verify `go build ./...` and `go test ./...` from within each Go project's root directory after migration. The module name stays the same.
**Warning signs:** Build errors referencing the old `tmp/` path.

### Pitfall 3: Frontend dist/ Directory Tracked
**What goes wrong:** `gojs-calculator/frontend/dist/` is tracked in git (CSS, JS, HTML, SVG). The `.gitignore` in the frontend excludes `dist/`, but it was force-added for the Go `//go:embed` directive to work.
**Why it happens:** Go's embed directive needs the built assets committed so `go build` works without Node.js installed.
**How to avoid:** Migrate `dist/` as-is. Do NOT delete it. It is required for Go compilation.
**Warning signs:** `go build` fails with "no matching files found for pattern frontend/dist/*"

### Pitfall 4: Missing package-lock.json for pyts-calculator
**What goes wrong:** `pyts-calculator/frontend/package-lock.json` is tracked in git but NOT present on disk (only `package.json` is tracked).
**Why it happens:** The file was in `.gitignore` or was not committed during v1.9.1.
**How to avoid:** If `npm install` is needed post-migration, it will regenerate `package-lock.json`. No action needed for migration itself.
**Warning signs:** npm install produces different dependency versions than original.

### Pitfall 5: node_modules Not Tracked But Referenced
**What goes wrong:** `node_modules/` exists on disk (120MB each) but is not tracked in git. After migration, `npm install` is needed to restore them if frontend testing is required.
**Why it happens:** Standard practice -- `node_modules/` is always gitignored.
**How to avoid:** Do not copy `node_modules/`. Run `npm install` in the new location if needed.
**Warning signs:** Frontend builds fail with "Cannot find module" errors.

### Pitfall 6: .gitignore tmp/ Pattern Blocks Future tmp/ Usage
**What goes wrong:** After migration and tmp/ cleanup, the `.gitignore` still has `tmp/`. This is correct -- CLAUDE.md says "temporary test code/data unified in tmp/". No conflict.
**Why it happens:** By design.
**How to avoid:** Keep `.gitignore` as-is. tmp/ remains the designated temporary directory.

## Code Examples

### Migration Commands (Core Operation)
```bash
# Step 1: Create target directory
mkdir -p tests/e2e/codepoint-v2

# Step 2: Move TRACKED projects using git mv
git mv tmp/gojs-calculator tests/e2e/codepoint-v2/gojs-calculator
git mv tmp/pyts-calculator tests/e2e/codepoint-v2/pyts-calculator

# Step 3: Copy UNTRACKED projects (source files only)
# go-calculator
cp -r tmp/go-calculator tests/e2e/codepoint-v2/go-calculator
# python-calculator
cp -r tmp/python-calculator tests/e2e/codepoint-v2/python-calculator
# template-test
cp -r tmp/template-test tests/e2e/codepoint-v2/template-test

# Step 4: Clean artifacts from copied directories
find tests/e2e/codepoint-v2/ -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find tests/e2e/codepoint-v2/ -type f -name "*.pyc" -delete 2>/dev/null

# Step 5: Add untracked projects to git
git add tests/e2e/codepoint-v2/go-calculator/
git add tests/e2e/codepoint-v2/python-calculator/
git add tests/e2e/codepoint-v2/template-test/

# Step 6: Clean tmp/ directory
rm -rf tmp/*

# Step 7: Verify
git status
```

### Post-Migration Go Verification
```bash
cd tests/e2e/codepoint-v2/go-calculator && go build ./...
cd tests/e2e/codepoint-v2/gojs-calculator && go build ./...
```

### Post-Migration Python Verification
```bash
cd tests/e2e/codepoint-v2/python-calculator && python -m pytest tests/ -x -q
cd tests/e2e/codepoint-v2/pyts-calculator && python -m pytest tests/test_calculator.py -x -q
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tmp/ for test projects | tests/e2e/codepoint-v2/ for permanent E2E tests | v1.9.2 (2026-04-19) | Test projects become permanent, versioned assets |

**No deprecation concerns** -- this is a one-time migration, not a technology upgrade.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | go-calculator, python-calculator, template-test were never committed to git (confirmed: `git log` returns empty) | Git Tracking | Low -- verified |
| A2 | Go module names do not need changing after directory move | Pitfall 2 | Medium -- if wrong, Go builds fail; verification step catches this |
| A3 | No external tools or CI pipelines reference tmp/ paths | Runtime State | Low -- this is a personal project with no CI |
| A4 | The archived milestone docs (.planning/milestones/) reference tmp/ but do NOT need updating (historical records) | Doc References | Low -- they are archived snapshots |

**If this table is empty:** Not applicable -- 4 assumptions documented.

## Open Questions (RESOLVED)

1. **Should gojs-calculator.exe be committed to the new location?**
   - What we know: It exists on disk (8.9MB) but is not tracked by git
   - What's unclear: Whether it should be tracked at the new location
   - Recommendation: No -- binaries should not be in git. Users can `go build` if needed.
   - RESOLVED: Plan 01 Task 1 Step 4 deletes the .exe before migration. Plan adds .gitignore with `*.exe` pattern to prevent future commits.

2. **Should .playwright-cli/ logs be preserved?**
   - What we know: Contains test execution logs from E2E verification (39KB, not tracked)
   - What's unclear: Whether these logs have diagnostic value worth preserving
   - Recommendation: No -- they are ephemeral test artifacts, not source code.
   - RESOLVED: Plan 01 Task 1 Step 4 deletes .playwright-cli/ before migration. Plan adds .gitignore with `.playwright-cli/` pattern.

3. **Should node_modules/ be restored after migration?**
   - What we know: ~240MB total across gojs-calculator and pyts-calculator frontends
   - What's unclear: Whether frontend testing will be run from the new location
   - Recommendation: No -- restore only if/when needed via `npm install`.
   - RESOLVED: Plan 01 Task 1 Step 4 deletes node_modules/ before migration. Plan adds .gitignore with `node_modules/` pattern. No `npm install` in plan -- restore on demand only.

4. **Should the archived milestone docs (926 references to tmp/) be updated?**
   - What we know: `.planning/milestones/` contains 926 references to tmp/ paths
   - What's unclear: Whether historical phase documents should be updated
   - Recommendation: No -- they are archived historical records. Updating them would destroy their accuracy as historical artifacts. Only active docs (PROJECT.md, STATE.md) need updating.
   - RESOLVED: Plan 02 Task 2 explicitly excludes .planning/milestones/ from updates (Step 1 grep excludes milestones/, Step 6 final verification excludes milestones/).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | Migration | Yes | 2.x (tracked) | -- |
| Go 1.24 | go-calculator, gojs-calculator verification | Yes (on disk) | 1.24.11 | Skip Go verification |
| Python 3.11 | python-calculator, pyts-calculator verification | Yes (on disk) | 3.11.x | Skip Python verification |
| Node.js/npm | Frontend rebuild (if needed) | Yes | current | Skip frontend operations |

**Missing dependencies with no fallback:**
- None -- all required tools are available.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

> nyquist_validation is not explicitly set in config.json. Per standard practice, include this section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Go test + pytest (per project) |
| Config file | None -- per-project standard configs |
| Quick run command | `cd tests/e2e/codepoint-v2/go-calculator && go build ./...` |
| Full suite command | Per-project verification (see below) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1 | Files migrated to tests/e2e/codepoint-v2/ | smoke | `ls tests/e2e/codepoint-v2/{go,python,gojs,pyts,template}*` | Wave 0 |
| R1 | tmp/ cleaned | smoke | `ls tmp/` (expect empty) | Wave 0 |
| R1 | No broken imports after move | unit | `cd tests/e2e/codepoint-v2/go-calculator && go build ./...` | Wave 0 |
| R1 | Python tests pass after move | unit | `cd tests/e2e/codepoint-v2/python-calculator && python -m pytest tests/ -x -q` | Wave 0 |
| R3 | Directory structure matches spec | manual | Visual inspection | Wave 0 |
| R1 | No stale tmp/ references in active docs | smoke | `grep -r "tmp/" .planning/PROJECT.md .planning/STATE.md` | Wave 0 |

### Sampling Rate
- **Per task commit:** `ls tests/e2e/codepoint-v2/` + targeted `go build` or `pytest`
- **Per wave merge:** Full directory listing + all verification commands
- **Phase gate:** All 5 projects present, tmp/ empty, no stale references

### Wave 0 Gaps
- [ ] No test framework needed -- this is a migration phase, verification is through build/test commands in each migrated project

## Security Domain

> This phase is purely file migration with no security-relevant changes. No new code is written, no credentials are handled, no network endpoints are exposed. Security domain section skipped.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | no | -- |
| V5 Input Validation | no | -- |
| V6 Cryptography | no | -- |

No security threats identified for this migration phase.

## Project Constraints (from CLAUDE.md)

- Windows development system -- use Windows-compatible path separators and commands
- Temporary files belong in `tmp/` folder -- after migration, `tmp/` returns to its designated role
- Prefer modifying existing files over creating new ones
- Keep code and docs concise
- Follow existing project structure and style
- Project plans go in `docs/plans/`
- Bug records go in `docs/bugs/`

## Detailed File Inventory

### go-calculator (UNTRACKED - 29 files)
Source files to migrate:
```
.codepoints/                    # 16 files (index.json, collections, flows, points)
codepoint/codepoint.go          # Go codepoint base library
internal/api/server.go          # API server
internal/api/server_test.go     # API tests
internal/batch/processor.go     # Batch processor
internal/batch/processor_test.go
internal/calculator/calculator.go
internal/calculator/calculator_test.go
internal/history/store.go
internal/history/store_test.go
main.go                         # Entry point
go.mod                          # Go module: go-calculator, go 1.24.11
tests/integration_test.go       # Integration tests
```

### python-calculator (UNTRACKED - 15 files)
Source files to migrate (exclude `__pycache__/`):
```
api/__init__.py, server.py
batch/__init__.py, processor.py
calculator/__init__.py, core.py
codepoint/__init__.py
history/__init__.py, store.py
main.py
tests/__init__.py, test_api.py, test_calculator.py, test_integration.py
```
**Note:** `.codepoints/` directory not present (only tracked via gojs-calculator). Has `__pycache__/` in multiple directories -- must be excluded.

### gojs-calculator (TRACKED - 35 files in git, 42 on disk)
Tracked files to `git mv`:
```
.codepoints/index.json
codepoint/codepoint.go, collector.go, collector_test.go
frontend/ (src/, dist/, configs, package.json, package-lock.json)
internal/ (api/, batch/, calculator/, history/)
main.go, go.mod
```
Untracked artifacts to NOT migrate:
- `frontend/node_modules/` (~120MB)
- `gojs-calculator.exe` (8.9MB)
- `.playwright-cli/` (39KB, test execution logs)
- `frontend/public/` (favicon.svg, icons.svg -- only on disk, not tracked)

### pyts-calculator (TRACKED - 30 files in git, 34 on disk)
Tracked files to migrate:
```
api/__init__.py, server.py
batch/__init__.py, processor.py
calculator/__init__.py, core.py
codepoint/__init__.py, collector.py
frontend/ (src/, configs, package.json)
history/__init__.py, store.py
main.py
tests/conftest.py, test_calculator.py, test_linkage.py, test_toggle.py
```
Untracked artifacts to NOT migrate:
- `frontend/node_modules/` (~120MB)
- `frontend/dist/` (built assets -- not tracked, only gojs has tracked dist/)
- All `__pycache__/` directories

### template-test (UNTRACKED - 3 files)
Source files to migrate (exclude `__pycache__/`):
```
go/codepoint/codepoint.go
go/go.mod
python/codepoint/__init__.py
```

## Reference Updates Required

### Active Documents (MUST UPDATE)
| File | Line | Current Reference | Update To |
|------|------|-------------------|-----------|
| `.planning/PROJECT.md` | 113 | `tmp/` 迁移到 `tests/e2e/codepoint-v2/` | Mark as done |
| `.planning/PROJECT.md` | 140 | E2E 测试项目待从 tmp/ 迁移 | Update to "migrated" status |
| `.planning/STATE.md` | 66 | tmp/ 目录迁移完成后清空 | Will be done in this phase |
| `.planning/ROADMAP.md` | Phase 38 | Pending | Will be done in this phase |
| `.planning/REQUIREMENTS.md` | Various | tmp/ references | Mark items as complete |

### Archived Documents (DO NOT UPDATE)
| Location | Count | Reason |
|----------|-------|--------|
| `.planning/milestones/v1.9.1-phases/` | 926 references | Historical records -- updating would destroy accuracy |

### No References in Source Code
Test project source code (.go, .py, .ts, .tsx files) contains NO references to `tmp/` paths. Imports use module names (e.g., `"gojs-calculator/codepoint"`) not filesystem paths.

## Sources

### Primary (HIGH confidence)
- `git ls-files -- tmp/` -- definitive list of tracked files [VERIFIED]
- `git log --all -- tmp/` -- definitive history of commits [VERIFIED]
- `.gitignore` -- confirmed `tmp/` is gitignored [VERIFIED]
- `find tmp/ -type f` -- definitive on-disk file inventory [VERIFIED]

### Secondary (MEDIUM confidence)
- Project CLAUDE.md -- designates tmp/ as temporary file location [CITED: project docs]

### Tertiary (LOW confidence)
- None -- all findings verified through direct filesystem and git inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - git operations are well-understood, verified through direct inspection
- Architecture: HIGH - file inventory complete, tracking status verified per project
- Pitfalls: HIGH - all pitfalls identified through direct investigation of the codebase

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (stable -- no external dependencies that could change)