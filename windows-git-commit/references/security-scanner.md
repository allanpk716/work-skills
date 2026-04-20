# Security Scanner Reference

> Back to [SKILL.md](../SKILL.md)

## Automatic Security Scanning

**What gets scanned:**
- **Sensitive Information:**
  - AWS credentials (Access Key, Secret Key, Session Token)
  - Git service tokens (GitHub, GitLab, Bitbucket)
  - Generic API keys and secrets
  - SSH private keys
  - PGP private keys
  - PEM certificates

- **Cache & Build Files:**
  - Python cache (__pycache__, *.pyc)
  - Node.js dependencies (node_modules/, package-lock.json)
  - Build artifacts (dist/, build/, *.class)
  - System files (*.log, *.tmp, .DS_Store)

- **Configuration Files:**
  - Environment files (.env, .env.local)
  - Credentials files (credentials.json, secrets.yaml)
  - Config files with sensitive fields

- **Internal Information:**
  - Private IP addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
  - Internal domains (*.internal, *.local, *.corp, *.intranet)
  - Email addresses (with exclusion list for public emails)

**Whitelist Comments:**
Control false positives with special comments:

```python
# Skip specific line
server_ip = "10.0.0.1"  # gitcheck:ignore-line

# Skip entire file
# gitcheck:ignore-file

# Skip specific rule
admin_email = "admin@company.com"  # gitcheck:ignore-rule:INTL-03

# Skip all IP detections
internal_host = "192.168.1.1"  # gitcheck:ignore-all-ips
```

**Configuration:**
Security scanning is enabled by default. To disable:

1. Open `windows-git-commit/SKILL.md`
2. Add configuration:
   ```yaml
   security_scanner:
     enabled: false
   ```

**Error Handling:**
- Scanner errors do NOT block commits (shows warning only)
- Detected issues MUST be resolved or whitelisted (blocks commit)

## Language Support

The scanner supports bilingual output in Chinese and English.

**Default Language:** Chinese (zh)

**Switch Language:**

The scanner currently uses Chinese (zh) as the default language. To switch to English output, you can modify the scanner call in the pre-commit hook or use environment variables (future enhancement).

**Example Output:**

Chinese:
```
============================================================
Git 安全扫描报告
============================================================

发现问题: 2 个:

规则 ID     文件          行号  内容              建议
---------  -----------  ------  ----------------  -----------------------
SENS-01    config.py        10  AKIA***EXAMPLE    移除 AWS Access Key...
CACHE-01   __pycache__       0  <cache file>      添加到 .gitignore

建议操作:
  1. 从暂存文件中移除敏感数据
  2. 如需要,将文件添加到 .gitignore: git reset HEAD <file>
  3. 重新暂存更改: git add <file>
  4. 重试提交
```

English:
```
============================================================
Git Security Scan Report
============================================================

Found 2 issue(s):

Rule ID    File          Line  Content           Suggestion
---------  -----------  -----  ----------------  -----------------------
SENS-01    config.py       10  AKIA***EXAMPLE    Remove AWS Access Key...
CACHE-01   __pycache__      0  <cache file>      Add to .gitignore

Suggested actions:
  1. Remove sensitive data from staged files
  2. Add files to .gitignore if needed: git reset HEAD <file>
  3. Re-stage changes: git add <file>
  4. Retry commit
```

## Color Output

The scanner uses colored output to improve readability.

**Default:** Colors enabled (auto-detected)

**Color Scheme:**

- **CRITICAL** (red): Blocks commit, must be resolved
- **HIGH** (light red): Blocks commit, important security issue
- **MEDIUM** (yellow): Blocks commit, configuration issue
- **WARNING** (light yellow): Shows warning (informational)

**Terminal Support:**

Colors work automatically on:
- Windows CMD
- Windows PowerShell
- Git Bash
- Other terminals with ANSI support

**Graceful Degradation:**

When output is redirected to a file or terminal doesn't support colors:
- Colors are automatically disabled
- Plain text output (no ANSI codes)

**Manual Override:**

Colors can be controlled via the `use_colors` parameter in programmatic usage:
```python
from scanner.executor import run_pre_commit_scan

# Auto-detect (default)
run_pre_commit_scan(use_colors=None)

# Force enable
run_pre_commit_scan(use_colors=True)

# Disable colors
run_pre_commit_scan(use_colors=False)
```

## Severity Levels

Issues are classified by severity level:

**CRITICAL (blocks commit):**
- AWS credentials, API keys, tokens
- SSH/PGP private keys
- High-risk secrets

**HIGH (blocks commit):**
- Sensitive configuration fields
- Internal information (private IPs, internal domains)
- Email addresses

**MEDIUM (blocks commit):**
- Configuration files (.env, credentials.json)
- Potentially sensitive files

**WARNING (informational):**
- Cache files (future: will not block commit)
- Currently treated as medium severity

**Behavior:**

- All severity levels currently block commits
- Future enhancement: WARNING level will allow commits with warning only
- All issues must be resolved or whitelisted before commit

**Output Format:**

Colors indicate severity:
- Red: CRITICAL issues
- Light Red: HIGH issues
- Yellow: MEDIUM issues
- Light Yellow: WARNING issues

## Emergency Skip (USE WITH CAUTION)

**If you absolutely must commit without scanning in an emergency:**

```bash
git commit --no-verify -m "emergency fix"
```

**WARNING: This bypasses ALL security checks!**

**Risks:**
- Sensitive information (AWS keys, API tokens) may be committed
- Cache files (node_modules, __pycache__) may be included
- Configuration files (.env, credentials.json) may leak
- Internal information (private IPs, internal domains) may be exposed

**Best practices when using --no-verify:**
1. **Only use in genuine emergencies** (production down, critical bug fix)
2. **Review the commit manually** before pushing: `git show HEAD`
3. **Check for sensitive content**: `git diff HEAD~1`
4. **Consider using whitelist comments** instead (see Security Scanning section)
5. **Document why skip was necessary** in commit message

**Alternative: Whitelist specific lines**

Instead of bypassing all checks, use whitelist comments:

```python
# Skip specific line
server_ip = "10.0.0.1"  # gitcheck:ignore-line

# Skip entire file
# gitcheck:ignore-file

# Skip specific rule
admin_email = "admin@company.com"  # gitcheck:ignore-rule:INTL-03
```

**How --no-verify works:**

The `--no-verify` flag is a standard Git option that skips all pre-commit hooks, including the security scanner. This is a Git built-in feature, not specific to this skill.

**Security implications:**

When you use `--no-verify`:
- The commit proceeds immediately without scanning
- All security checks are bypassed
- Sensitive data may be committed to your repository
- Once pushed, sensitive data is in remote history (very hard to remove)

**If you accidentally commit sensitive data:**

1. **Do NOT push** if you haven't pushed yet
2. **Amend the commit**: `git commit --amend` (remove sensitive content first)
3. **If already pushed**: Contact repository admin immediately
4. **Rotate compromised credentials**: Change passwords, regenerate API keys
