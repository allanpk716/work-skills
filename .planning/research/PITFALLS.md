# Pitfalls Research

**Domain:** Git Security Scanning Integration
**Researched:** 2026-02-25
**Confidence:** HIGH

> **Note:** This document focuses on pitfalls specific to adding security scanning to Git workflow tools (v1.1 milestone). For notification system pitfalls from v1.0, see the archived section at the end.

## Critical Pitfalls

### Pitfall 1: False Positive Overload

**What goes wrong:**
Security scanner generates excessive false positives (>50% of alerts), causing developers to ignore all warnings or disable the tool entirely. Common with aggressive regex patterns that match strings like "AKIAXXXEXAMPLEKEYXXX" that aren't real credentials.

**Why it happens:**
- Regex patterns are too broad (e.g., `password.*=.*"`)
- No context awareness (can't distinguish test data from real secrets)
- Entropy thresholds set too low
- No verification of detected patterns
- Missing allowlist/whitelist mechanisms

**How to avoid:**
- Use multi-stage detection: regex → entropy → verification
- Implement confidence scoring for findings
- Provide allowlist mechanism via .gitignore comments (e.g., `# gitcheck: allow`)
- Set appropriate entropy thresholds (recommended: 4.5-5.0 for Shannon entropy)
- Show context around detected issues for user judgment
- Distinguish between ERROR (high confidence) and WARNING (low confidence)

**Warning signs:**
- Developers frequently use `--no-verify` to bypass hooks
- Complaints about "too many false alarms"
- Scanning takes excessive time due to overly broad patterns
- Users suggest removing the security check entirely

**Phase to address:**
Phase 1 (Core Scanning) - Establish detection rules and validation logic

---

### Pitfall 2: Performance Bottleneck on Large Staged Areas

**What goes wrong:**
Scanning takes >2 seconds on medium-sized repositories, or scales linearly with repository size, making commits feel sluggish. Developers avoid committing frequently due to wait times.

**Why it happens:**
- Scanning entire repository instead of staged files only
- Not filtering binary files before content scanning
- Running expensive regex patterns on all file types
- Missing early-exit conditions
- Python startup overhead on Windows (3-5x slower than Unix)

**How to avoid:**
- Use `git diff --cached --name-only --diff-filter=ACM` to get only staged files
- Detect and skip binary files using `file` command or magic bytes
- Filter by file extension before applying regex (e.g., skip `.png`, `.exe`)
- Cache .gitignore parsing results
- Use efficient regex patterns (avoid catastrophic backtracking)
- Consider Rust-based scanner for critical performance scenarios
- Set performance budget: <2 seconds for typical commits

**Warning signs:**
- Commit times exceeding 2 seconds consistently
- Developers batching commits to "get it over with"
- complaints about "slow git"
- Performance degrades as repository grows

**Phase to address:**
Phase 1 (Core Scanning) - Build performance into architecture from start

---

### Pitfall 3: Breaking Existing Git Workflows

**What goes wrong:**
Security scanner introduces friction that breaks established workflows. Examples: blocking all commits during emergencies, not handling merge commits properly, incompatible with existing hooks.

**Why it happens:**
- Overly strict blocking (no bypass option)
- Not considering special commit types (merges, squashes, amends)
- Conflicting with other pre-commit hooks
- No way to skip for specific files or situations
- Poor error messages that don't explain how to fix

**How to avoid:**
- Provide `--no-verify` bypass with clear warning message
- Support `.gitignore` patterns for excluding files from scanning
- Handle edge cases: merge commits, amend commits, empty commits
- Test with existing hook frameworks (pre-commit, Husky)
- Show actionable error messages with fix suggestions
- Implement severity levels: ERROR (block) vs WARNING (allow with warning)

**Warning signs:**
- Developers frustrated with "rigid" tool
- Workarounds being invented (like temporarily disabling hooks)
- Requests to remove the scanner
- Conflicts reported with other Git tools

**Phase to address:**
Phase 1 (Core Scanning) - Design for integration and flexibility

---

### Pitfall 4: Binary File Content Scanning Failures

**What goes wrong:**
Scanner attempts to read binary files (images, executables, PDFs) as text, causing crashes, garbled output, or false positives from random byte sequences that happen to match patterns.

**Why it happens:**
- Not checking file type before reading content
- Using `grep` or `cat` on binary files without `-I` flag
- Python `open()` in text mode on binary files
- Relying solely on file extension (some binaries lack proper extensions)

**How to avoid:**
- Detect binary files before content scanning:
  - Use `file` command: `file "$file" | grep -q "text"`
  - Check magic bytes (first few bytes of file)
  - Use `git diff --numstat` (shows `-` for binary files)
- Skip binary files from content-based secret detection
- Still check binary file paths against filename patterns (e.g., `.env.backup`)
- Document which file types are skipped

**Warning signs:**
- Scanning crashes on certain files
- Garbled terminal output during scan
- False positives from binary files
- Performance issues when scanning large binaries

**Phase to address:**
Phase 1 (Core Scanning) - Implement file type detection early

---

### Pitfall 5: .gitignore Parsing Edge Cases

**What goes wrong:**
Scanner doesn't properly handle .gitignore syntax, leading to incorrect exclusions. Examples: not handling `!` negation, ignoring comments, mishandling directory patterns.

**Why it happens:**
- Implementing custom .gitignore parser instead of using Git's built-in
- Not handling all .gitignore syntax: `#` comments, `!` negation, `/` anchoring, `**` glob
- Parsing order issues (negation must come after ignore pattern)
- Not respecting multiple .gitignore files at different levels

**How to avoid:**
- Use `git check-ignore` command instead of custom parsing: `git check-ignore -q "$file"`
- If custom parsing needed, handle all syntax:
  - Lines starting with `#` are comments
  - `!` prefix negates previous ignore
  - `/` prefix anchors to root
  - `/` suffix means directory only
  - `**` for recursive matching
- Test parser against Git's behavior for consistency
- Support both project and global .gitignore

**Warning signs:**
- Files incorrectly included/excluded from scanning
- Discrepancy between Git's behavior and scanner's behavior
- Complex .gitignore patterns not working

**Phase to address:**
Phase 1 (Core Scanning) - Use Git's native ignore checking

---

### Pitfall 6: Windows-Specific Path and Execution Issues

**What goes wrong:**
Scanner works in development but fails in production due to Windows-specific issues: path separator confusion, Python version conflicts, line ending issues, slow startup times.

**Why it happens:**
- Path separators: `\` vs `/` inconsistency
- Git Bash vs WSL vs CMD environment differences
- CRLF vs LF line ending issues in scripts
- Windows Python vs WSL Python path conflicts
- Windows file system operations 3-5x slower than Unix

**How to avoid:**
- Always use forward slashes `/` in paths (Git handles conversion)
- Use `#!/usr/bin/env python3` shebang for portability
- Convert scripts to LF line endings before deployment
- Test on actual Windows systems, not just WSL
- Use absolute paths for Python interpreter if needed
- Minimize Python startup overhead (consider single script vs multiple modules)
- Use `os.path.join()` for path construction

**Warning signs:**
- "Works on my machine" (Linux/Mac) but fails on Windows
- Path not found errors with backslash/forward slash issues
- Hook scripts fail to execute (syntax errors from CRLF)
- Performance significantly worse on Windows

**Phase to address:**
Phase 2 (Integration & Testing) - Windows-specific testing and optimization

---

### Pitfall 7: Poor Error Messages and User Guidance

**What goes wrong:**
Scanner detects issues but provides unhelpful messages like "Security issue found" without context, leaving users confused about what's wrong and how to fix it.

**Why it happens:**
- Focusing on detection without considering user experience
- Not including file paths, line numbers, or code snippets
- Missing fix suggestions or remediation steps
- Generic error messages that don't explain severity

**How to avoid:**
- Always include in error messages:
  - File path and line number
  - Type of issue (credential, cache file, config, etc.)
  - Specific content that triggered detection (with partial masking for secrets)
  - Severity level (ERROR vs WARNING)
  - Fix suggestion (e.g., "Add to .gitignore", "Use environment variables")
- Use color coding for readability (red for errors, yellow for warnings)
- Provide examples of good vs bad patterns

**Warning signs:**
- Users asking "what does this error mean?"
- Users pasting entire error logs in issues/chats
- Repeated questions about the same error type

**Phase to address:**
Phase 1 (Core Scanning) - UX design for error reporting

---

### Pitfall 8: Regex Pattern False Negatives

**What goes wrong:**
Scanner fails to detect real secrets because regex patterns are too narrow or don't account for variations in secret formats. Examples: missing environment variable assignments, non-standard key formats, obfuscated secrets.

**Why it happens:**
- Relying solely on exact pattern matching
- Not covering all secret format variations
- Missing context-based detection (variable names like `api_key`, `secret`)
- No entropy-based detection for non-standard formats
- Easy to evade with simple formatting changes

**How to avoid:**
- Use multi-layer detection strategy:
  1. **Regex patterns** for known formats (AWS keys, GitHub tokens)
  2. **Keyword detection** for variable names (`password`, `secret`, `api_key`)
  3. **Entropy analysis** for high-randomness strings (threshold: 4.5-5.0)
- Combine multiple signals for confidence scoring
- Test against known secret datasets
- Keep pattern library updated with new secret formats
- Consider LLM-based verification for edge cases (future enhancement)

**Warning signs:**
- Real secrets slip through to repository
- Pattern library requires frequent manual updates
- Detection misses obvious secrets during testing

**Phase to address:**
Phase 1 (Core Scanning) - Implement comprehensive detection strategy

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single regex for all secrets | Quick implementation | High false positives, misses edge cases | Never - always use multi-layer detection |
| Skip .gitignore integration | Simpler code | Users can't customize, rigid behavior | Never - always respect .gitignore |
| No severity levels | Simpler logic | Users overwhelmed by warnings, ignore all alerts | Never - always distinguish ERROR vs WARNING |
| Scan all file types equally | Easier implementation | Performance issues, false positives from binaries | Never - always detect and skip binaries |
| Global hardcoded patterns only | Fast to implement | Can't adapt to project needs | MVP only, add customization immediately after |
| No performance monitoring | Faster initial dev | Performance degrades unnoticed | Never - always measure and log scan times |

## Integration Gotchas

Common mistakes when connecting Git hooks and external tools.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Git pre-commit hook | Forgetting to remove `.sample` extension | Ensure hook file is named `pre-commit` not `pre-commit.sample` |
| Git pre-commit hook | Using wrong shebang for Windows | Use `#!/usr/bin/env python3` for portability across Git Bash/WSL |
| Python execution | Assuming Python in PATH on Windows | Use full path or `py -3` launcher for reliability |
| .gitignore reading | Custom parsing instead of Git's | Use `git check-ignore` command for accuracy |
| File type detection | Relying only on extension | Use `file` command or magic bytes for accuracy |
| Staged file retrieval | Using `git diff` instead of `git diff --cached` | Use `--cached` flag to get staged changes only |
| Binary file handling | Using `cat` or `grep` without `-I` | Use `grep -I` or check file type first |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Scanning entire repo | Commit times grow with repo size | Only scan staged files: `git diff --cached` | >100 files in repo |
| Complex regex patterns | CPU spikes, long scan times | Use simple patterns + entropy, test regex performance | >10 files per commit |
| No binary detection | Crashes, false positives on images | Detect and skip binary files early | Any binary in repo |
| Recompiling patterns every run | Slow startup | Compile regex patterns once, cache in memory | Any Python startup |
| Not filtering by extension | Scans PNGs, PDFs, binaries | Whitelist text file extensions | Mixed file types in repo |
| Windows Python startup | 1-2 second overhead per commit | Minimize imports, use efficient structure | Every commit on Windows |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging detected secrets | Secrets in log files | Mask secrets in output, never log full values |
| Storing scan results | Secrets persisted to disk | Only scan, never store results |
| Overly permissive allowlist | Real secrets whitelisted | Require explicit comments for allowlist entries |
| Not updating patterns | New secret formats missed | Regular pattern library updates, subscribe to secret format feeds |
| Entropy threshold too low | Too many false positives | Set entropy to 4.5-5.0, validate against real data |
| Only pattern matching | Misses non-standard secrets | Combine regex + keyword + entropy detection |
| No verification step | High false positive rate | Verify detected secrets when possible (e.g., test AWS key format) |

## UX Pitfalls

Common user experience mistakes in security scanning tools.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Blocking without bypass | Developers frustrated, can't commit during emergencies | Provide `--no-verify` with clear warning |
| Generic error messages | Users don't know how to fix issues | Show file, line, content, and fix suggestion |
| No severity distinction | Users treat all alerts as noise | Use ERROR (block) vs WARNING (allow with warning) |
| No color coding | Hard to scan output quickly | Use red for errors, yellow for warnings, green for success |
| Overwhelming output | Users ignore long reports | Group by severity, show summary first, details on request |
| No i18n support | Non-English users struggle | Support multiple languages, detect system locale |
| No skip documentation | Users don't know how to exclude files | Document .gitignore integration clearly |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Binary file handling:** Often missing proper detection — verify with images, PDFs, executables
- [ ] **.gitignore integration:** Often missing negation patterns — verify `!` patterns work
- [ ] **Performance:** Often slow on large repos — verify with >100 staged files
- [ ] **Windows compatibility:** Often broken paths or execution — verify on actual Windows (not WSL)
- [ ] **Error messages:** Often missing line numbers — verify errors show file:line format
- [ ] **Bypass mechanism:** Often missing `--no-verify` — verify emergency bypass works
- [ ] **False positive handling:** Often no allowlist — verify users can exclude patterns
- [ ] **Merge commits:** Often fails on merges — verify with merge commit scenarios
- [ ] **Empty commits:** Often crashes on empty — verify with `git commit --allow-empty`
- [ ] **Deleted files:** Often tries to scan deleted files — verify with `git rm` scenarios

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| False positive overload | MEDIUM | Tune patterns, add allowlist entries, adjust entropy threshold |
| Performance bottleneck | MEDIUM | Optimize regex, add binary detection, implement caching |
| Workflow breakage | LOW | Add bypass option, improve error messages, adjust severity levels |
| Binary scanning crash | LOW | Add file type detection before content scanning |
| .gitignore parsing bug | LOW | Switch to `git check-ignore` command |
| Windows path issues | LOW | Normalize path separators, test on actual Windows |
| Poor error messages | LOW | Add context, line numbers, fix suggestions |
| False negatives | HIGH | Audit pattern library, add keyword detection, implement entropy analysis |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| False positive overload | Phase 1: Core Scanning | Test with real codebases, measure false positive rate |
| Performance bottleneck | Phase 1: Core Scanning | Benchmark with large staged areas, measure time |
| Breaking workflows | Phase 1: Core Scanning | Test with existing hooks, verify bypass works |
| Binary file scanning | Phase 1: Core Scanning | Test with various binary file types |
| .gitignore parsing | Phase 1: Core Scanning | Test against Git's behavior, verify edge cases |
| Windows issues | Phase 2: Integration & Testing | Test on actual Windows systems (not just WSL) |
| Poor error messages | Phase 1: Core Scanning | User testing of error clarity |
| Regex false negatives | Phase 1: Core Scanning | Test against known secret datasets |

## Sources

- [Large-Scale Analysis of Code Security in Public Repositories (Springer, 2026)](https://link.springer.com/article/10.1007/s10207-025-01187-w) - False positive rates >50%, AI-assisted filtering
- [GitLab SAST False Positive Detection (2026)](https://docs.gitlab.com/ee/user/application_security/vulnerabilities/) - AI-based confidence scoring
- [Rusty Hog - Rust Secret Scanner (2026)](https://blog.csdn.net/gitblog_00091/article/details/139163370) - Performance optimization with Rust
- [Pre-commit Security Scanning UX Mistakes (Web Search, 2026)] - Common UX pitfalls in pre-commit hooks
- [lint-staged Performance Optimization (npm)](https://www.npmjs.com/package/lint-staged/v/9.5.0) - 45x performance improvement by scanning staged files only
- [Git Hooks Complete Guide (DataCamp)](https://www.datacamp.com/tutorial/git-hooks-complete-guide) - Windows Git hook execution
- [Git Performance Optimization on Windows (CSDN)](https://blog.csdn.net/gitblog_00814/article/details/152069989) - Windows-specific performance issues
- [Secret Detection with Large Language Models (arXiv, 2025)](https://arxiv.org) - False negatives in regex-based detection
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks) - Entropy thresholds and allowlist mechanisms
- [Yelp's detect-secrets](https://github.com/Yelp/detect-secrets) - Multi-layer detection strategy
- [Git .gitignore Syntax (geek-docs.com)](https://geek-docs.com/git/git-questions/606_git_git_ignore_exception.html) - .gitignore parsing edge cases

---

## Archived: v1.0 Notification System Pitfalls

*The following pitfalls were documented for the claude-notify plugin (v1.0) and are retained for reference.*

### Critical Pitfalls (v1.0)

#### Pitfall 1: Hook Timeout Violations
- **Issue:** Hook scripts exceed 5-second timeout, silently killed
- **Prevention:** Use ThreadPoolExecutor, explicit timeouts, async execution

#### Pitfall 2: Environment Variable Scope Confusion
- **Issue:** Global skills can't access project-level .env files
- **Prevention:** Require system-level environment variables, clear documentation

#### Pitfall 3: Windows Path Encoding Issues
- **Issue:** Backslashes in paths break JSON parsing
- **Prevention:** Pre-process stdin data, force UTF-8 encoding

#### Pitfall 4: Multiple Notification Channel Fallback Failures
- **Issue:** One channel failure blocks all notifications
- **Prevention:** Independent exception handling per channel, best-effort delivery

*For full v1.0 pitfalls documentation, see project history.*

---
*Pitfalls research for: Git Security Scanning Integration*
*Researched: 2026-02-25*
