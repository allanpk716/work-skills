# Phase 11: Fix Orphaned Security Rules - Research

**Researched:** 2026-02-26
**Domain:** Git security scanner rule integration
**Confidence:** HIGH

## Summary

本阶段是一个 Gap Closure phase,修复审计发现的集成差距。PGP 私钥检测规则(PGP_KEY_RULE, SENS-05)和 PEM 证书检测规则(PEM_CERT_RULE, SENS-06)已在 Phase 6 中实现并导出,但在 executor.py 扫描流程中未被激活使用。这是一个简单的集成问题,需要将现有规则添加到扫描流程的敏感信息规则列表中。

研究重点是验证规则实现正确性、确认测试策略、了解现有扫描架构,确保修复方案与现有代码风格一致。

**Primary recommendation:** 直接在 executor.py 中添加 PGP_KEY_RULE 和 PEM_CERT_RULE 到 imports 和 sensitive_rules 列表,遵循 SSH_KEY_RULE 的集成模式,添加针对性测试用例验证检测功能。

<user_constraints>

## User Constraints (from CONTEXT.md)

本阶段是 Gap Closure phase,没有 CONTEXT.md 文件。以下约束来自 ROADMAP.md 和审计报告:

### Locked Decisions

**Gap 描述:**
- PGP_KEY_RULE 已在 secrets.py 中实现,在 rules/__init__.py 中导出
- PEM_CERT_RULE 已在 secrets.py 中实现,在 rules/__init__.py 中导出
- 两个规则都未在 executor.py 中导入和使用
- 导致 PGP 私钥和 PEM 证书在 git commit 时无法被检测

**修复目标:**
- 确保 PGP 私钥检测功能(SENS-05)正常工作
- 确保 PEM 证书检测功能(SENS-06)正常工作
- 所有敏感信息规则在扫描流程中统一激活
- 添加测试验证修复效果

**修复范围:**
- 仅修改 executor.py 文件(导入和使用规则)
- 可选:添加针对性测试用例
- 不修改规则实现(secrets.py)
- 不修改规则导出(rules/__init__.py)

### Claude's Discretion

- 测试策略:添加新的测试用例还是使用现有测试框架
- 测试文件位置:tests/ 目录或 tmp/ 目录
- 验证方法:单元测试 + 集成测试或仅集成测试
- 文档更新:是否需要更新 SKILL.md 的检测列表说明

### Deferred Ideas (OUT OF SCOPE)

- 优化正则表达式性能 — 规则已实现且性能良好
- 添加更多私钥格式检测 — 超出 SENS-05/SENS-06 范围
- 修改规则严重性分级 — Phase 10 已完成
- 重构扫描架构 — 超出 gap closure 范围

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SENS-05 | 检测 PGP 私钥文件 (-----BEGIN PGP PRIVATE KEY BLOCK-----) | 标准格式匹配,简单字符串包含检测。规则已在 secrets.py 中实现,正则模式已验证。 |
| SENS-06 | 检测 PEM 证书文件 (-----BEGIN CERTIFICATE-----) | 标准格式匹配,简单字符串包含检测。规则已在 secrets.py 中实现,正则模式已验证。 |

**Requirements Traceability:**
- SENS-05 和 SENS-06 原计划在 Phase 6 中实现
- Phase 6 实现了规则定义但遗漏了集成步骤
- Phase 11 作为 Gap Closure phase 修复集成差距
- 修复后 Phase 6 的 VERIFICATION.md 中的 SENS-05/SENS-06 验证才能真正通过

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.8+ | 核心运行环境 | Windows 预装,项目已使用 |
| re | 标准库 | 正则表达式匹配 | 已用于所有检测规则,性能优异 |
| pytest | 7.x | 测试框架 | 项目已有测试基础设施(tests/conftest.py) |

### Existing Infrastructure

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| PGP_KEY_RULE | scanner/rules/secrets.py | PGP 私钥检测规则 | ✅ 已实现,未激活 |
| PEM_CERT_RULE | scanner/rules/secrets.py | PEM 证书检测规则 | ✅ 已实现,未激活 |
| SSH_KEY_RULE | scanner/rules/secrets.py | SSH 私钥检测规则 | ✅ 已实现且已激活(参考模式) |
| executor.py | scanner/executor.py | 扫描执行器 | 需要添加导入和使用 |
| sensitive_rules | executor.py 第 133-139 行 | 敏感信息规则列表 | 需要添加 PGP 和 PEM 规则 |

### Test Infrastructure

| Component | Location | Purpose | Notes |
|-----------|----------|---------|-------|
| conftest.py | tests/conftest.py | 测试 fixtures | 提供 small_repo, medium_repo 等 fixtures |
| test_performance.py | tests/test_performance.py | 性能测试 | 包含 regex pattern matching 测试 |
| test_windows_compat.py | tests/test_windows_compat.py | Windows 兼容性测试 | 可参考测试模式 |
| tmp/test_*.py | tmp/ | 临时测试文件 | Phase 8-10 使用过的临时测试位置 |

**Installation:**
无需额外安装,所有依赖已存在。

## Architecture Patterns

### Current Scan Workflow (executor.py)

```python
# Step 1: Import rules (第 11-29 行)
from scanner.rules import (
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,  # ← 已激活
    # PGP_KEY_RULE,  ← 缺失
    # PEM_CERT_RULE, ← 缺失
)

# Step 2: Build sensitive_rules list (第 133-139 行)
sensitive_rules = [
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,  # ← 已激活
    # PGP_KEY_RULE,  ← 缺失
    # PEM_CERT_RULE, ← 缺失
]

# Step 3: Apply rules (第 141-167 行)
for rule in sensitive_rules:
    matches = rule.pattern.finditer(content)
    for match in matches:
        # Create issue report
```

### Pattern 1: Rule Import Pattern

**What:** 统一从 scanner.rules 导入所有检测规则
**When to use:** 在需要使用规则的文件顶部
**Example:**
```python
# Source: scanner/executor.py 现有模式
from scanner.rules import (
    # Sensitive data rules
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,
    PGP_KEY_RULE,      # ← 添加
    PEM_CERT_RULE,     # ← 添加
)
```

**Why this pattern:**
- 遵循现有代码风格
- 所有敏感信息规则统一导入位置
- 便于维护和扩展

### Pattern 2: Rule Application Pattern

**What:** 将规则添加到 sensitive_rules 列表
**When to use:** 在内容扫描逻辑中
**Example:**
```python
# Source: scanner/executor.py 第 133-139 行
sensitive_rules = [
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,
    PGP_KEY_RULE,      # ← 添加
    PEM_CERT_RULE,     # ← 添加
]
```

**Why this pattern:**
- 与 SSH_KEY_RULE 保持一致的激活方式
- 规则自动通过 for 循环应用到文件内容
- 无需额外的检测逻辑

### Anti-Patterns to Avoid

- **分别处理 PGP/PEM 规则:** 不要创建特殊的 if 分支,应该加入统一的 sensitive_rules 列表
- **修改规则定义:** 规则已在 secrets.py 中正确实现,不需要修改正则表达式
- **修改规则导出:** rules/__init__.py 已正确导出规则,无需修改
- **创建新的扫描路径:** 使用现有的 sensitive_rules 循环机制

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 规则应用逻辑 | 特殊的 PGP/PEM 检测分支 | sensitive_rules 列表 | 现有循环机制已处理所有规则类型 |
| 测试框架 | 自定义测试脚本 | pytest + conftest.py | 项目已有测试基础设施 |
| 测试数据 | 手动创建 PGP/PEM 文件 | 简化的测试字符串 | PGP/PEM 格式标准,只需标记行即可 |
| Issue 创建 | 自定义 issue 对象 | create_issue() | 现有 reporter.py 已提供 |

**Key insight:** 这是一个集成 gap,不是功能缺失。规则实现正确,只需激活使用。

## Common Pitfalls

### Pitfall 1: 修改错误的文件

**What goes wrong:** 尝试修改 secrets.py 或 rules/__init__.py
**Why it happens:** 误认为规则未实现或未导出
**How to avoid:**
- 检查规则实现: `grep -n "PGP_KEY_RULE" scanner/rules/secrets.py` (第 94-98 行)
- 检查规则导出: `grep -n "PGP_KEY_RULE" scanner/rules/__init__.py` (第 12, 69 行)
- 确认只在 executor.py 中添加导入和使用

**Warning signs:** 发现自己在编辑 secrets.py 文件

### Pitfall 2: 忘记添加到 sensitive_rules 列表

**What goes wrong:** 只添加了 import 但忘记在 sensitive_rules 列表中使用
**Why it happens:** 误以为导入后自动激活
**How to avoid:**
- 检查 executor.py 第 133-139 行的 sensitive_rules 列表
- 确保 PGP_KEY_RULE 和 PEM_CERT_RULE 都在列表中
- 参考 SSH_KEY_RULE 的集成方式

**Warning signs:** 导入成功但测试仍然失败

### Pitfall 3: 测试用例过于复杂

**What goes wrong:** 尝试生成真实的 PGP 私钥或 PEM 证书文件
**Why it happens:** 误认为需要完整的密钥/证书内容
**How to avoid:**
- PGP/PEM 检测只需标记行 `-----BEGIN ... -----`
- 使用简化的测试字符串,如 `"-----BEGIN PGP PRIVATE KEY BLOCK-----"`
- 参考 SSH_KEY_RULE 的测试方式

**Warning signs:** 测试文件包含大量 base64 编码内容

### Pitfall 4: 遗漏测试验证

**What goes wrong:** 修改后不添加测试,依赖手动验证
**Why it happens:** 认为 gap closure 不需要新测试
**How to avoid:**
- 添加至少一个测试用例验证 PGP 检测
- 添加至少一个测试用例验证 PEM 检测
- 可使用现有的 pytest 框架或 tmp/ 目录临时测试

**Warning signs:** 修复后没有自动化验证

## Code Examples

Verified patterns from existing codebase:

### SSH Key Rule Integration (Reference Pattern)

```python
# Source: scanner/rules/secrets.py 第 86-91 行
SSH_KEY_RULE = DetectionRule.create(
    rule_id="SENS-04",
    description="检测 SSH 私钥文件",
    pattern=r'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----',
    tags=["ssh", "private-key", "critical"]
)
```

```python
# Source: scanner/executor.py 第 11-18 行
from scanner.rules import (
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,  # ← 参考:已激活的私钥检测规则
)
```

```python
# Source: scanner/executor.py 第 133-139 行
sensitive_rules = [
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,  # ← 参考:已激活的私钥检测规则
]
```

### PGP and PEM Rule Definitions (Already Implemented)

```python
# Source: scanner/rules/secrets.py 第 93-107 行
PGP_KEY_RULE = DetectionRule.create(
    rule_id="SENS-05",
    description="检测 PGP 私钥文件",
    pattern=r'-----BEGIN PGP PRIVATE KEY BLOCK-----',
    tags=["pgp", "private-key", "critical"]
)

PEM_CERT_RULE = DetectionRule.create(
    rule_id="SENS-06",
    description="检测 PEM 证书文件",
    pattern=r'-----BEGIN CERTIFICATE-----',
    tags=["pem", "certificate", "medium-priority"]
)
```

### Expected Fix Pattern

```python
# scanner/executor.py 第 11-29 行 (修改后)
from scanner.rules import (
    # Sensitive data rules
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,
    PGP_KEY_RULE,      # ← 添加
    PEM_CERT_RULE,     # ← 添加

    # Cache/config rules
    is_cache_file,
    is_config_file,
    scan_config_content,

    # Phase 8: Internal info detection
    PRIVATE_IP_RULE,
    INTERNAL_DOMAIN_RULE,
    EMAIL_RULE,
    should_report_email,
)
```

```python
# scanner/executor.py 第 133-141 行 (修改后)
sensitive_rules = [
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,
    PGP_KEY_RULE,      # ← 添加
    PEM_CERT_RULE,     # ← 添加
]
```

### Test Example Pattern

```python
# Source: tests/test_performance.py 的测试模式
def test_pgp_key_detection():
    """Test PGP private key detection (SENS-05)"""
    from scanner.rules import PGP_KEY_RULE

    content = """-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: GnuPG v1

fake_key_content_here
-----END PGP PRIVATE KEY BLOCK-----"""

    matches = list(PGP_KEY_RULE.pattern.finditer(content))
    assert len(matches) == 1, "Should detect PGP private key"
    assert "PGP PRIVATE KEY BLOCK" in matches[0].group(0)

def test_pem_cert_detection():
    """Test PEM certificate detection (SENS-06)"""
    from scanner.rules import PEM_CERT_RULE

    content = """-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKN7MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END CERTIFICATE-----"""

    matches = list(PEM_CERT_RULE.pattern.finditer(content))
    assert len(matches) == 1, "Should detect PEM certificate"
    assert "BEGIN CERTIFICATE" in matches[0].group(0)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 6 实现规则但未集成 | Gap closure phase 修复集成 | 2026-02-26 audit | 确保所有规则生效 |
| 分散的规则激活 | 统一的 sensitive_rules 列表 | Phase 7 | 简化规则管理 |

**Deprecated/outdated:**
- 无,现有架构设计良好,只是遗漏了集成步骤

## Open Questions

1. **测试文件位置选择**
   - What we know: 项目有 tests/ 目录(正式测试)和 tmp/ 目录(临时测试)
   - What's unclear: Gap closure phase 应该使用哪种测试方式
   - Recommendation: 添加到 tests/test_security_rules.py(新建),作为正式测试用例,确保未来不会再次遗漏

2. **集成测试 vs 单元测试**
   - What we know: 现有测试包含性能测试和兼容性测试
   - What's unclear: PGP/PEM 检测需要哪种测试级别
   - Recommendation: 先添加单元测试(规则匹配测试),再添加集成测试(executor.py 扫描测试),两层验证

3. **SKILL.md 文档更新**
   - What we know: SKILL.md 已列出 PGP private keys 和 PEM certificates
   - What's unclear: 修复后是否需要更新文档
   - Recommendation: 检查文档描述是否准确,如有误导性描述则更新,否则保持不变

## Validation Architecture

> workflow.nyquist_validation 未在 config.json 中设置,跳过此部分。

## Sources

### Primary (HIGH confidence)

- scanner/rules/secrets.py - 规则实现代码(第 93-107 行)
- scanner/rules/__init__.py - 规则导出代码(第 12-13, 69-70 行)
- scanner/executor.py - 扫描执行器代码(第 11-29, 133-167 行)
- .planning/v1.1-MILESTONE-AUDIT.md - 审计报告(gap 分析)
- .planning/ROADMAP.md - Phase 11 定义
- .planning/REQUIREMENTS.md - SENS-05/SENS-06 需求定义

### Secondary (MEDIUM confidence)

- tests/conftest.py - 测试框架配置
- tests/test_performance.py - 测试模式参考
- plugins/windows-git-commit/skills/windows-git-commit/SKILL.md - 功能文档

### Tertiary (LOW confidence)

- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 所有组件已存在并正常工作
- Architecture: HIGH - 现有扫描架构清晰,集成模式明确
- Pitfalls: HIGH - 基于 Phase 6-10 的经验总结,常见错误已识别

**Research date:** 2026-02-26
**Valid until:** 30 days (stable architecture, no planned refactoring)

**修复工作量估算:**
- 代码修改: 5-10 分钟(添加 2 行 import + 2 行规则列表)
- 测试编写: 15-20 分钟(单元测试 + 集成测试)
- 测试验证: 5-10 分钟(运行测试,验证检测功能)
- 文档更新: 0-5 分钟(可选,检查 SKILL.md)
- **总计: 25-45 分钟**

**关键发现:**
1. ✅ 规则已正确实现(PGP_KEY_RULE, PEM_CERT_RULE)
2. ✅ 规则已正确导出(rules/__init__.py)
3. ❌ 规则未在 executor.py 中导入
4. ❌ 规则未添加到 sensitive_rules 列表
5. 💡 参考 SSH_KEY_RULE 的集成模式
6. 💡 遵循现有的 sensitive_rules 循环机制
7. ⚠️ 需要添加测试防止未来再次遗漏
