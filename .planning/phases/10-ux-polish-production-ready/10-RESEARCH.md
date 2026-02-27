# Phase 10: UX Polish & Production Ready - Research

**Created:** 2026-02-26
**Phase:** 10 - UX Polish & Production Ready
**Goal:** 开发者获得生产就绪的安全扫描体验,支持双语和问题分级

---

## Research Question

**What do I need to know to PLAN this phase well?**

如何为现有的 Windows Git 安全扫描器添加双语支持、问题分级和彩色输出,确保生产环境可用?

---

## Context Summary

### Current State (Phase 9 Complete)

Phase 9 已完成 Windows 兼容性测试和性能优化,核心扫描功能已经就绪:

- ✓ 敏感信息检测(AWS keys, API tokens, SSH keys)
- ✓ 缓存文件检测(node_modules, __pycache__)
- ✓ 配置文件检测(.env, credentials.json)
- ✓ 内部信息检测(Private IPs, internal domains, emails)
- ✓ 白名单机制(gitcheck:ignore-line, ignore-file, ignore-rule)
- ✓ Windows 兼容性(CMD/PowerShell/Git Bash)
- ✓ 性能优化(16.77ms,远低于 2s 要求)
- ✓ 紧急跳过机制(git commit --no-verify)
- ✓ 错误处理(非阻塞式,显示警告但允许提交继续)

**Architecture:**
- Python 3 标准库实现,无外部依赖
- 位于 `plugins/windows-git-commit/security-scanner/`
- Pre-commit hook 集成
- 已集成到 SKILL.md 工作流

### Requirements to Address

**UX-01:** 清晰区分警告和错误级别的问题
**UX-03:** 扫描结果使用彩色输出提高可读性
**UX-04:** 支持中文和英文提示信息

### User Decisions (from CONTEXT.md)

1. **问题分级策略:**
   - 所有检测到的问题默认都是 error 级别,必须修复才能提交
   - 架构上支持 warning 级别(未来扩展)
   - 输出展示:error=红色+[ERROR]标记, warning=黄色+[WARNING]标记

2. **双语支持方式:**
   - 命令行参数 `--lang zh/en` 切换语言
   - 默认语言为中文
   - 翻译范围:用户提示信息(错误/警告/帮助)
   - 代码注释和日志保持英文
   - 使用代码内字典组织翻译字符串

3. **彩色输出设计:**
   - ANSI 标准颜色:error=红色, warning=黄色, info=蓝色/绿色
   - 使用 Python colorama 库(跨平台)
   - 自动检测终端能力,不支持颜色时降级
   - 不支持用户自定义颜色方案

4. **生产验证标准:**
   - 在 work-skills 仓库自测
   - 性能基准延续 Phase 9 标准
   - 文档更新集中在 SKILL.md
   - 错误处理采用非阻塞式

---

## Technical Research

### 1. Python colorama Library

**Installation:**
```bash
pip install colorama
```

**Basic Usage:**
```python
from colorama import init, Fore, Back, Style

# Initialize for Windows compatibility
init(autoreset=True)

# Colored output
print(Fore.RED + '[ERROR]' + Fore.RESET + ' Sensitive information detected')
print(Fore.YELLOW + '[WARNING]' + Fore.RESET + ' Cache file detected')
print(Fore.BLUE + '[INFO]' + Fore.RESET + ' Scan completed')
```

**Windows Compatibility:**
- colorama 自动处理 Windows CMD/PowerShell 的 ANSI 转义序列
- `init(autoreset=True)` 确保每次 print 后自动重置颜色
- 无需手动处理平台差异

**Terminal Detection:**
```python
import sys
from colorama import init

# Detect if stdout is a TTY
if sys.stdout.isatty():
    init(autoreset=True)
    use_colors = True
else:
    use_colors = False
```

**Performance:**
- colorama 初始化开销很小(~1-2ms)
- 不影响 Phase 9 的性能基准(16.77ms)

### 2. Bilingual Support Patterns

**Dictionary-based Translation:**
```python
MESSAGES = {
    'en': {
        'error_sensitive': '[ERROR] Sensitive information detected',
        'warning_cache': '[WARNING] Cache file detected',
        'scan_complete': 'Security scan completed. No issues found.',
        'help_lang': 'Use --lang zh/en to switch language'
    },
    'zh': {
        'error_sensitive': '[错误] 检测到敏感信息',
        'warning_cache': '[警告] 检测到缓存文件',
        'scan_complete': '安全扫描完成。未发现问题。',
        'help_lang': '使用 --lang zh/en 切换语言'
    }
}

def get_message(key, lang='zh'):
    return MESSAGES.get(lang, MESSAGES['zh']).get(key, key)
```

**Command-line Argument:**
```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--lang', choices=['zh', 'en'], default='zh',
                    help='Language for messages (zh/en)')
args = parser.parse_args()
```

**Scope:**
- 翻译范围限定在用户可见的提示信息
- 代码注释、日志、文档保持英文
- 错误类型、规则 ID 保持英文(便于搜索和调试)

### 3. Severity Levels Architecture

**Current State:**
所有问题都是 `severity='high'`(error 级别)

**Extension for Warning:**
```python
from enum import Enum

class Severity(Enum):
    ERROR = 'error'    # Blocks commit
    WARNING = 'warning' # Shows warning but allows commit

# In detector rules
def detect_api_key(content):
    issues = []
    for match in pattern.finditer(content):
        issues.append({
            'type': 'SENSITIVE',
            'severity': Severity.ERROR,  # Default to ERROR
            'message': 'API key detected',
            # ...
        })
    return issues
```

**Report Formatting:**
```python
def format_issue(issue, lang='zh', use_colors=True):
    severity = issue['severity']

    if severity == Severity.ERROR:
        prefix = '[ERROR]' if lang == 'en' else '[错误]'
        color = Fore.RED if use_colors else ''
    else:  # WARNING
        prefix = '[WARNING]' if lang == 'en' else '[警告]'
        color = Fore.YELLOW if use_colors else ''

    message = get_message(issue['message_key'], lang)

    if use_colors:
        return f"{color}{prefix}{Style.RESET_ALL} {message}"
    else:
        return f"{prefix} {message}"
```

**Blocking Logic:**
```python
def should_block_commit(issues):
    """Block commit if any ERROR severity issues found"""
    return any(issue['severity'] == Severity.ERROR for issue in issues)
```

**Phase 10 Scope:**
- 所有当前检测规则保持 ERROR 级别
- 架构上支持 WARNING 级别(为未来扩展准备)
- 输出格式支持显示 severity 标记

### 4. Integration Points

**Files to Modify:**

1. **`scanner.py`:**
   - Add `--lang` argument
   - Add `--no-color` argument (disable colors)
   - Initialize colorama
   - Use severity-aware formatting
   - Add bilingual messages

2. **`reporter.py`:**
   - Update `format_issue()` to support colors and severity
   - Add severity-aware `should_block_commit()`
   - Update summary report formatting

3. **`detectors/`:**
   - No changes needed (already have severity='high')
   - Future: could add warning-level rules

4. **`hooks/pre-commit`:**
   - Pass `--lang` argument if configured
   - Handle colored output in Git context

5. **`SKILL.md`:**
   - Document `--lang` parameter
   - Document `--no-color` parameter
   - Update examples with bilingual output

**Backward Compatibility:**
- Default language: `zh` (matches project CLAUDE.md)
- Default colors: enabled (auto-detect terminal)
- All existing rules remain ERROR severity
- No breaking changes to existing behavior

### 5. Testing Strategy

**Test Cases:**

1. **Color Output:**
   - ✓ Error messages show in red
   - ✓ Warning messages show in yellow
   - ✓ Info messages show in blue/green
   - ✓ Auto-detect works in CMD/PowerShell/Git Bash
   - ✓ Graceful degradation when redirected to file

2. **Bilingual Support:**
   - ✓ `--lang zh` shows Chinese messages
   - ✓ `--lang en` shows English messages
   - ✓ Default language is Chinese
   - ✓ Invalid language falls back to Chinese
   - ✓ All user-facing messages translated

3. **Severity Levels:**
   - ✓ ERROR severity shows [ERROR] prefix
   - ✓ WARNING severity shows [WARNING] prefix
   - ✓ ERROR severity blocks commit
   - ✓ WARNING severity allows commit (future feature)

4. **Integration:**
   - ✓ Works with pre-commit hook
   - ✓ Works with SKILL.md workflow
   - ✓ Performance still < 2s (colorama overhead minimal)

**Test Files:**
- Use existing test fixtures from Phase 9
- Add language-specific assertions
- Add color output assertions (mock colorama for testing)

### 6. Documentation Updates

**SKILL.md Additions:**

```markdown
**Language Support:**

Control scanner language with --lang parameter:

\`\`\`bash
# Chinese (default)
python scanner.py --lang zh

# English
python scanner.py --lang en
\`\`\`

**Color Output:**

Scanner uses colored output by default. Disable with --no-color:

\`\`\`bash
python scanner.py --no-color
\`\`\`

**Severity Levels:**

- **ERROR** (red): Blocks commit, must be resolved or whitelisted
- **WARNING** (yellow): Shows warning, future feature for non-critical issues
```

**README Updates:**
- Update feature list with bilingual support
- Update feature list with color output
- Update screenshots/examples with colored output

---

## Implementation Recommendations

### Priority 1: Color Output (UX-03)

**Reason:** Foundation for severity levels, high visual impact

**Changes:**
1. Add colorama to requirements (or note in README)
2. Initialize colorama in `scanner.py`
3. Update `reporter.py` to use colored output
4. Add `--no-color` argument
5. Test on Windows CMD/PowerShell/Git Bash

**Estimated Effort:** 1-2 hours

### Priority 2: Bilingual Support (UX-04)

**Reason:** Direct user value, matches project language

**Changes:**
1. Create `messages.py` with translation dictionary
2. Add `--lang` argument to `scanner.py`
3. Replace all hardcoded user messages with `get_message()`
4. Update SKILL.md with language parameter docs
5. Test both languages

**Estimated Effort:** 2-3 hours

### Priority 3: Severity Levels (UX-01)

**Reason:** Future-proofing, preparation for warning-level rules

**Changes:**
1. Add `Severity` enum to `scanner.py`
2. Update `format_issue()` to show severity prefix
3. Update `should_block_commit()` to check severity
4. All current rules remain ERROR (no behavior change)
5. Document severity levels in SKILL.md

**Estimated Effort:** 1-2 hours

### Priority 4: Production Validation

**Reason:** Ensure real-world usability

**Changes:**
1. Test on work-skills repository with various file types
2. Verify performance still meets < 2s requirement
3. Verify error handling is non-blocking
4. Update SKILL.md with final examples
5. Create usage screenshots (optional)

**Estimated Effort:** 1-2 hours

---

## Potential Pitfalls

### 1. Colorama Installation

**Pitfall:** colorama is not in Python standard library, requires installation

**Solution:**
- Document in README: `pip install colorama`
- Or bundle colorama source (not recommended, adds complexity)
- Or use sys.stdout.isatty() fallback without colors if colorama unavailable

**Recommendation:** Document as dependency, keep simple

### 2. Windows Console Encoding

**Pitfall:** Windows CMD default encoding may not support Chinese characters

**Solution:**
- colorama handles this via `init()`
- Test on fresh Windows install with default settings
- Add encoding check: `sys.stdout.encoding.lower()`

**Recommendation:** Test on Windows 10+ default CMD, add encoding fallback if needed

### 3. Git Bash Color Support

**Pitfall:** Git Bash may have different color support than CMD

**Solution:**
- colorama abstracts platform differences
- Test in Git Bash for Windows
- Use `TERM` environment variable check if needed

**Recommendation:** Rely on colorama, test in Git Bash

### 4. Translation Completeness

**Pitfall:** Missing translations for new messages added later

**Solution:**
- Use message keys, not hardcoded strings
- Add translation checklist in code comments
- Default to Chinese if key missing

**Recommendation:** Create comprehensive message dictionary upfront

### 5. Performance Impact

**Pitfall:** Colorama initialization or translation lookups add latency

**Solution:**
- Initialize colorama once at startup
- Use dictionary lookup (O(1)) for translations
- Benchmark before/after to verify < 2s requirement

**Recommendation:** Benchmark early, optimize if needed

### 6. Breaking Changes

**Pitfall:** Changes to reporter output break existing tests or integrations

**Solution:**
- Add `--no-color` to restore plain text output
- Keep message structure similar (just add color codes)
- Update all tests to expect colored output (or use --no-color in tests)

**Recommendation:** Add --no-color flag, update tests

---

## Architecture Decisions

### Decision 1: Use colorama vs ANSI codes directly

**Choice:** colorama

**Rationale:**
- Cross-platform compatibility (handles Windows automatically)
- Simple API (Fore.RED, Fore.YELLOW, etc.)
- Auto-reset feature prevents color bleeding
- Widely used, well-maintained

**Alternatives:**
- Manual ANSI codes: Requires platform detection, error-prone on Windows
- termcolor: Another option, but colorama more popular
- rich: Overkill for this use case

### Decision 2: Translation dictionary vs gettext

**Choice:** Dictionary-based

**Rationale:**
- Simple implementation, no external tools
- Small scope (only user messages)
- Easy to maintain in single file
- No .po/.mo file complexity

**Alternatives:**
- Python gettext: Overkill for 2 languages, small message set
- External translation files: Adds complexity, harder to maintain

### Decision 3: Default language

**Choice:** Chinese (zh)

**Rationale:**
- Matches project CLAUDE.md directive (use Chinese)
- Target users are Chinese developers
- Can be overridden with --lang en

**Alternatives:**
- English (en): Common default, but doesn't match project language
- Auto-detect from system locale: Complex, error-prone

### Decision 4: Severity for existing rules

**Choice:** All existing rules remain ERROR

**Rationale:**
- No behavior change from Phase 6-9
- Security issues should block commit by default
- WARNING level reserved for future non-critical rules

**Alternatives:**
- Make some rules WARNING: Changes behavior, needs user validation
- User-configurable severity: Adds complexity, out of scope

---

## Plan Structure Recommendation

Based on this research, I recommend structuring Phase 10 into **2 plans**:

### Plan 1: Color Output & Severity Levels (Wave 1)

**Scope:**
- Add colorama integration
- Implement colored output for errors/warnings
- Add severity level architecture
- Add --no-color argument

**Requirements:** UX-01 (partial), UX-03

**Estimated Time:** 2-3 hours

### Plan 2: Bilingual Support & Production Polish (Wave 2)

**Scope:**
- Add translation dictionary
- Implement --lang argument
- Update all user messages
- Update SKILL.md documentation
- Production validation on work-skills repo
- Final testing and documentation

**Requirements:** UX-01 (complete), UX-04

**Estimated Time:** 3-4 hours

**Dependency:** Plan 2 depends on Plan 1 (needs severity levels and color infrastructure)

---

## Open Questions

### Question 1: colorama Dependency

Should colorama be:
- A) Documented in README as required dependency
- B) Bundled with the scanner (colorama source included)
- C) Optional with graceful fallback (no colors if not installed)

**Recommendation:** Option A (document as dependency)

### Question 2: Translation Maintenance

Should translations be:
- A) All in one `messages.py` file
- B) Separate files per language (`messages_zh.py`, `messages_en.py`)
- C) External JSON/YAML files

**Recommendation:** Option A (single file, simple to maintain)

### Question 3: Severity Display

Should severity level be shown:
- A) Only in prefix ([ERROR], [WARNING])
- B) In prefix and separate column in table
- C) Only for errors, not for warnings (to reduce noise)

**Recommendation:** Option A (prefix only, clean and simple)

### Question 4: Language Detection

Should scanner:
- A) Always default to Chinese (--lang to override)
- B) Try to detect system language, fallback to Chinese
- C) Save last used language in config file

**Recommendation:** Option A (explicit default, no magic)

---

## Summary

Phase 10 focuses on UX polish to make the scanner production-ready:

1. **Color Output (UX-03):** Use colorama for cross-platform colored output (error=red, warning=yellow)
2. **Bilingual Support (UX-04):** Dictionary-based translation with --lang zh/en argument
3. **Severity Levels (UX-01):** Architecture for error/warning distinction (all current rules remain ERROR)
4. **Production Validation:** Test on real project, verify performance, update docs

**Key Technical Choices:**
- colorama for cross-platform color support
- Dictionary-based translation (simple, maintainable)
- Chinese as default language (matches project)
- All existing rules stay ERROR severity (no behavior change)
- Non-breaking changes (--no-color, --lang arguments)

**Estimated Total Effort:** 5-7 hours across 2 plans

**Risk Level:** Low (no new detection logic, pure UX improvements)

---

## Research Complete

✓ Technical options evaluated
✓ Implementation approach defined
✓ Architecture decisions made
✓ Potential pitfalls identified
✓ Plan structure recommended

**Ready for planning.**
