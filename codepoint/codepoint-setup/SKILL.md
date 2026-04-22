---
name: codepoint-setup
description: >
  Guide users through codepoint environment configuration: .codepoints/ directory
  initialization, language toggle setup, index.json bootstrapping, and verification.
  Triggers on: "codepoint setup", "codepoint-setup", "configure codepoint",
  "setup code point", "codepoint init", "initialize codepoint", "代码点配置",
  "初始化代码点".
---

# Codepoint Setup — Configuration Guide

<objective>
Walk the user through setting up the codepoint observability environment end-to-end:
project storage directory initialization, language toggle file creation, index.json
bootstrapping from the canonical template, and diagnostic verification. At the end
the user should have a ready-to-use .codepoints/ structure and the correct language
toggle enabled for their project.
</objective>

## Prerequisites

Before starting, confirm:

- You are in the **project root directory** (where `.codepoints/` will live)
- The **codepoint** skill is available (run `/codepoint` to verify)
- You know the project's **primary language** (go, typescript, or python)

## Step 1: Initialize .codepoints/ Directory

The `.codepoints/` directory holds all codepoint data: collections, flows, points,
test plans, instrumentation plans, and verification reports.

Create the full storage structure:

```bash
mkdir -p .codepoints/collections
mkdir -p .codepoints/flows
mkdir -p .codepoints/points
mkdir -p .codepoints/test-plans
mkdir -p .codepoints/instrumentation
mkdir -p .codepoints/verification
```

### Add .codepoints/ to .gitignore (Optional)

If the project uses git and codepoint data should not be tracked:

```bash
echo ".codepoints/" >> .gitignore
```

> **Note:** Committing `.codepoints/` is fine for teams that share probe definitions.
> The `index.json` and markdown files are designed to be version-controlled.

## Step 2: Create Language Toggle

Codepoint uses file-based toggles to detect which language the probes should emit.
Create the toggle file matching your project's primary language:

| Language | Command |
|----------|---------|
| Go | `touch ~/.codepoint/.codepoint-go` |
| TypeScript / JavaScript | `touch ~/.codepoint/.codepoint-ts` |
| Python | `touch ~/.codepoint/.codepoint-python` |

Ensure the `~/.codepoint/` parent directory exists:

```bash
mkdir -p ~/.codepoint
```

Then create the toggle:

**Go:**
```bash
touch ~/.codepoint/.codepoint-go
```

**TypeScript/JavaScript:**
```bash
touch ~/.codepoint/.codepoint-ts
```

**Python:**
```bash
touch ~/.codepoint/.codepoint-python
```

> Only one toggle should be active at a time. If switching languages, remove the old
> toggle first: `rm ~/.codepoint/.codepoint-go` (or `-ts`, `-python`).

## Step 3: Bootstrap index.json

Copy the canonical template into `.codepoints/index.json` and customize it for your project:

```bash
cp codepoint/templates/index.json .codepoints/index.json
```

Then edit `.codepoints/index.json` and update the top-level fields:

| Field | What to Set |
|-------|-------------|
| `project` | Your project identifier (e.g. `"my-api"`, `"web-frontend"`) |
| `language` | Primary language: `"go"`, `"python"`, or `"typescript"` |
| `created` | Today's date in ISO format |
| `updated` | Same as `created` for initial setup |

Remove the example collections, flows, and points — they are placeholders:

```json
{
  "version": "2.0",
  "project": "your-project-name",
  "language": "go",
  "created": "2026-04-20",
  "updated": "2026-04-20",
  "collections": [],
  "flows": [],
  "points": []
}
```

> The schema is defined in `codepoint/references/data-model.md`. Downstream skills
> (`/codepoint-scan`, `/codepoint-plan`, `/codepoint-implement`) read and write this file.

## Step 4: Verify Setup

### Check Directory Structure

```bash
ls -la .codepoints/ && echo "--- Collections:" && ls .codepoints/collections/ && echo "--- index.json:" && test -f .codepoints/index.json && echo "OK" || echo "MISSING"
```

Expected output: all six subdirectories listed and `index.json` present.

### Check Language Toggle

```bash
ls ~/.codepoint/.codepoint-* 2>/dev/null && echo "Toggle found" || echo "No toggle set"
```

### Validate index.json Schema

```bash
python -c "import json; d=json.load(open('.codepoints/index.json')); assert d.get('version')=='2.0'; assert d.get('project'); assert d.get('language') in ('go','python','typescript'); assert isinstance(d.get('collections',[]),list); assert isinstance(d.get('flows',[]),list); assert isinstance(d.get('points',[]),list); print('index.json: VALID (project=%s, language=%s)' % (d['project'],d['language']))"
```

Expected output: `index.json: VALID (project=your-project-name, language=go)`

## Quick Start After Setup

Once setup is complete, you are ready to use the full codepoint workflow:

| Goal | Command |
|------|---------|
| Scan existing codebase | `/codepoint-scan` |
| Plan code points for a new feature | `/codepoint-plan` |
| Run full pipeline automatically | `/codepoint-run` |

See the main [SKILL.md](../SKILL.md) for the complete commands table.

<process>
1. Ask the user which project they want to configure and what language it uses
2. Verify you are in the project root directory — if not, ask the user to navigate there
3. Check if .codepoints/ already exists — if so, confirm whether to reinitialize or skip
4. Execute Step 1 to create the directory structure
5. Execute Step 2 to create the language toggle matching the user's language
6. Execute Step 3 to bootstrap index.json with the correct project name and language
7. Run the verification checks from Step 4
8. If any check fails, provide specific guidance to resolve the issue
9. Point the user to the Quick Start table for next steps
10. Optionally run the Post-Installation Skill Integrity Check section to verify the skill installation is complete
</process>

<rules>
- Always check for an existing .codepoints/ directory before creating one — never overwrite without confirmation
- Only one language toggle should be active at a time — remove old toggles before creating a new one
- The index.json must start with empty arrays for collections, flows, and points — populated by scan/plan skills
- If the user's project uses multiple languages, set the toggle for the primary/backend language and note that cross-language probes can reference a different language per point
- The .codepoints/ directory is project-local; the toggle file is user-global (~/.codepoint/)
</rules>

## Post-Installation Skill Integrity Check

Run this section after installing or updating the codepoint skill to verify all
required files are present. These checks verify the **skill installation**, not the
`.codepoints/` working directory (that is covered by Step 4 above).

All commands use PowerShell. Run them from the **skill root directory** (the folder
containing `codepoint/SKILL.md`).

### 1. Main Skill & Sub-skill SKILL.md Files

Check that all 10 SKILL.md files exist:

```powershell
$skillRoot = "codepoint"
$skills = @(
  "$skillRoot/SKILL.md",
  "$skillRoot/codepoint-implement/SKILL.md",
  "$skillRoot/codepoint-instrument/SKILL.md",
  "$skillRoot/codepoint-plan/SKILL.md",
  "$skillRoot/codepoint-run/SKILL.md",
  "$skillRoot/codepoint-scan/SKILL.md",
  "$skillRoot/codepoint-setup/SKILL.md",
  "$skillRoot/codepoint-test-plan/SKILL.md",
  "$skillRoot/codepoint-validate/SKILL.md",
  "$skillRoot/codepoint-verify/SKILL.md"
)
$missing = @()
foreach ($s in $skills) {
  if (-not (Test-Path $s)) { $missing += $s }
}
if ($missing.Count -eq 0) {
  Write-Host "SKILL.md files: $($skills.Count)/$($skills.Count) OK"
} else {
  Write-Host "SKILL.md files: $($skills.Count - $missing.Count)/$($skills.Count) OK - MISSING:"
  $missing | ForEach-Object { Write-Host "  $_" }
  Write-Host "Re-run: npx skills add allanpk716/work-skills/codepoint --all"
}
```

### 2. templates/ Directory

Check that all 5 template files exist:

```powershell
$tplDir = "codepoint/templates"
$templates = @("collection.md", "flow.md", "index.json", "point.md", "verification.md")
$missing = @()
foreach ($t in $templates) {
  if (-not (Test-Path "$tplDir/$t")) { $missing += $t }
}
if ($missing.Count -eq 0) {
  Write-Host "templates/: $($templates.Count)/$($templates.Count) OK"
} else {
  Write-Host "templates/: $($templates.Count - $missing.Count)/$($templates.Count) OK - MISSING: $($missing -join ', ')"
}
```

### 3. references/ Directory

Check that all 5 reference files exist:

```powershell
$refDir = "codepoint/references"
$references = @("data-model.md", "frontend.md", "golang.md", "python.md", "test-probes.md")
$missing = @()
foreach ($r in $references) {
  if (-not (Test-Path "$refDir/$r")) { $missing += $r }
}
if ($missing.Count -eq 0) {
  Write-Host "references/: $($references.Count)/$($references.Count) OK"
} else {
  Write-Host "references/: $($references.Count - $missing.Count)/$($references.Count) OK - MISSING: $($missing -join ', ')"
}
```

### Summary

If all three groups report full counts, the codepoint skill installation is complete.
If any files are missing, re-install with:

```powershell
npx skills add allanpk716/work-skills/codepoint --all
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `.codepoints/` already exists | Confirm with user whether to reinitialize or keep existing data |
| No toggle detected by probes | Run `ls ~/.codepoint/.codepoint-*` to check which toggle exists; create the correct one |
| `index.json` parse error | Validate JSON syntax; re-copy from `templates/index.json` and re-edit |
| Wrong language in `index.json` | Update the `language` field to match the toggle (`go`, `python`, `typescript`) |
| Permission denied creating `~/.codepoint/` | Check home directory permissions; create manually with `mkdir -p ~/.codepoint` |
