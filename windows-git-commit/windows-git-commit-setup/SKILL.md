---
name: windows-git-commit-setup
description: >
  Guide users through windows-git-commit environment configuration: TortoisePlink.exe
  path detection, git core.sshcommand configuration, Pageant auto-start setup,
  and verification. Triggers on: "windows-git-commit setup", "git setup",
  "configure git ssh", "setup tortoiseplink", "pageant setup", "git plink config".
---

# Windows Git Commit Setup — Configuration Guide

<objective>
Walk the user through setting up the windows-git-commit environment end-to-end:
TortoisePlink.exe path detection, git SSH command configuration, Pageant auto-start
with PPK key loading, and diagnostic verification. At the end the user should have
command-line git working with plink + PPK authentication — no GUI dialogs, no password
prompts, fully automated Git push operations.
</objective>

## Prerequisites

Before starting, confirm:

- **Git for Windows** is installed and on PATH (`git --version`)
- **TortoiseGit** is installed (provides TortoisePlink.exe and Pageant) OR **PuTTY** is installed separately
- **A PPK-format SSH key** exists (e.g., `%USERPROFILE%\.ssh\id_rsa.ppk`)

## Step 1: Detect TortoisePlink.exe Path

TortoisePlink.exe is the plink-compatible SSH client bundled with TortoiseGit. It works
with Pageant for PPK key authentication.

**Auto-detection — run this command:**

```bash
# Check common installation locations
if [ -f "/c/Program Files/TortoiseGit/bin/TortoisePlink.exe" ]; then
  echo "FOUND: C:\\Program Files\\TortoiseGit\\bin\\TortoisePlink.exe"
elif [ -f "/c/Program Files (x86)/TortoiseGit/bin/TortoisePlink.exe" ]; then
  echo "FOUND: C:\\Program Files (x86)\\TortoiseGit\\bin\\TortoisePlink.exe"
elif [ -f "/c/Program Files/PuTTY/plink.exe" ]; then
  echo "FOUND: C:\\Program Files\\PuTTY\\plink.exe"
elif [ -f "/c/Program Files (x86)/PuTTY/plink.exe" ]; then
  echo "FOUND: C:\\Program Files (x86)\\PuTTY\\plink.exe"
else
  WHERE_RESULT=$(where TortoisePlink.exe 2>/dev/null | head -1)
  if [ -n "$WHERE_RESULT" ]; then
    echo "FOUND via where: $WHERE_RESULT"
  else
    echo "NOT FOUND — install TortoiseGit or PuTTY"
  fi
fi
```

**Common paths:**

| Source | Path |
|--------|------|
| TortoiseGit (64-bit) | `C:\Program Files\TortoiseGit\bin\TortoisePlink.exe` |
| TortoiseGit (32-bit) | `C:\Program Files (x86)\TortoiseGit\bin\TortoisePlink.exe` |
| PuTTY (standalone) | `C:\Program Files\PuTTY\plink.exe` |

> If none are found, install [TortoiseGit](https://tortoisegit.org/) and re-run detection.

## Step 2: Configure Git to Use TortoisePlink

Set `core.sshcommand` globally so all Git operations use the detected plink client:

```bash
# Replace with your detected path. Quotes and escaping are critical!
git config --global core.sshcommand "\"C:\Program Files\TortoiseGit\bin\TortoisePlink.exe\""
```

**Important path rules:**
- Use **Windows format** with backslashes: `C:\Program Files\...`
- The entire path must be **double-quoted and escaped**: `"\"C:\...\TortoisePlink.exe\""`
- Do NOT use Git Bash format (`/c/Program Files/...`) — it will not work

**Verify the configuration:**

```bash
git config --global core.sshcommand
# Should output: "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"
```

## Step 3: Configure Pageant Auto-Start

Pageant holds your PPK key in memory so Git can authenticate without prompting.

**Create a startup batch file** (`start-pageant.bat`):

```batch
@echo off
REM --- Pageant Auto-Start ---
REM Adjust the paths below to match your installation

REM Use TortoiseGit's Pageant:
start "Pageant" "C:\Program Files\TortoiseGit\bin\pageant.exe" "%USERPROFILE%\.ssh\id_rsa.ppk"

REM Or use standalone PuTTY's Pageant:
REM start "Pageant" "C:\Program Files\PuTTY\pageant.exe" "%USERPROFILE%\.ssh\id_rsa.ppk"
```

> Replace `id_rsa.ppk` with your actual PPK filename.

**Place in Windows Startup folder:**

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `start-pageant.bat` in the opened folder
3. Pageant will now start automatically on login

**Or copy via command line:**

```cmd
copy start-pageant.bat "%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\"
```

## Step 4: Verify Everything Works

Run these checks to confirm the setup is complete:

### Check 1: Git SSH Configuration

```bash
git config --global core.sshcommand
# Expected: the TortoisePlink.exe path you configured
```

### Check 2: Pageant Running

```bash
tasklist | grep -i pageant
# Expected: a line showing pageant.exe process
```

If Pageant is not running, start it manually:
```bash
"C:\Program Files\TortoiseGit\bin\pageant.exe" "%USERPROFILE%\.ssh\id_rsa.ppk"
```

### Check 3: End-to-End SSH Test

```bash
# Test SSH connectivity to GitHub (or your Git host)
ssh -T git@github.com
# Expected: "Hi <username>! You've successfully authenticated..."
```

### Check 4: Test Git Push

```bash
# In any git repository, try a push
git push
# Expected: succeeds without password prompt or GUI dialog
```

<process>
1. Ask the user whether TortoiseGit or standalone PuTTY is installed
2. Run the auto-detection script from Step 1 to find TortoisePlink.exe
3. If not found, guide the user to install TortoiseGit and re-run detection
4. Configure `git config --global core.sshcommand` with the detected path (Step 2)
5. Verify the configuration was set correctly
6. Ask whether Pageant auto-start is already configured
7. If not, create the `start-pageant.bat` file and guide placement in the Startup folder (Step 3)
8. Run all four verification checks from Step 4
9. If any check fails, provide specific troubleshooting guidance
10. Confirm to the user that setup is complete and Git push will work without prompts
</process>

<rules>
- Always detect the TortoisePlink path automatically before configuring — never guess
- Path escaping is critical: the value must be `"\"C:\...\TortoisePlink.exe\""` in bash
- If the user has both TortoiseGit and standalone PuTTY, prefer TortoiseGit's tools
- After configuration changes, verify immediately with `git config --global core.sshcommand`
- If Pageant is not running, start it before running SSH tests — SSH will fail without it
- The startup batch file path should use `%USERPROFILE%` for portability across user accounts
</rules>

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `cannot spawn plink` | Path format is wrong — use Windows format with proper escaping |
| `Permission denied (publickey)` | Pageant not running or PPK key not loaded |
| `Could not read from remote` | SSH client not found — re-run Step 1 detection |
| `C:/Program: No such file or directory` | Path has spaces and missing quotes — reconfigure with proper escaping |
| `plink not found` | TortoiseGit not installed — install from https://tortoisegit.org/ |
| Pageant not auto-starting | Check shortcut exists in `shell:startup` folder |

For detailed troubleshooting, see → [references/troubleshooting.md](../references/troubleshooting.md)
For the full one-time setup guide, see → [references/setup.md](../references/setup.md)
