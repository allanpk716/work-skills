---
name: windows-git-commit
description: Windows Git commit and push using command-line git with plink + PPK authentication. Automatically analyzes changes, generates commit messages, and executes operations in background to preserve context. No GUI dialogs.
---

<objective>
Automate Git commit and push operations on Windows using command-line git with plink SSH client. This skill analyzes code changes, generates descriptive commit messages, and executes all Git operations in the background to preserve the main conversation's context window. It solves SSH key authentication problems by configuring git to use plink and reading PPK keys from Pageant. All operations are performed via command-line git without any GUI dialogs.
</objective>

<quick_start>
**Automatic commit and push (recommended):**

Invoke this skill with:
```
Use windows-git-commit to commit and push my changes
```

The skill will:
1. Ensure git is configured to use plink for SSH authentication
2. Analyze your recent changes using git diff
3. Generate a descriptive commit message based on the changes
4. Stage all modified files
5. Commit using command-line git
6. Push to remote repository using command-line git (no GUI)
7. Return only the summary result

**Security Scanning (Automatic):**

This skill automatically scans your staged files for security issues before commit:
- Sensitive information (AWS keys, API tokens, SSH keys)
- Cache and build files (node_modules, __pycache__, etc.)
- Configuration files (.env, credentials.json, etc.)
- Internal information (private IPs, internal domains, emails)

If issues are found, the commit is blocked with a detailed report.

> See [references/security-scanner.md](references/security-scanner.md) for full scanner docs including language support, color output, severity levels, and emergency skip.

**Whitelist comments:**
```python
server_ip = "10.0.0.1"  # gitcheck:ignore-line
# gitcheck:ignore-file  (ignore entire file)
# gitcheck:ignore-rule:INTL-01  (ignore specific rule)
```

**前提条件:**
- Pageant 必须正在运行并加载了 PPK 密钥
- TortoiseGit 必须已安装 (包含 TortoisePlink.exe)
- 第一次运行时会自动检测并配置 git 使用 TortoisePlink

> 详见 [references/setup.md](references/setup.md) 一键配置指南和 [references/troubleshooting.md](references/troubleshooting.md) 常见问题排查。

**With custom commit message:**

```
Use windows-git-commit to commit with message "feat: add user authentication"
```

**Commit specific files only:**

```
Use windows-git-commit to commit changes in src/ and tests/
```
</quick_start>

<context>
**Why use this skill instead of manual git commands?**

On Windows, standard git commands may fail with "permission denied (publickey)" errors when:
- SSH keys are not configured in standard ~/.ssh/ location
- Git is using OpenSSH instead of PuTTY's plink
- Pageant (PuTTY authentication agent) holds the PPK key but git can't access it

This skill solves these problems by:
- Auto-detecting TortoisePlink.exe installation path
- Configuring git with full path: `git config --global core.sshcommand "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"`
- Reading PPK keys from Pageant
- Using command-line git instead of TortoiseGitProc GUI (faster, no dialogs)
- Running in the background to preserve main conversation context

**Background Execution Benefits:**
- Main conversation context stays clean and focused
- Long git operations don't consume your context window
- Git output is processed and summarized
- Errors are caught and reported clearly
</context>

<workflow>
## How This Skill Works

This skill uses the Bash tool directly to execute all Git operations in the background. The workflow is:

1. **Execute Git Workflow**: Run bash commands with run_in_background=true
1.5. **Security Scan**: Run pre-commit security scanner (automatic)
2. **Configure SSH**: Set `git config --global core.sshcommand "plink"` (one-time)
3. **Analyze Changes**: Run git status and git diff to understand what changed
4. **Generate Message**: Create a commit message based on the changes
5. **Stage Files**: Run git add to stage all modified files
6. **Commit**: Use `git commit` command (command-line, no GUI)
7. **Push**: Use `git push` command (uses plink + PPK from Pageant, no GUI)
8. **Report**: Return a concise summary of what was done

**Why background execution?**
- Keeps main conversation context small
- Git command output doesn't clutter the conversation
- Long-running operations don't block the conversation
- Errors are handled and summarized cleanly

**Why command-line git instead of TortoiseGitProc?**
- **Faster**: No GUI overhead
- **No dialogs**: Completely silent operation
- **Better control**: Full access to git options
- **Same authentication**: Uses plink + PPK just like TortoiseGitProc

**Environment Detection:**
The skill automatically detects and configures:
- **TortoisePlink.exe location**: Checks multiple common installation paths
  - `C:\Program Files\TortoiseGit\bin\TortoisePlink.exe`
  - `C:\Program Files (x86)\TortoiseGit\bin\TortoisePlink.exe`
  - `C:\Program Files\PuTTY\plink.exe`
  - Uses `where` command as fallback
- **Pageant status**: Checks if pageant.exe process is running using `tasklist | grep -i pageant`
- **Git configuration**: Automatically configures `core.sshcommand` with the detected path
- **Path format conversion**: Converts Git Bash paths to Windows format with proper escaping
</workflow>

<bash_workflow>
**Execute the following Git workflow using the Bash tool with run_in_background=true:**

**CRITICAL: Environment Detection and Configuration**

First, detect and configure the SSH client properly:

```bash
# Step 1: Check if Pageant is running (use grep for Git Bash compatibility)
tasklist | grep -i pageant
if [ $? -ne 0 ]; then
  echo "WARNING: Pageant is not running. Push may fail."
  echo "Please start Pageant and load your PPK key first."
fi

# Step 2: Find TortoisePlink.exe (check multiple possible locations)
PLINK_PATH=""

# Try common installation paths
if [ -f "/c/Program Files/TortoiseGit/bin/TortoisePlink.exe" ]; then
  PLINK_PATH="C:\\Program Files\\TortoiseGit\\bin\\TortoisePlink.exe"
elif [ -f "/c/Program Files (x86)/TortoiseGit/bin/TortoisePlink.exe" ]; then
  PLINK_PATH="C:\\Program Files (x86)\\TortoiseGit\\bin\\TortoisePlink.exe"
elif [ -f "/c/Program Files/PuTTY/plink.exe" ]; then
  PLINK_PATH="C:\\Program Files\\PuTTY\\plink.exe"
elif [ -f "/c/Program Files (x86)/PuTTY/plink.exe" ]; then
  PLINK_PATH="C:\\Program Files (x86)\\PuTTY\\plink.exe"
else
  # Try using 'where' command
  WHERE_RESULT=$(where TortoisePlink.exe 2>/dev/null | head -1)
  if [ -n "$WHERE_RESULT" ]; then
    # Convert Git Bash path to Windows path
    PLINK_PATH=$(echo "$WHERE_RESULT" | sed 's|/c/|C:\\|g' | sed 's|/|\\|g')
  fi
fi

# Step 3: Configure git to use the detected plink
if [ -n "$PLINK_PATH" ]; then
  echo "Found SSH client: $PLINK_PATH"
  git config --global core.sshcommand "\"$PLINK_PATH\""
else
  echo "ERROR: Cannot find TortoisePlink.exe or plink.exe"
  echo "Please ensure TortoiseGit or PuTTY is installed."
  echo "Falling back to default SSH client (may fail with PPK keys)..."
  git config --global --unset core.sshcommand
fi

# Verify configuration
echo "Current SSH configuration: $(git config --global core.sshcommand)"
```

**Git Workflow:**

After environment setup, proceed with Git operations:

1. Check current repository status: `git status`
2. Get current branch name: `git branch --show-current` (store in variable)
3. Show brief diff: `git diff --stat`
4. Generate a descriptive commit message based on changes
5. Stage all changes: `git add -A`
6. Commit: `git commit -m "[generated message]"`
7. Push: `git push`
8. Verify: `git log -1 --oneline` && `git status`

**CRITICAL IMPLEMENTATION NOTES:**

1. **Path Format**:
   - Windows paths MUST use backslashes: `C:\\Program Files\\...`
   - Git Bash paths like `/c/Program Files/` will NOT work
   - Paths with spaces MUST be quoted and escaped

2. **Command Compatibility**:
   - Use `grep -i pageant` NOT `find /I "pageant.exe"` (Git Bash compatibility)
   - Use `ls` NOT `dir` (cross-platform)

3. **SSH Client Priority**:
   - TortoisePlink.exe (from TortoiseGit) - PREFERRED
   - plink.exe (from PuTTY) - fallback
   - Default SSH client - may not work with PPK keys

4. **Troubleshooting**:
   - If push fails with "cannot spawn plink", path format is wrong
   - If push fails with "permission denied", Pageant not running or PPK not loaded
   - If push fails with "Could not read from remote", SSH client not found

5. **NEVER use TortoiseGitProc.exe**:
   - Even with /silent flag, it may show GUI dialogs
   - Command-line git is faster and more reliable
   - Use `git commit` and `git push` directly

Return ONLY a concise summary in this format:
- 操作结果 (成功/失败)
- 提交信息: [实际使用的提交信息]
- 文件变更: [简短描述]
- 推送状态: [成功/失败]
- SSH 配置: [使用的 SSH 客户端路径]

If any errors occur during environment setup, include them in the summary.
DO NOT return full git command output. Just summarize the results in Chinese.
</bash_workflow>

<instructions>
When this skill is invoked:

1. **Check if user provided commit message** - If yes, use it. If no, generate one based on changes.

2. **Execute the Git workflow** using Bash tool with:
   - command: The full bash script from the <bash_workflow> section
   - description: "Configure SSH and execute Git commit/push"
   - run_in_background: true
   - timeout: 120000 (2 minutes)

3. **Get the output_file path** from the Bash tool result

4. **Wait for completion** by reading the output file or using tail command

5. **Return summary** to user with what was done

**Error handling:**
- If bash command returns error, summarize the error for user
- If timeout, inform user operation may still be running
- If git operations fail, show error and suggest fixes
- Read the output file to get detailed error messages
</instructions>

<commit_message_generation>
**Auto-generating commit messages:**

When no commit message is provided, analyze the changes to generate one:

```bash
# Get file changes
git diff --cached --name-status
git diff --stat

# Analyze patterns:
- Added new feature files -> "feat: add [feature name]"
- Fixed bugs in files -> "fix: resolve [issue description]"
- Updated documentation -> "docs: update [doc name]"
- Changed configuration -> "chore: update [config name]"
- Refactored code -> "refactor: [description of refactoring]"
```

**Commit message format:**
```
<type>: <brief description>

<detailed explanation if needed>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
- `feat: add user authentication with JWT tokens`
- `fix: resolve null pointer exception in session manager`
- `docs: update API documentation with new endpoints`
- `refactor: extract session validation to separate module`
</commit_message_generation>

<usage_patterns>
**Pattern 1: Quick automatic commit**

```
Use windows-git-commit
```

Automatically stages, commits, and pushes all changes with an auto-generated message.

**Pattern 2: With custom message**

```
Use windows-git-commit with message "feat: implement user login"
```

Uses your specified message instead of auto-generating.

**Pattern 3: Commit without pushing**

```
Use windows-git-commit to commit locally only
```

Skips the push step.

**Pattern 4: Push existing commits**

```
Use windows-git-commit to push existing commits
```

Only pushes, doesn't create new commit.

**Pattern 5: Specific files**

```
Use windows-git-commit for changes in web/src/
```

Only stages and commits files matching the pattern.
</usage_patterns>

<security_checklist>
**Before committing, verify:**
- [ ] No API keys, passwords, or secrets in changes
- [ ] No PPK files or private keys
- [ ] Sensitive files in .gitignore
- [ ] Environment variables used for secrets
- [ ] Commit message doesn't contain sensitive info
- [ ] Review git diff for accidental staging of sensitive files
</security_checklist>

<success_criteria>
Operation is successful when:
- Bash command returns without errors
- `core.sshcommand` is set to "plink" (one-time configuration)
- Pageant is running with PPK key loaded
- Commit message generated or used correctly
- Files staged successfully
- git commit exits with code 0
- git push exits with code 0
- git log shows new commit
- git status shows branch is up-to-date
- Summary returned to user confirms success
</success_criteria>

<implementation_notes>
**For Claude (the AI executing this skill):**

When you receive a request to use this skill:

1. Parse the user's intent:
   - Do they want to push? (default: yes)
   - Did they provide a commit message? (if not, generate one)
   - Are there specific files/patterns? (if not, use "git add -A")

2. Construct the bash command with:
   - Clear step-by-step instructions
   - The commit message (or instruction to generate one)
   - Whether to push or skip push
   - Request for concise summary output

3. Execute Bash tool with run_in_background=true

4. Read the output file to get results

5. Present user with a clean summary like:
   ```
   - Committed and pushed successfully
   - Commit: feat: add user authentication
   - Files: 3 changed, 120 insertions(+), 15 deletions(-)
   ```

**Important:** Do NOT return full git command output to the user. Only return a concise summary.
</implementation_notes>

<hook_installation>
## Hook Installation

To enable automatic security scanning before each commit, install the pre-commit hook:

### Manual Installation

1. **Copy hook to Git directory:**
   ```bash
   # From project root
   cp windows-git-commit/hooks/pre-commit .git/hooks/pre-commit
   ```

2. **Make hook executable (Windows):**
   ```bash
   # Ensure Python association is correct
   python .git/hooks/pre-commit
   ```

3. **Verify installation:**
   ```bash
   # Test hook
   python .git/hooks/pre-commit

   # Should see: "Security scan passed. Proceeding with commit."
   ```

### Automated Installation (Future)

Future versions will include automated installation via:
```bash
python -m scanner install-hook
```

For now, manual installation is required.

### How It Works

- Git executes `.git/hooks/pre-commit` automatically before every `git commit`
- Hook runs security scanner on all staged files
- If issues found: commit is blocked (exit code 1)
- If no issues: commit proceeds (exit code 0)
- Respects `.gitignore` rules automatically

### Uninstall

To disable automatic scanning:
```bash
rm .git/hooks/pre-commit
```
</hook_installation>

## 参考文档

- [安全扫描器详情](references/security-scanner.md) — 扫描规则、语言支持、颜色输出、严重性级别、紧急跳过
- [一键配置指南](references/setup.md) — TortoisePlink 检测、Git SSH 配置、Pageant 自动启动
- [TortoiseGit 命令参考](references/tortoisegit.md) — 命令行 git 与 TortoiseGitProc 命令对照
- [故障排除](references/troubleshooting.md) — 常见错误及解决方案、路径格式兼容性
