# Design: Integrate Codepoint Skill into work-skills Project

**Date**: 2026-04-17

## Goal

Move the codepoint skill from `~/.claude/skills/codepoint/` into the work-skills project's `plugins/` directory as a standard plugin, enabling unified installation via npx and centralized maintenance.

## Background

The codepoint skill is a runtime probe-driven development tool that places "code points" (stack trace probes) at critical execution paths to give AI runtime visibility into code. It currently lives as a standalone skill at `~/.claude/skills/codepoint/` with:
- `SKILL.md` — main skill documentation
- `references/golang.md` — Go implementation guide
- `references/python.md` — Python implementation guide
- `references/frontend.md` — TypeScript/JavaScript implementation guide

## Design

### Directory Structure

```
plugins/codepoint/
├── .claude-plugin/
│   └── plugin.json          # New: plugin metadata
├── SKILL.md                 # Copied from existing skill
└── references/
    ├── golang.md            # Copied as-is
    ├── python.md            # Copied as-is
    └── frontend.md          # Copied as-is
```

### plugin.json

Matches the style of existing plugins (claude-notify, windows-git-commit):

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

### Content Adjustments

- SKILL.md and references/ files are copied as-is
- Relative path references (`references/golang.md` etc.) remain valid in the new location
- No content changes needed

### Installer Integration

No installer code changes required. The installer auto-discovers all subdirectories under `plugins/` that contain `.claude-plugin/plugin.json`. Codepoint will be discovered automatically and offered to users during npx setup.

## Implementation Steps

1. Create `plugins/codepoint/` and `plugins/codepoint/.claude-plugin/` directories
2. Write `plugin.json` with metadata
3. Copy `SKILL.md` from `~/.claude/skills/codepoint/SKILL.md`
4. Copy `references/` directory from `~/.claude/skills/codepoint/references/`
5. Verify installer discovery of the new plugin

## Scope

- In scope: plugin directory creation, file migration, installer verification
- Out of scope: tests (document-based skill, not runnable code), marketplace registration (dev phase), installer changes, version bump
