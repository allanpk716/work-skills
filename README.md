# Work Skills

English | [中文](README.zh.md)

Personal skills collection for improving daily work efficiency with Claude Code.

## Prerequisites

- Windows development environment
- Git with SSH (PuTTY/Pageant) configured
- Node.js environment installed (for Claude Code plugin system)

## Installation

### Quick Install (Recommended)

```bash
npx skills add allanpk716/work-skills
```

### Register as Plugin Marketplace

Run the following command in Claude Code:

```
/plugin marketplace add allanpk716/work-skills
```

### Install Skills

**Option 1: Via Browse UI**

1. Select __Browse and install plugins__
2. Select __work-skills__
3. Select the plugin(s) you want to install
4. Select __Install now__

**Option 2: Direct Install**

```
# Install git skills plugin
/plugin install git-skills@work-skills
```

**Option 3: Ask the Agent**

Simply tell Claude Code:

> Please install Skills from github.com/allanpk716/work-skills

## Available Plugins

| Plugin | Description | Skills |
| --- | --- | --- |
| __git-skills__ | Git workflow automation for Windows | windows-git-commit |
| __claude-notify__ | Task completion notifications via Pushover and Windows Toast | claude-notify |

## Update Skills

To update skills to the latest version:

1. Run `/plugin` in Claude Code
2. Switch to __Marketplaces__ tab
3. Select __work-skills__
4. Choose __Update marketplace__

You can also __Enable auto-update__ to get the latest versions automatically.

## Available Skills

### Git Skills

Git workflow automation skills optimized for Windows development with PuTTY/Pageant authentication.

#### windows-git-commit

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

### Claude Notify

Task completion notifications via Pushover and Windows Toast.

#### claude-notify

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

For detailed documentation, see the [skill documentation](skills/claude-notify/SKILL.md).

## Project Structure

```
work-skills/
├── .claude-plugin/
│   └── marketplace.json      # Plugin marketplace configuration
├── skills/
│   └── windows-git-commit/
│       └── SKILL.md          # Skill implementation
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
