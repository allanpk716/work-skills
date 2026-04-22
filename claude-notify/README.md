# claude-notify

Automatic push notifications for Claude Code — get alerted on your phone and desktop when tasks finish or need your input.

## Features

- **Pushover integration** — instant mobile push notifications via Pushover API
- **Windows Toast notifications** — desktop notifications on Windows, zero config required
- **AI-powered summaries** — uses Claude CLI to generate concise task summaries
- **Parallel delivery** — Pushover and Toast fire simultaneously for fastest notification
- **Graceful degradation** — works without Pushover credentials (Toast-only mode)
- **Timeout-protected** — completes within 5 seconds, never blocks Claude Code

## Prerequisites

- **Python** 3.8+
- **Python package**: `requests` (for Pushover API)
- **OS**: Windows (for Toast notifications)
- **Pushover account** (optional — only needed for mobile notifications)
- **Claude CLI** (optional — enables AI-driven summaries)

Install Python dependency:

```bash
python -m pip install requests
```

## Install

```bash
npx skills add allanpk716/work-skills/claude-notify
```

This command will:

- Register global notification hooks in `~/.claude/settings.json`
- Copy notification scripts to `~/.claude/hooks/`
- Install the claude-notify skill via the skills standard

## Configure

### Pushover (mobile notifications)

Set environment variables for Pushover credentials:

```cmd
setx PUSHOVER_TOKEN "your-pushover-app-token"
setx PUSHOVER_USER "your-pushover-user-key"
```

**Getting Pushover credentials:**

1. Create an account at <https://pushover.net>
2. Create a new application in the Pushover dashboard
3. Copy the **API Token** (`PUSHOVER_TOKEN`) and your **User Key** (`PUSHOVER_USER`)

> Restart your terminal after setting environment variables.

Windows Toast notifications work out of the box — no configuration needed.

For detailed configuration, project-level toggles, and example scenarios, see [references/setup.md](references/setup.md).

## Verify Installation

Run the environment check command:

```bash
/check-notify-env
```

It automatically checks Python version, required libraries, environment variables, and hook configuration, and provides fix steps for any failures.

## Usage

Notifications fire **automatically** when Claude Code finishes a task. No manual action needed.

**Notification format:**

- **Title**: current project name
- **Body**: AI-generated task summary
- **Priority**: normal (Pushover priority 0)

## Slash Commands

| Command | Description |
|---------|-------------|
| `/check-notify-env` | Check runtime environment and configuration |
| `/notify-enable <pushover\|windows>` | Enable a notification channel |
| `/notify-disable <pushover\|windows>` | Disable a notification channel |
| `/notify-status` | Show current status of all channels |

For full command details and project-level toggles, see [references/commands.md](references/commands.md).

## Reference Docs

| Document | Description |
|----------|-------------|
| [Setup Guide](references/setup.md) | Pushover configuration, env vars, project-level toggles |
| [FAQ](references/faq.md) | Common issues and troubleshooting |
| [Technical Reference](references/technical.md) | Timeout strategy, parallel architecture, error codes |
| [Changelog](references/changelog.md) | Version history |
| [Commands](references/commands.md) | Slash command details and output examples |
