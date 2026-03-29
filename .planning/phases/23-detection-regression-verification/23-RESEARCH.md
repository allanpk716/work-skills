# Phase 23: Detection & Regression Verification - Research

**Researched:** 2026-03-29
**Domain:** Plugin installation detection verification
**Confidence:** HIGH

## Summary

Phase 23 is a **verification-only phase** -- no code modifications expected. Phase 22 restructured the `windows-git-commit` plugin source directory so `SKILL.md` sits at plugin root (matching `claude-notify`), but the currently installed version at `~/.claude/skills/windows-git-commit/` still has the old broken nested structure. Running the installer will fix this by overwriting with the new flattened structure. The task is to confirm that (1) `isPluginInstalled('windows-git-commit')` returns true after reinstall, (2) the `[installed]` marker shows in the marketplace table, and (3) `claude-notify` detection is unaffected.

The detection logic is a single `fs.existsSync()` call checking for `~/.claude/skills/<name>/SKILL.md`. The current installed `windows-git-commit` has SKILL.md at the nested path `skills/windows-git-commit/SKILL.md` instead of at root, so detection fails. After reinstalling from the fixed source (Phase 22), SKILL.md will be at root and detection will succeed. `claude-notify` already has the correct structure and is unaffected by any changes in this phase.

**Primary recommendation:** Run the installer to reinstall `windows-git-commit`, then manually verify the three success criteria using direct Node.js calls and the marketplace UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 手动运行实际安装器验证 -- 运行 `npx @allanpk716/work-skills-setup`，实际检查三个成功标准是否满足。不编写新的自动化测试。
- **D-02:** 最小验证范围 -- 只确认三个成功标准（DETECT-01/02/03），不做额外边界测试。
- **D-03:** 不需要清理逻辑 -- 安装器使用 `cpSync` 覆盖整个目录，旧结构会被新结构自动覆盖。重新安装即修复。
- **D-04:** 不添加新测试 -- 手动验证足以确认修复有效。现有测试（`plugin-installer.test.js`）已覆盖 `isPluginInstalled()` 基本逻辑。

### Claude's Discretion
- 手动验证的具体步骤和操作顺序
- 验证结果的记录方式

### Deferred Ideas (OUT OF SCOPE)
- "Add slash commands to toggle notification channels" -- 已在 Phase 13 完成（shipped），关键词误匹配，不属于 Phase 23
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETECT-01 | windows-git-commit 安装后 `isPluginInstalled()` 能正确检测到 SKILL.md 存在 | Detection logic is `fs.existsSync(path.join(getSkillsDir(), 'windows-git-commit', 'SKILL.md'))`. After reinstall from fixed source, SKILL.md will exist at root. |
| DETECT-02 | 重复运行安装器时,windows-git-commit 显示 `[installed]` 标记且不提示安装 | `displayPluginTable()` calls `isPluginInstalled()` per plugin (line 29 of index.js). MultiSelect disables already-installed plugins (line 105). If DETECT-01 passes, DETECT-02 follows automatically. |
| DETECT-03 | 修复后 claude-notify 的安装检测仍正常工作(回归验证) | claude-notify already has correct structure, confirmed working (`isPluginInstalled('claude-notify')` returns true). No code changes in this phase means no regression risk. |
</phase_requirements>

## Standard Stack

### Core (No new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | built-in (v22.14.0) | File existence check | `isPluginInstalled()` uses `fs.existsSync()` |
| Node.js path | built-in | Path construction | `path.join()` for cross-platform paths |
| Node.js os | built-in | Home directory | `os.homedir()` for `~/.claude/skills` |

### Existing Test Infrastructure
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js test runner | built-in | Existing tests | `plugin-installer.test.js` already covers `isPluginInstalled()` |

**Installation:** No new packages needed.

## Architecture Patterns

### Detection Flow
```
isPluginInstalled(pluginName)
  --> getSkillsDir()  returns ~/.claude/skills
  --> fs.existsSync(~/.claude/skills/<pluginName>/SKILL.md)
  --> true/false
```

### Installation Flow (installPlugin)
```
installPlugin(plugin)
  --> git clone --depth 1 REPO_URL tempDir
  --> sourcePath = tempDir/<plugin.source> (e.g., tempDir/plugins/windows-git-commit)
  --> targetPath = ~/.claude/skills/<plugin.name>
  --> cpSync(sourcePath, targetPath, { recursive: true })
  --> SKILL.md now at ~/.claude/skills/<pluginName>/SKILL.md
```

### Marketplace Display Flow
```
displayPluginTable(plugins)
  --> forEach plugin: isPluginInstalled(plugin.name)
  --> if true: show chalk.green(' [installed]')

MultiSelect choices
  --> disabled: isPluginInstalled(plugin.name)
  --> already-installed plugins cannot be re-selected

installPlugins(plugins)
  --> forEach plugin: if isPluginInstalled(plugin.name) --> skip
  --> skipped plugins pushed to result.skipped array
```

### Current State Analysis
```
Source (after Phase 22 fix):
  plugins/windows-git-commit/SKILL.md        <-- at root (CORRECT)

Currently installed (OLD broken structure):
  ~/.claude/skills/windows-git-commit/
    skills/windows-git-commit/SKILL.md       <-- nested (BROKEN)
    .claude-plugin/
    security-scanner/

After reinstall:
  ~/.claude/skills/windows-git-commit/
    SKILL.md                                 <-- at root (FIXED)
    hooks/
    scanner/
    tests/
    .claude-plugin/                          <-- from new source
    skills/windows-git-commit/               <-- STALE leftover (not deleted by cpSync)
```

### Important cpSync Behavior
`fs.cpSync(source, target, { recursive: true })` copies files from source into target but does NOT delete files in target that are absent from source. This means:
- The old `skills/` subdirectory in the installed location will remain after reinstall
- However, this is harmless because `isPluginInstalled()` only checks for `SKILL.md` at root
- The new `SKILL.md` at root will be added, making detection work

### Anti-Patterns to Avoid
- **Do not modify installer code:** The fix is in the source plugin structure (already done in Phase 22). The installer works correctly when given correct source structure.
- **Do not add new automated tests:** Per D-04, manual verification is sufficient.
- **Do not attempt to clean old nested directory:** Per D-03, `cpSync` overwrite is sufficient. Stale files are harmless.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin detection | Custom file search | `isPluginInstalled()` | Already implemented, tested, working |
| Installation | Custom copy logic | `installPlugin()` | Handles git clone, cpSync, cleanup |
| Verification | New test file | Manual `node -e` commands | Per D-04, no new tests needed |

**Key insight:** This phase is pure verification. The fix was already applied in Phase 22. The only action needed is reinstalling to overwrite the old broken installed version with the new fixed source.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `~/.claude/skills/windows-git-commit/` -- old broken install with nested structure | Reinstall via installer to fix |
| Live service config | `~/.claude-plugin/marketplace.json` -- plugin registry (source in git) | No change needed |
| OS-registered state | None -- no OS-level registrations for plugins | None |
| Secrets/env vars | None -- no secrets related to plugin detection | None |
| Build artifacts | None -- pure JavaScript, no build step | None |

## Common Pitfalls

### Pitfall 1: Verifying source structure instead of installed structure
**What goes wrong:** Checking that `plugins/windows-git-commit/SKILL.md` exists in the repo, but not checking the actual installed location `~/.claude/skills/windows-git-commit/SKILL.md`
**Why it happens:** The source was fixed in Phase 22, but the installed version is still the old broken one until reinstalled
**How to avoid:** Always verify at the installed path, not the source path
**Warning signs:** `isPluginInstalled('windows-git-commit')` returns false even though source looks correct

### Pitfall 2: Forgetting to verify claude-notify regression
**What goes wrong:** Only checking windows-git-commit detection and skipping claude-notify verification
**Why it happens:** claude-notify was working before and seems unrelated
**How to avoid:** Explicitly run `isPluginInstalled('claude-notify')` as a separate verification step (DETECT-03)
**Warning signs:** If any installer code was accidentally modified, claude-notify could break

### Pitfall 3: Assuming cpSync deletes old files
**What goes wrong:** Expecting old `skills/` subdirectory to disappear after reinstall
**Why it happens:** Intuitive assumption that copy replaces the entire directory
**How to avoid:** Know that `cpSync` merges, not replaces. Old files remain. This is harmless for detection.
**Warning signs:** Seeing old `skills/` directory still present after reinstall -- this is expected

### Pitfall 4: Running tests without network
**What goes wrong:** `installPlugin()` integration test fails due to no git clone access
**Why it happens:** The test actually clones from GitHub
**How to avoid:** Ensure network is available for integration test; unit tests (isPluginInstalled) work offline
**Warning signs:** Test 3 in `plugin-installer.test.js` fails

## Code Examples

### Verify isPluginInstalled directly (DETECT-01)
```javascript
// Quick verification command
node -e "const {isPluginInstalled} = require('./installer/src/marketplace/plugin-installer.js'); console.log('windows-git-commit:', isPluginInstalled('windows-git-commit'));"
// Expected: true (after reinstall)
```

### Verify claude-notify still detected (DETECT-03)
```javascript
node -e "const {isPluginInstalled} = require('./installer/src/marketplace/plugin-installer.js'); console.log('claude-notify:', isPluginInstalled('claude-notify'));"
// Expected: true (unchanged)
```

### Check SKILL.md at installed path
```javascript
node -e "const fs = require('fs'); const path = require('path'); const os = require('os'); const p = path.join(os.homedir(), '.claude', 'skills', 'windows-git-commit', 'SKILL.md'); console.log('SKILL.md at root:', fs.existsSync(p));"
// Expected: true (after reinstall)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nested plugin structure (skills/ subdir) | Flat plugin structure (SKILL.md at root) | Phase 22 (2026-03-29) | Source now matches installer expectations |

**Deprecated/outdated:**
- `plugins/windows-git-commit/skills/` subdirectory: Removed in Phase 22 via `git mv`

## Open Questions

1. **Stale nested directory cleanup**
   - What we know: `cpSync` will not delete old `skills/` subdirectory in installed location
   - What's unclear: Whether this causes any functional issues (it should not)
   - Recommendation: Ignore -- harmless, and D-03 explicitly says no cleanup needed

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Installer runtime | Yes | v22.14.0 | -- |
| npm/npx | Running installer | Yes | 10.9.2 | -- |
| Git | installPlugin clone | Yes | 2.45.1 | -- |
| Network (GitHub) | installPlugin clone | Yes | -- | -- |
| `~/.claude/skills/` | Plugin install target | Yes | Exists | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** N/A

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (custom) |
| Config file | none |
| Quick run command | `node installer/tests/marketplace/plugin-installer.test.js` |
| Full suite command | `node installer/tests/run-all.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETECT-01 | isPluginInstalled('windows-git-commit') returns true after install | manual-only (D-04) | `node -e "const {isPluginInstalled} = require('./installer/src/marketplace/plugin-installer.js'); console.log(isPluginInstalled('windows-git-commit'));"` | N/A |
| DETECT-02 | [installed] marker shown in marketplace table | manual-only (D-04) | Visual check via running installer | N/A |
| DETECT-03 | isPluginInstalled('claude-notify') still returns true | manual-only (D-04) | `node -e "const {isPluginInstalled} = require('./installer/src/marketplace/plugin-installer.js'); console.log(isPluginInstalled('claude-notify'));"` | N/A |

### Sampling Rate
- **Per verification step:** Manual observation and documentation
- **Phase gate:** All three DETECT criteria confirmed before closing

### Wave 0 Gaps
None -- existing test infrastructure covers `isPluginInstalled()` basic logic. Per D-04, no new tests are added.

## Sources

### Primary (HIGH confidence)
- `installer/src/marketplace/plugin-installer.js` -- Source code of isPluginInstalled(), installPlugin(), installPlugins()
- `installer/src/marketplace/index.js` -- Source code of displayPluginTable(), runMarketplaceIntegration()
- `.planning/phases/22-plugin-structure-fix/22-VERIFICATION.md` -- Phase 22 verification confirming source structure fix
- `.planning/phases/22-plugin-structure-fix/22-01-SUMMARY.md` -- Phase 22 execution summary

### Secondary (MEDIUM confidence)
- `installer/tests/marketplace/plugin-installer.test.js` -- Existing tests confirming detection logic works
- `plugins/windows-git-commit/SKILL.md` -- Plugin structure after Phase 22 fix (SKILL.md at root)
- `plugins/claude-notify/SKILL.md` -- Reference plugin structure (working pattern)

## Metadata

**Confidence breakdown:**
- Detection logic: HIGH -- read source code, verified with live `node -e` test
- Installation flow: HIGH -- read source code, existing tests pass
- Regression risk: HIGH -- no code changes, claude-notify already working
- cpSync behavior: HIGH -- verified by examining current installed state

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable, no external dependencies expected to change)
