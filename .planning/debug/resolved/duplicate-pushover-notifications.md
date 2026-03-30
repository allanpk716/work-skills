---
status: awaiting_human_verify
trigger: "Pushover notifications are being sent twice. User suspects global hook and project-level hook both sending notifications."
created: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED - Stale hooks/hooks.json in ~/.claude/skills/claude-notify/ causes marketplace to load duplicate hooks alongside global settings.json hooks
test: Deleted hooks directory from skills location and updated installer to prevent recurrence
expecting: Only one notification per event after fix
next_action: Awaiting human verification

## Symptoms

expected: Pushover notification should only be sent once when Claude task completes or waits for input
actual: Pushover notifications are being sent twice (duplicate)
errors: No errors, just duplicate notifications
reproduction: Wait for any Claude Code task to complete or prompt for input - two Pushover notifications arrive
started: Started after migration from marketplace hooks to global hooks registration (commit 14590be)

## Eliminated

- hypothesis: Marketplace plugin cache (in ~/.claude/plugins/cache/) has stale hooks.json
  evidence: The cache at plugins/cache/work-skills/claude-notify/1.0.2/ does NOT have a hooks/ directory or hooks.json.
  timestamp: 2026-03-29T00:00:30Z

## Evidence

- timestamp: 2026-03-29T00:00:15Z
  checked: Global settings.json hooks configuration
  found: Two notify hooks registered globally: (1) Stop hook -> python notify-stop.py, (2) Notification hook -> python notify-attention.py. These are in ~/.claude/settings.json.
  implication: Global hooks are properly configured and working.

- timestamp: 2026-03-29T00:00:20Z
  checked: Project-level settings (.claude/settings.json and .claude/settings.local.json)
  found: Neither exists. Project .claude/ only has a commands/ directory.
  implication: No project-level hooks causing duplication.

- timestamp: 2026-03-29T00:00:30Z
  checked: Marketplace plugin cache at ~/.claude/plugins/cache/work-skills/claude-notify/1.0.2/
  found: No hooks/ directory or hooks.json present. Clean.
  implication: Marketplace cache was properly cleaned by installer.

- timestamp: 2026-03-29T00:00:45Z
  checked: Skills directory at ~/.claude/skills/claude-notify/
  found: STALE hooks/hooks.json file still present. Contains Stop and Notification hook definitions using ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/notify.py and notify-attention.py.
  implication: ROOT CAUSE. Claude Code loads hooks from both global settings.json AND marketplace skill hooks.json, producing duplicates.

- timestamp: 2026-03-29T00:00:50Z
  checked: Stale files in ~/.claude/skills/claude-notify/hooks/scripts/
  found: Contains old notify.py, notify-wait.py, notify.py.backup alongside notify-attention.py.
  implication: The entire hooks/ directory was stale and should be removed.

- timestamp: 2026-03-29T00:01:00Z
  checked: Applied fix
  found: Removed hooks/ directory from ~/.claude/skills/claude-notify/ and removed stale .no-pushover file
  implication: Marketplace skill no longer has hooks.json, so only global hooks will trigger

- timestamp: 2026-03-29T00:01:30Z
  checked: Updated installer cleanMarketplaceCache() function
  found: Extended to clean hooks/ from both plugin cache AND skills directory, preventing recurrence
  implication: Future npx installs will automatically clean up stale marketplace hooks

## Resolution

root_cause: Stale hooks/hooks.json in ~/.claude/skills/claude-notify/ was not removed during the v2.0.0 migration from marketplace hooks to global hooks. Claude Code loads hooks from BOTH the global settings.json AND the marketplace skill's hooks.json, causing each notification to fire twice.
fix: (1) Removed stale hooks/ directory from ~/.claude/skills/claude-notify/. (2) Removed stale .no-pushover file. (3) Updated hooks-installer.js cleanMarketplaceCache() to also clean skills directory hooks on future installs.
verification: Deleted stale hooks directory confirmed. Global hooks in settings.json remain intact.
files_changed: [installer/src/hooks/hooks-installer.js]
