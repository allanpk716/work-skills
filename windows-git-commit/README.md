# windows-git-commit

Automated Git commit and push on Windows using command-line git with plink + PPK authentication. Analyzes changes, generates commit messages, runs a pre-commit security scanner, and executes everything in the background to preserve context.

## Features

- **PPK authentication** — auto-detects TortoisePlink and reads keys from Pageant
- **AI-generated commit messages** — analyzes `git diff` to produce semantic commit messages
- **Background execution** — all git operations run in background, keeping conversation context clean
- **Pre-commit security scanning** — blocks commits containing API keys, secrets, private IPs, and more
- **No GUI dialogs** — pure command-line git, no TortoiseGitProc popups
- **Automatic environment detection** — finds TortoisePlink across multiple install paths

## Prerequisites

- **Pageant** running with a PPK key loaded
- **TortoiseGit** installed (provides TortoisePlink.exe)
- **Git** available on PATH
- First run auto-configures `core.sshcommand` to use TortoisePlink

> See [references/setup.md](references/setup.md) for one-click setup and [references/troubleshooting.md](references/troubleshooting.md) for common issues.

## Install

```bash
npx skills add allanpk716/work-skills/windows-git-commit
```

## Security Scanner

Every commit is automatically scanned for:

- Sensitive information (AWS keys, API tokens, SSH keys)
- Cache and build artifacts (node_modules, \_\_pycache\_\_)
- Config files (.env, credentials.json)
- Internal information (private IPs, internal domains, emails)

**Whitelist comments:**

```python
server_ip = "10.0.0.1"  # gitcheck:ignore-line
# gitcheck:ignore-file
# gitcheck:ignore-rule:INTL-01
```

See [references/security-scanner.md](references/security-scanner.md) for full scanner docs.

## Usage

**Automatic commit and push (recommended):**

```
Use windows-git-commit to commit and push my changes
```

**With custom message:**

```
Use windows-git-commit with message "feat: add user authentication"
```

**Commit specific files only:**

```
Use windows-git-commit for changes in src/ and tests/
```

**Commit without pushing:**

```
Use windows-git-commit to commit locally only
```

**Push existing commits:**

```
Use windows-git-commit to push existing commits
```

## Commit Message Format

Auto-generated messages follow Conventional Commits:

```
<type>: <brief description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pre-commit Hook

Install the security scanner as a Git pre-commit hook:

```bash
cp windows-git-commit/hooks/pre-commit .git/hooks/pre-commit
```

Uninstall with: `rm .git/hooks/pre-commit`

## Reference Docs

| Document | Description |
|----------|-------------|
| [Security Scanner](references/security-scanner.md) | Scan rules, language support, severity levels, emergency skip |
| [Setup Guide](references/setup.md) | TortoisePlink detection, Git SSH config, Pageant auto-start |
| [TortoiseGit Commands](references/tortoisegit.md) | CLI git vs TortoiseGitProc command reference |
| [Troubleshooting](references/troubleshooting.md) | Common errors, path format fixes, SSH issues |
