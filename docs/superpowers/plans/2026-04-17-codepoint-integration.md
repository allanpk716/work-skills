# Codepoint Skill Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the codepoint skill from `~/.claude/skills/codepoint/` into `plugins/codepoint/` as a standard plugin with plugin.json.

**Architecture:** Copy existing skill files into the plugins directory structure used by claude-notify and windows-git-commit. Add `.claude-plugin/plugin.json` for plugin metadata. No installer changes needed — auto-discovery handles it.

**Tech Stack:** File operations only, no code changes.

---

## File Structure

| Action | Path | Purpose |
|--------|------|---------|
| Create | `plugins/codepoint/.claude-plugin/plugin.json` | Plugin metadata |
| Copy | `plugins/codepoint/SKILL.md` | Main skill documentation |
| Copy | `plugins/codepoint/references/golang.md` | Go implementation guide |
| Copy | `plugins/codepoint/references/python.md` | Python implementation guide |
| Copy | `plugins/codepoint/references/frontend.md` | Frontend implementation guide |

---

### Task 1: Create Plugin Directory Structure and Metadata

**Files:**
- Create: `plugins/codepoint/.claude-plugin/plugin.json`

- [ ] **Step 1: Create directories**

```bash
mkdir -p plugins/codepoint/.claude-plugin
mkdir -p plugins/codepoint/references
```

- [ ] **Step 2: Write plugin.json**

Create `plugins/codepoint/.claude-plugin/plugin.json`:

```json
{
  "name": "codepoint",
  "description": "Runtime probe-driven development skill for placing code points at critical execution paths to give AI runtime visibility into code",
  "author": {
    "name": "allanpk716",
    "email": "allanpk716@gmail.com"
  }
}
```

- [ ] **Step 3: Verify structure**

Run: `ls -la plugins/codepoint/.claude-plugin/plugin.json`
Expected: file exists with correct content

- [ ] **Step 4: Commit**

```bash
git add plugins/codepoint/.claude-plugin/plugin.json
git commit -m "feat(codepoint): add plugin metadata for codepoint skill"
```

---

### Task 2: Copy Skill Files

**Files:**
- Copy: `~/.claude/skills/codepoint/SKILL.md` → `plugins/codepoint/SKILL.md`
- Copy: `~/.claude/skills/codepoint/references/golang.md` → `plugins/codepoint/references/golang.md`
- Copy: `~/.claude/skills/codepoint/references/python.md` → `plugins/codepoint/references/python.md`
- Copy: `~/.claude/skills/codepoint/references/frontend.md` → `plugins/codepoint/references/frontend.md`

- [ ] **Step 1: Copy SKILL.md**

```bash
cp ~/.claude/skills/codepoint/SKILL.md plugins/codepoint/SKILL.md
```

- [ ] **Step 2: Copy all reference files**

```bash
cp ~/.claude/skills/codepoint/references/golang.md plugins/codepoint/references/golang.md
cp ~/.claude/skills/codepoint/references/python.md plugins/codepoint/references/python.md
cp ~/.claude/skills/codepoint/references/frontend.md plugins/codepoint/references/frontend.md
```

- [ ] **Step 3: Verify all files copied correctly**

Run: `find plugins/codepoint -type f | sort`
Expected:
```
plugins/codepoint/.claude-plugin/plugin.json
plugins/codepoint/SKILL.md
plugins/codepoint/references/frontend.md
plugins/codepoint/references/golang.md
plugins/codepoint/references/python.md
```

- [ ] **Step 4: Commit**

```bash
git add plugins/codepoint/
git commit -m "feat(codepoint): add codepoint skill with language references"
```

---

### Task 3: Verify Installer Discovery

**Files:** None modified, verification only.

- [ ] **Step 1: Verify plugin structure matches existing plugins**

Run: `ls plugins/*/.claude-plugin/plugin.json`
Expected: all three plugins listed (claude-notify, codepoint, windows-git-commit)

- [ ] **Step 2: Verify SKILL.md frontmatter has correct name**

Run: `head -3 plugins/codepoint/SKILL.md`
Expected: frontmatter with `name: codepoint`

- [ ] **Step 3: Verify reference file paths are valid**

Run: `grep -c "references/" plugins/codepoint/SKILL.md`
Expected: > 0 (confirm path references exist in SKILL.md)
