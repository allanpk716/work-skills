# Pitfalls Research

**Domain:** Claude Code Skills and Notification Systems
**Researched:** 2026-02-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Hook Timeout Violations

**What goes wrong:**
Hook scripts that exceed Claude Code's 5-second timeout are silently killed, causing notifications to never be sent. Developers often don't realize their hook failed because error handling is limited within the timeout window.

**Why it happens:**
- Calling external APIs (Pushover) synchronously without timeout handling
- Using subprocess calls without explicit timeout parameters
- Attempting AI summarization via Claude CLI within the hook
- Multiple notification channels sending sequentially instead of in parallel

**How to avoid:**
- Use `ThreadPoolExecutor` for parallel notification sending
- Set explicit timeouts on all subprocess calls (e.g., `timeout=10` for curl)
- Consider using `async: true` in hook configuration for non-blocking execution
- Cache expensive operations and reuse results across hook invocations

**Warning signs:**
- Notifications work intermittently
- Debug logs show hook started but never completed
- Users report missing notifications for long-running tasks

**Phase to address:**
Phase 1 (Core Implementation) - Design for async from the start

---

### Pitfall 2: Environment Variable Scope Confusion

**What goes wrong:**
Global skills cannot access project-level configuration files. Developers try to use `.env` files or project config, but global hooks run in a different context where these files don't exist or aren't loaded.

**Why it happens:**
- Global skills are installed in `~/.claude/skills/`, not in project directories
- Claude Code doesn't automatically load `.env` files for hook scripts
- PATH differences between interactive shells and hook execution context

**How to avoid:**
- Require environment variables (`PUSHOVER_TOKEN`, `PUSHOVER_USER`) to be set at system level
- Document clear setup instructions for Windows (System Properties > Environment Variables)
- Provide diagnostic scripts to verify configuration before use
- Use `os.environ.get()` with clear error messages when vars are missing

**Warning signs:**
- Hook works when tested manually but fails during Claude Code sessions
- "Missing env vars" errors in debug logs
- Different behavior across machines or users

**Phase to address:**
Phase 1 (Core Implementation) - Document environment setup clearly

---

### Pitfall 3: Windows Path Encoding Issues

**What goes wrong:**
Hook input JSON contains Windows paths with backslashes that break JSON parsing. The hook silently fails because `json.loads()` raises an exception.

**Why it happens:**
- Windows paths like `C:\WorkSpace\project` contain unescaped backslashes
- Claude Code passes `cwd` field with native path separators
- JSON spec requires backslashes to be escaped as `\\`

**How to avoid:**
- Pre-process stdin data: `stdin_data.replace("\\", "\\\\")`
- Force UTF-8 encoding on stdin: `sys.stdin.reconfigure(encoding='utf-8')`
- Log raw input for debugging before JSON parsing
- Handle `JSONDecodeError` gracefully with informative error messages

**Warning signs:**
- "JSON decode failed" errors in logs
- Hook processes correctly on Linux/Mac but fails on Windows
- Logs show hook started but no further progress

**Phase to address:**
Phase 1 (Core Implementation) - Critical for Windows compatibility

---

### Pitfall 4: Multiple Notification Channel Fallback Failures

**What goes wrong:**
When one notification channel fails (e.g., Pushover API down), the entire hook fails without attempting other channels. Users receive no notification despite having multiple options configured.

**Why it happens:**
- Sequential execution with early return on failure
- Not catching exceptions per-channel
- Treating notification as atomic operation instead of best-effort

**How to avoid:**
- Use `ThreadPoolExecutor` with independent futures per channel
- Catch exceptions per channel, not globally
- Return results dict showing status of each channel: `{"pushover": True, "windows": False}`
- Log each channel's result independently
- Continue to next channel even if one fails

**Warning signs:**
- No notifications when API is temporarily unavailable
- Users report inconsistent delivery
- Windows notifications stop working when network is down

**Phase to address:**
Phase 1 (Core Implementation) - Design for resilience

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip debug logging | Faster development | Impossible to diagnose production issues | Never |
| Hardcode project name extraction | Simpler code | Breaks with non-standard directory structures | MVP only, replace before v1 |
| Single notification method | Less code to maintain | Single point of failure | Never for production use |
| Ignore Windows notification failures | Avoids PowerShell complexity | 50% of users get no notification | Never |
| Skip cache cleanup | Faster hook execution | Disk space grows unbounded | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Pushover API | Using curl without TLS version specification | Add `--tlsv1.2 --ssl-reqd` for Windows schannel compatibility |
| Pushover API | Not URL-encoding message content | Use `--data-urlencode` for all text fields |
| Windows Notifications | Relying only on BurntToast module | Implement fallback chain: BurntToast -> WinRT -> Classic balloon |
| Windows PowerShell | Unquoted strings in notification body | Double-escape quotes: `replace("'", "''")` |
| Claude CLI | Calling for summarization in Stop hook | Use cache fallback, timeout at 30s, accept failure gracefully |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous API calls | Hook timeout, notifications lost | Parallel execution with ThreadPoolExecutor | 1+ second API latency |
| Growing log files | Disk space exhaustion | Implement log rotation by date, keep max 5 days | Weeks of usage |
| Session cache accumulation | `.claude/cache/` grows unbounded | Delete cache files after notification sent | Multiple sessions per day |
| No request timeout | Hook hangs indefinitely | Set `timeout=10` on all subprocess calls | Network issues |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging API tokens | Credential exposure in debug logs | Mask tokens: `token[:10]...` in log output |
| Storing credentials in skill files | Credentials committed to git | Require environment variables, document in README |
| Unvalidated notification content | Injection into PowerShell commands | Escape all user-provided content before shell execution |
| World-readable config files | Token exposure on shared systems | Document file permissions: `chmod 400` on config files |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No disable mechanism | Notifications for unimportant projects | Support `.no-pushover` and `.no-windows` marker files |
| No diagnostic tools | "It doesn't work" with no recourse | Provide `diagnose.py` script that checks all configuration |
| Silent failures | Users don't know notifications are broken | Write debug logs, document how to check them |
| Cryptic error messages | Users can't self-fix configuration issues | Provide actionable error messages with solution steps |
| No test command | Users must wait for real task to verify | Provide standalone test scripts for each notification channel |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Hook registration:** Often missing from `settings.json` - verify hook appears in user/project/local settings
- [ ] **Environment variables:** Often set in current shell but not persistent - verify with new terminal session
- [ ] **Windows notifications:** Often works in testing but fails in production - test all three fallback methods
- [ ] **Project name extraction:** Often works for simple paths but fails with special characters - test with paths containing spaces, unicode
- [ ] **Error handling:** Often catches exceptions but doesn't log them - verify all exception handlers write to log
- [ ] **Log rotation:** Often implemented but never tested - verify old logs are actually deleted

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hook timeout | LOW | Add `async: true` to hook config, or optimize script performance |
| Missing env vars | LOW | Set system environment variables, restart Claude Code session |
| Path encoding | LOW | Add JSON escape preprocessing, redeploy hook |
| Notification failures | MEDIUM | Check debug logs, verify API credentials, test each channel independently |
| Log file bloat | LOW | Manually delete old logs, add log rotation code |
| PowerShell failures | MEDIUM | Install BurntToast module, or check Windows notification settings |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hook timeout violations | Phase 1 (Core Implementation) | Test with simulated slow API response |
| Environment variable scope | Phase 1 (Core Implementation) | Run diagnostic script on fresh machine |
| Windows path encoding | Phase 1 (Core Implementation) | Test on Windows with various path patterns |
| Multiple channel fallbacks | Phase 1 (Core Implementation) | Disconnect network, verify Windows notification still works |
| Debug logging | Phase 1 (Core Implementation) | Trigger error, verify log contains actionable message |
| Log rotation | Phase 2 (Testing & Polish) | Run for 7 days, verify old logs deleted |
| Disable mechanism | Phase 1 (Core Implementation) | Create `.no-pushover`, verify notifications stop |
| Diagnostic tools | Phase 2 (Testing & Polish) | Run diagnose.py with missing env vars, verify clear error message |
| Documentation | Phase 2 (Testing & Polish) | Have new user follow setup guide, verify success |

## Sources

- Claude Code Hooks Documentation: https://claudefa.st/blog/tools/hooks/hooks-guide
- SFEIR Institute - Context Management Common Mistakes: https://institute.sfeir.com/en/claude-code/claude-code-context-management/errors/
- SFEIR Institute - Advanced Best Practices Common Mistakes: https://institute.sfeir.com/en/claude-code/claude-code-advanced-best-practices/errors/
- Claude Code Hooks Guardrails: https://paddo.dev/blog/claude-code-hooks-guardrails/
- ClaudeLog Hooks Implementation: https://www.claudelog.com/mechanics/hooks/
- python-pushover GitHub: https://github.com/Thibauth/python-pushover
- Pushover API Documentation: https://pushover.net/api
- Windows BurntToast Module: https://github.com/Windos/BurntToast
- Original cc-pushover-hook implementation: C:/WorkSpace/cc-pushover-hook/

---
*Pitfalls research for: Claude Code Skills and Notification Systems*
*Researched: 2026-02-24*
