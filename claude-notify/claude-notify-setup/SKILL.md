---
name: claude-notify-setup
description: >
  Guide users through claude-notify environment configuration: Pushover API credentials,
  global hook registration in ~/.claude/settings.json, and verification.
  Triggers on: "claude-notify setup", "notify setup", "configure notifications",
  "setup pushover", "notification config".
---

# Claude Notify Setup — Configuration Guide

<objective>
Walk the user through setting up the claude-notify notification system end-to-end:
Pushover API credentials, global hook registration, and diagnostic verification.
At the end the user should have working Stop and Notification hooks in ~/.claude/settings.json
and receive push notifications when Claude Code completes a task.
</objective>

## Prerequisites

Before starting, confirm:

- **Python 3.8+** is installed and on PATH
- **`requests` library** is available (`pip install requests` if missing)
- **Claude Code** is installed and `~/.claude/` directory exists

## Step 1: Pushover Account & API Credentials

Pushover is required for mobile push notifications. Windows Toast notifications work without it.

1. **Create a Pushover account** at https://pushover.net (if you don't have one)
2. **Create an application** at https://pushover.net/apps/build:
   - Name: `Claude Code Notify` (or any name you prefer)
   - Type: Application
3. **Copy the credentials**:
   - **API Token/Key** → this is your `PUSHOVER_TOKEN`
   - **User Key** (top-right of dashboard) → this is your `PUSHOVER_USER`

### Set Environment Variables

Set these as **permanent user-level** environment variables:

**Windows (Command Prompt):**
```cmd
setx PUSHOVER_TOKEN "your-api-token-here"
setx PUSHOVER_USER "your-user-key-here"
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("PUSHOVER_TOKEN", "your-api-token-here", "User")
[Environment]::SetEnvironmentVariable("PUSHOVER_USER", "your-user-key-here", "User")
```

**macOS / Linux (add to ~/.bashrc or ~/.zshrc):**
```bash
export PUSHOVER_TOKEN="your-api-token-here"
export PUSHOVER_USER="your-user-key-here"
```

> **Important:** After setting environment variables, **restart your terminal** for them to take effect.

For detailed Pushover setup instructions, see → [references/setup.md](references/setup.md)

## Step 2: Install Hook Scripts & Register Hooks

The recommended way is to run the npx installer, which handles everything automatically:

```bash
npx github:allanpk716/work-skills#main
```

This will:
1. Copy `notify-stop.py` and `notify-attention.py` to `~/.claude/hooks/`
2. Register hooks in `~/.claude/settings.json`
3. Deploy the auto-repair guard script

### Manual Hook Registration (Advanced)

If you need to register hooks manually, edit `~/.claude/settings.json`.

**Important:** Merge into the existing file — do NOT overwrite it. Only add or update the `hooks` section.

The required structure is:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python \"C:/Users/<YOU>/.claude/hooks/notify-stop.py\"",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "permission_prompt|idle_prompt|elicitation_dialog",
        "hooks": [
          {
            "type": "command",
            "command": "python \"C:/Users/<YOU>/.claude/hooks/notify-attention.py\"",
            "async": true,
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

> Replace `<YOU>` with your actual Windows username. Use forward slashes in the path.

Key points when merging:
- **Preserve** all existing hooks and settings — only add/update the `Stop` and `Notification` entries
- If `Stop` or `Notification` already exist, check if `notify-stop.py` or `notify-attention.py` entries are present before adding duplicates
- The `SessionStart` guard entry is optional but recommended for auto-repair

## Step 3: Verify Installation

### Quick Diagnostic — Use the Slash Command

```bash
/check-notify-env
```

This checks Python, dependencies, environment variables, and hook registration automatically.

### Manual Verification

Verify hooks are registered:

```bash
python -c "import json; s=json.load(open(__import__('os').path.expanduser('~/.claude/settings.json'))); hooks=s.get('hooks',{}); print('Stop hook:', 'notify-stop.py' in str(hooks.get('Stop',[]))); print('Notification hook:', 'notify-attention.py' in str(hooks.get('Notification',[])))"
```

Verify script files exist:

```bash
python -c "import os; h=os.path.expanduser('~/.claude/hooks'); print('notify-stop.py:', os.path.isfile(os.path.join(h,'notify-stop.py'))); print('notify-attention.py:', os.path.isfile(os.path.join(h,'notify-attention.py')))"
```

Verify environment variables are set (run in a **new** terminal):

```bash
python -c "import os; print('PUSHOVER_TOKEN:', 'SET' if os.environ.get('PUSHOVER_TOKEN') else 'MISSING'); print('PUSHOVER_USER:', 'SET' if os.environ.get('PUSHOVER_USER') else 'MISSING')"
```

### Full Diagnostic with API Connectivity Test

```bash
python skills/claude-notify/hooks/scripts/notify.py --diagnose
```

<process>
1. Ask the user whether they already have Pushover credentials or need to create them
2. If they need credentials, guide them through Step 1 (account creation, app creation, environment variables)
3. Check if environment variables are already set — if not, provide the setx/export commands
4. Ask whether they want automatic installation (npx) or manual hook registration
5. For automatic: run `npx github:allanpk716/work-skills#main` and report the result
6. For manual: open `~/.claude/settings.json`, show the required JSON structure, and merge carefully
7. Run verification checks from Step 3 to confirm everything is working
8. If any check fails, provide specific troubleshooting guidance
9. Confirm to the user that setup is complete and notifications will fire on next task completion
</process>

<rules>
- Always read the existing `~/.claude/settings.json` before making changes — never overwrite blindly
- If the user already has hooks registered, verify they point to the correct script paths
- Pushover is optional — if the user only wants Windows Toast notifications, skip Step 1 but still register hooks
- After environment variable changes, remind the user to restart their terminal
- If `~/.claude/settings.json` doesn't exist, create it with the minimal required structure
</rules>

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Environment variables not found | Restart terminal after `setx`, or use current session with `set` |
| Hooks not firing | Check `~/.claude/settings.json` has correct paths with forward slashes |
| No Pushover notification | Verify `PUSHOVER_TOKEN` and `PUSHOVER_USER` are set in the terminal session |
| Python not found | Install Python 3.8+ and ensure it's on PATH |
| `requests` module missing | Run `pip install requests` |

For more troubleshooting, see → [references/setup.md](references/setup.md) and [references/faq.md](references/faq.md)
