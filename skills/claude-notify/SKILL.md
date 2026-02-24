---
name: claude-notify
description: Sends Pushover push notifications and Windows Toast notifications when Claude Code tasks complete. Configure with PUSHOVER_TOKEN and PUSHOVER_USER environment variables.
version: 1.0.0
---

# Claude Notify Skill

Automated notification system that triggers when Claude Code completes tasks. Receive instant mobile push notifications via Pushover and desktop toast notifications on Windows.

## Features

- **Pushover Integration**: Send push notifications to your mobile devices
- **Windows Toast Notifications**: Desktop notifications on Windows systems
- **AI-Powered Summaries**: Automatically generates concise task summaries using Claude CLI
- **Parallel Execution**: Sends notifications simultaneously for maximum speed
- **Graceful Degradation**: Works even when Pushover credentials are not configured
- **Timeout Protection**: Completes within 5 seconds to avoid blocking Claude Code

## How It Works

This skill is **hook-triggered** - it runs automatically when Claude Code stops after completing a task. No manual invocation needed.

1. Claude Code triggers the `Stop` hook when a task completes
2. The notification script runs in the background (async mode)
3. Script generates a task summary using Claude CLI
4. Pushover and Windows Toast notifications are sent in parallel
5. You receive instant notification on your devices

## Installation

### Step 1: Install the Plugin

Install from the marketplace:

```
/plugin install <marketplace-url>
```

Replace `<marketplace-url>` with the GitHub repository URL containing this marketplace.

### Step 2: Configure Environment Variables

Set up Pushover credentials (required for mobile notifications):

**Windows (Command Prompt):**
```cmd
setx PUSHOVER_TOKEN "your-pushover-app-token"
setx PUSHOVER_USER "your-pushover-user-key"
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("PUSHOVER_TOKEN", "your-pushover-app-token", "User")
[Environment]::SetEnvironmentVariable("PUSHOVER_USER", "your-pushover-user-key", "User")
```

**Getting Pushover Credentials:**
1. Create a Pushover account at https://pushover.net
2. Create a new application in your Pushover Dashboard
3. Copy the **API Token** (this is `PUSHOVER_TOKEN`)
4. Copy your **User Key** from the dashboard (this is `PUSHOVER_USER`)

**Note:** Windows Toast notifications work without any configuration.

### Step 3: Verify Installation

Run the verification script to check your setup:

```bash
python scripts/verify-installation.py
```

This will check:
- Python version compatibility
- Required Python libraries
- Environment variable configuration
- Pushover API connectivity
- Windows Toast notification functionality

### Step 4: Test

The hook is automatically active after installation. Complete any task in Claude Code and you should receive notifications.

## Usage

No manual action required - notifications are sent automatically when Claude Code tasks complete.

**Example notification:**
```
Title: work-skills
Message: Completed implementing user authentication with JWT tokens
```

## Troubleshooting

### No notifications are sent

**Possible causes:**
1. Environment variables not set correctly
2. Pushover API credentials invalid
3. Hook not installed properly

**Solutions:**
- Verify environment variables: `echo %PUSHOVER_TOKEN%` (Windows)
- Run verification script: `python scripts/verify-installation.py`
- Check Claude Code debug logs: `claude --debug`

### Windows Toast notifications not appearing

**Possible causes:**
1. Windows notification settings disabled
2. PowerShell execution policy blocking scripts

**Solutions:**
- Enable notifications in Windows Settings → System → Notifications
- Run: `powershell -Command "Get-ExecutionPolicy"` (should not be `Restricted`)
- If restricted, run: `powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser"`

### Pushover notifications not sent

**Possible causes:**
1. Environment variables missing or incorrect
2. Pushover API quota exceeded
3. Network connectivity issues

**Solutions:**
- Verify credentials in Pushover Dashboard
- Check Pushover API status at https://pushover.net/support#status
- Run verification script with test notification option

### Notifications are slow

**Expected behavior:** Notifications should complete within 5 seconds.

**If slower:**
1. Network latency to Pushover API
2. Claude CLI taking longer than 2 seconds to generate summary

**Optimizations applied:**
- Parallel notification sending
- Strict timeout controls (2s Claude, 2s Pushover, 1s Windows, 4s total)
- Fallback to fixed message if Claude CLI timeout

## Technical Details

### Timeout Strategy

- **Claude CLI Summary**: 2 seconds
- **Pushover API**: 2 seconds
- **Windows Toast**: 1 second
- **Overall**: 4 seconds (within Claude Code's 5-second hook limit)

### Parallel Execution

Notifications are sent using `ThreadPoolExecutor` with 2 workers:
- Worker 1: Pushover API call
- Worker 2: Windows Toast via PowerShell

This ensures maximum speed and redundancy.

### Logging

Logs are stored in your user directory:
- Windows: `%APPDATA%\claude-notify\logs\`

Log files include:
- Timestamp of execution
- Project name
- Summary generation status
- Notification success/failure

### Fallback Behavior

- If Claude CLI fails or times out → Fixed message template used
- If Pushover credentials missing → Only Windows Toast sent
- If Windows Toast fails → Only Pushover sent (if configured)
- If both fail → Error logged, no blocking of Claude Code

## Requirements

- **Python**: 3.8 or higher
- **Operating System**: Windows (for Toast notifications)
- **Pushover Account**: Optional (required only for mobile notifications)
- **Claude CLI**: Optional (for AI-powered summaries)

## Support

For issues and feature requests, please check the project repository or documentation.

## License

This plugin is provided as-is for Claude Code users. See repository for license details.
