---
phase: "51"
plan: "01"
---

# T01: Created per-skill README.md files for claude-notify, windows-git-commit, and codepoint with install, config, and usage content

**Created per-skill README.md files for claude-notify, windows-git-commit, and codepoint with install, config, and usage content**

## What Happened

Created three per-skill README.md files by extracting install, prerequisites, configuration, and usage content from each SKILL.md:

1. **claude-notify/README.md** (102 lines, 8 sections) — Covers Pushover + Toast notifications, install via npx, Pushover env var setup, verification with /check-notify-env, slash commands table, and reference doc links.

2. **windows-git-commit/README.md** (107 lines, 8 sections) — Covers plink+PPK authentication, background execution, pre-commit security scanner with whitelist syntax, multiple usage patterns (auto-commit, custom message, specific files, push-only), and reference doc links.

3. **codepoint/README.md** (98 lines, 8 sections) — Covers collection-based data model, toggle mechanism per language, all 8 slash commands, quick-start workflows for existing and new codebases, and reference doc links.

All files are in the target 80-120 line range, have ≥4 sections, contain zero `plugins/` references, and match the SKILL.md language (English).

## Verification

Ran three verification checks:
1. File existence — all 3 README.md files present (PASS)
2. Section count — all 3 files have 8 sections each, ≥4 required (PASS)
3. No plugins/ references — grep found zero matches across all 3 files (PASS)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -c 'for f in claude-notify/README.md windows-git-commit/README.md codepoint/README.md; do test -f "$f" && echo "PASS: $f exists" || echo "FAIL: $f missing"; done'` | 0 | ✅ pass | 1500ms |
| 2 | `bash -c 'for f in ...; do count=$(grep -c "^## " "$f"); echo "$f sections: $count (need >=4)"; done'` | 0 | ✅ pass — all 3 files have 8 sections | 800ms |
| 3 | `grep -rn "plugins/" claude-notify/README.md windows-git-commit/README.md codepoint/README.md` | 1 | ✅ pass — zero plugins/ references (grep exit 1 = no matches) | 600ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `claude-notify/README.md`
- `windows-git-commit/README.md`
- `codepoint/README.md`
