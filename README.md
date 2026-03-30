# Work Skills

English | [中文](README.zh.md)

Personal skills collection for improving daily work efficiency with Claude Code.

## 🚀 Quick Start

```bash
npx github:allanpk716/work-skills#main
```

Or the shorthand: `npx allanpk716/work-skills`

---

## Prerequisites

- Windows development environment
- Git with SSH (PuTTY/Pageant) configured
- Node.js environment installed (for Claude Code plugin system)

## Installation

Run either command to install (both pull from GitHub):

```bash
# Recommended - explicit GitHub source with branch
npx github:allanpk716/work-skills#main

# Shorthand - same effect
npx allanpk716/work-skills
```

The installer automatically handles environment detection, plugin installation, and Claude Code configuration. **No manual plugin management needed in Claude Code.**

### Manual Install

```bash
git clone https://github.com/allanpk716/work-skills.git
cd work-skills
node installer/src/index.js
```

### Update

Re-run the install command to get the latest version:

```bash
npx github:allanpk716/work-skills#main
```

Or if you cloned manually:

```bash
cd work-skills && git pull origin main && node installer/src/index.js
```

## Available Plugins

| Plugin | Description | Skills |
| --- | --- | --- |
| __windows-git-commit__ | Git workflow automation for Windows (plink + PPK) | windows-git-commit |
| __claude-notify__ | Task completion notifications (Pushover + Windows Toast) | claude-notify |

## Available Skills

### windows-git-commit

Automated Git commit and push for Windows using command-line git with plink + PPK authentication.

**Features:**
- Auto-analyzes code changes
- Generates descriptive commit messages
- Uses command-line git (no GUI dialogs)
- Configures PuTTY/plink SSH authentication automatically
- Runs in subagent to preserve context

**Usage:**

```bash
# Automatic commit and push (recommended)
/windows-git-commit

# With custom commit message
/windows-git-commit Commit message here

# Commit specific files only
/windows-git-commit for changes in src/ and tests/
```

**Prerequisites:**
- Pageant must be running with PPK key loaded
- TortoiseGit or PuTTY must be installed
- First run auto-configures git to use TortoisePlink

**One-time Setup:**

```bash
# Configure git to use TortoisePlink (64-bit system)
git config --global core.sshcommand "\"C:\\Program Files\\TortoiseGit\\bin\\TortoisePlink.exe\""

# Or 32-bit system
git config --global core.sshcommand "\"C:\\Program Files (x86)\\TortoiseGit\\bin\\TortoisePlink.exe\""
```

For detailed troubleshooting, see the skill documentation.

### claude-notify

Automatically sends notifications when Claude Code completes tasks. Receive mobile push notifications via Pushover and desktop toast notifications on Windows.

**Features:**
- Mobile push notifications via Pushover
- Windows Toast desktop notifications
- AI-powered task summaries using Claude CLI
- Parallel execution for instant delivery
- Graceful degradation when Pushover not configured
- Completes within 5 seconds

**Usage:**

No manual invocation needed - notifications are sent automatically when Claude Code tasks complete.

**Prerequisites:**
- Python 3.8 or higher
- Pushover account (optional, for mobile notifications)

**Setup:**

1. **Configure Pushover (optional):**

```cmd
# Windows Command Prompt
setx PUSHOVER_TOKEN "your-pushover-app-token"
setx PUSHOVER_USER "your-pushover-user-key"
```

2. **Verify installation:**

```bash
python scripts/verify-installation.py
```

3. **Test:**

Complete any task in Claude Code. You should receive notifications automatically.

**Without Pushover:**

Windows Toast notifications work without any configuration. Just install the plugin and you're ready to go.

For detailed documentation, see the [skill documentation](plugins/claude-notify/SKILL.md).

## Project Structure

```
work-skills/
├── plugins/
│   ├── windows-git-commit/   # Git workflow automation plugin
│   ├── claude-notify/        # Notification plugin
├── installer/                # NPX installer
├── README.md                 # This file
├── README.zh.md              # Chinese version
└── CHANGELOG.md              # Version history
```

## Contributing

This is a personal skills collection. Feel free to fork and adapt for your own needs!

## License

MIT

## Credits

Structure and organization inspired by [baoyu-skills](https://github.com/JimLiu/baoyu-skills) by Jim Liu.
