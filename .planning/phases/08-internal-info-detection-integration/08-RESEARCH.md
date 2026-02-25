# Phase 8: Internal Info Detection & Integration - Research

**Researched:** 2026-02-25
**Domain:** 内部信息检测(内网 IP、内部域名、邮箱地址)、白名单机制、技能集成
**Confidence:** HIGH

## Summary

Phase 8 为安全扫描器添加内部信息检测功能和白名单机制,并将扫描功能完整集成到 windows-git-commit 技能中。核心任务包括:1) 检测内网 IP 地址(RFC 1918 私有地址); 2) 检测内部域名(*.internal, *.local, *.corp 等); 3) 检测邮箱地址泄露; 4) 实现基于注释的白名单机制; 5) 集成到 SKILL.md 并自动启用扫描。技术栈沿用 Python 标准库 + 现有 scanner 架构,无需新依赖。

**Primary recommendation:** 使用正则表达式检测私有 IP 和内部域名,遵循 RFC 1918 和 ICANN 保留域名规范。白名单采用行内注释标记语法(# gitcheck:ignore-*),与 .gitignore 和代码注释无缝集成。集成方式为自动启用,扫描失败时允许提交继续(非阻塞)以避免影响开发流程。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (必须遵循)

#### 白名单配置方式
- 使用特殊注释标记语法(而非独立配置文件或 YAML)
- 支持四种标记类型:
  - 忽略整行:`# gitcheck:ignore-line`
  - 忽略整个文件:`# gitcheck:ignore-file`
  - 忽略特定规则:`# gitcheck:ignore-rule:INTL-01`
  - 忽略某类检测:`# gitcheck:ignore-all-ips`(只忽略 IP 检测)
- 配置位置:
  - .gitignore 文件(项目级和全局级)
  - 代码行内注释(在代码文件中)
  - 文件头部标记(在文档或配置文件开头)
- 冲突处理:标记语法错误时显示警告但继续扫描该文件/行

#### 检测严格度
- 检测所有匹配规则的内部信息,包括文档中的示例地址
- 由用户通过白名单控制误报,确保安全优先
- 内网 IP 范围:检测所有私有地址(10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- 内部域名检测范围:
  - 标准内部域名:*.internal, *.local, *.corp, *.intranet
  - 局域网扩展域名:*.lan, *.home, *.private
  - 测试用域名:*.test, *.example, *.invalid
  - 支持自定义域名后缀(用户可配置)
- 上下文判断:严格匹配,不考虑代码上下文(注释、字符串等)

#### 技能集成方式
- 自动启用:用户使用 windows-git-commit 技能时自动执行安全扫描,无需额外配置
- 扫描失败处理:如果扫描器本身出错(非检测到问题),显示警告但继续执行 git commit
- SKILL.md 配置项:只暴露启用/禁用开关,其他参数保持简单
- 错误级别:所有内部信息(IP、域名、邮箱)都作为错误级别,必须处理或添加白名单

#### 邮箱检测策略
- 检测范围:检测所有邮箱地址格式(xxx@yyy.zzz)
- 排除规则:
  - 支持排除已知公开邮箱(如 noreply@github.com, support@example.com)
  - 支持排除示例邮箱(如 test@example.com, user@domain.com)
  - 也支持无排除规则模式(完全由用户通过白名单控制)
- 上下文场景:检测所有场景中的邮箱
  - 代码注释中的邮箱
  - 字符串字面量中的邮箱(如 `email = "user@example.com"`)
  - URL 中的邮箱(如 `mailto:user@example.com`)
  - JSON/YAML 配置文件中的邮箱字段
- 报告级别:错误级别(与其他内部信息一致)

### Claude's Discretion (可自由决策)

- 白名单标记的优先级规则(当同时存在多个标记时的处理)
- 邮箱检测的内置排除列表与用户自定义排除列表的合并策略
- 自定义域名后缀的配置文件位置和格式
- 错误消息的具体文案和示例

### Deferred Ideas (OUT OF SCOPE)

None

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTL-01 | 检测内网 IP 地址 (10.x.x.x, 172.16-31.x.x, 192.168.x.x) | 使用 RFC 1918 私有地址正则表达式,结合现有 DetectionRule 架构 |
| INTL-02 | 检测内部域名 (*.internal, *.local, *.corp, *.intranet) | 使用域名后缀匹配正则,包含 ICANN 保留域名和常见内网域名 |
| INTL-03 | 检测邮箱地址 (用于识别可能的内部邮箱泄露) | 使用简化版 RFC 5322 邮箱正则,支持排除列表 |
| CUST-03 | 支持在 .gitignore 中添加扫描白名单(使用注释标记) | 解析 .gitignore 和代码文件中的 `# gitcheck:ignore-*` 注释 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.8+ | 运行时环境 | Windows 预装,与 Phase 6/7 一致 |
| re (stdlib) | - | 正则表达式匹配 | 私有 IP、内部域名、邮箱检测 |
| pathlib (stdlib) | - | 文件路径处理 | 与现有 scanner 架构一致 |
| typing (stdlib) | - | 类型注解 | 代码质量,与 Phase 6 一致 |
| dataclasses (stdlib) | - | 数据结构 | DetectionRule 复用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pathspec | 0.12+ | .gitignore 解析 | 白名单标记解析(已安装) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 正则表达式检测 | ipaddress 库解析 IP | 正则更灵活,可处理文档中的非规范 IP,ipaddress 严格验证反而不适合 |
| 完整 RFC 5322 邮箱正则 | 简化邮箱正则 | 简化版覆盖 99% 场景,完整版过于复杂且难以维护 |
| 独立白名单配置文件 | 行内注释标记 | 行内注释更直观,无需额外文件,与代码上下文紧密关联 |

**Installation:**
无需安装新依赖,复用 Phase 6/7 已安装的库

## Architecture Patterns

### Recommended Project Structure
```
plugins/windows-git-commit/skills/windows-git-commit/
├── scanner/
│   ├── rules/
│   │   ├── internal_info.py     # Phase 8: 内部信息检测规则 (新建)
│   │   └── whitelist.py         # Phase 8: 白名单解析器 (新建)
│   ├── executor.py              # Phase 7: 执行流程 (更新:添加内部信息检测)
│   └── reporter.py              # Phase 7: 报告生成器 (无需修改)
└── SKILL.md                     # 技能文档 (更新:添加扫描配置)
```

### Pattern 1: 内部信息检测规则
**What:** 使用 DetectionRule 定义内部 IP、域名、邮箱的检测模式
**When to use:** 扫描暂存文件内容时

**Example:**
```python
# File: scanner/rules/internal_info.py
from dataclasses import dataclass
from typing import Pattern, List
import re

@dataclass
class DetectionRule:
    rule_id: str
    description: str
    pattern: Pattern[str]
    tags: List[str]

    @classmethod
    def create(cls, rule_id: str, description: str,
               pattern: str, tags: List[str]) -> 'DetectionRule':
        return cls(
            rule_id=rule_id,
            description=description,
            pattern=re.compile(pattern, re.IGNORECASE | re.MULTILINE),
            tags=tags
        )

# INTL-01: 私有 IP 地址检测 (RFC 1918)
# A类: 10.0.0.0 - 10.255.255.255 (10/8 prefix)
# B类: 172.16.0.0 - 172.31.255.255 (172.16/12 prefix)
# C类: 192.168.0.0 - 192.168.255.255 (192.168/16 prefix)
PRIVATE_IP_RULE = DetectionRule.create(
    rule_id="INTL-01",
    description="检测私有 IP 地址",
    pattern=(
        r'\b('
        r'10\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # A类: 10.x.x.x
        r'172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|'  # B类: 172.16-31.x.x
        r'192\.168\.\d{1,3}\.\d{1,3}'  # C类: 192.168.x.x
        r')\b'
    ),
    tags=["internal", "ip", "rfc1918"]
)

# INTL-02: 内部域名检测
# 包括 ICANN 保留域名和常见内网域名
INTERNAL_DOMAIN_RULE = DetectionRule.create(
    rule_id="INTL-02",
    description="检测内部域名",
    pattern=(
        r'\b([a-zA-Z0-9][-a-zA-Z0-9]{0,61}[a-zA-Z0-9]\.'
        r'(?:internal|local|corp|intranet|lan|home|private|test|example|invalid)'
        r')\b'
    ),
    tags=["internal", "domain", "icann-reserved"]
)

# INTL-03: 邮箱地址检测 (简化版 RFC 5322)
# 检测格式: xxx@yyy.zzz
EMAIL_RULE = DetectionRule.create(
    rule_id="INTL-03",
    description="检测邮箱地址",
    pattern=(
        r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
    ),
    tags=["internal", "email", "pii"]
)

# 邮箱排除列表(公开邮箱和示例邮箱)
PUBLIC_EMAIL_DOMAINS = {
    'github.com', 'gitlab.com', 'bitbucket.org',
    'example.com', 'test.com', 'domain.com',
    'localhost', 'local'
}
```

### Pattern 2: 白名单注释解析
**What:** 解析代码和 .gitignore 中的 `# gitcheck:ignore-*` 注释
**When to use:** 扫描文件前,判断是否跳过某些检测

**Example:**
```python
# File: scanner/rules/whitelist.py
from dataclasses import dataclass
from typing import Set, Optional, List
import re

@dataclass
class WhitelistDirective:
    """白名单指令"""
    directive_type: str  # ignore-line, ignore-file, ignore-rule, ignore-all-ips
    rule_id: Optional[str] = None  # 仅 ignore-rule 使用
    line_number: Optional[int] = None  # 仅 ignore-line 使用

def parse_whitelist_comments(content: str, file_path: str) -> List[WhitelistDirective]:
    """
    解析文件中的白名单注释

    支持的注释格式:
    - # gitcheck:ignore-line        (忽略当前行)
    - # gitcheck:ignore-file        (忽略整个文件)
    - # gitcheck:ignore-rule:INTL-01 (忽略特定规则)
    - # gitcheck:ignore-all-ips     (忽略所有 IP 检测)

    返回: 白名单指令列表
    """
    directives = []
    lines = content.split('\n')

    for line_num, line in enumerate(lines, start=1):
        # 查找 gitcheck 注释
        match = re.search(r'#\s*gitcheck:(ignore-\w+(?::\w+)?)', line, re.IGNORECASE)
        if not match:
            continue

        directive_str = match.group(1).lower()

        if directive_str == 'ignore-line':
            directives.append(WhitelistDirective(
                directive_type='ignore-line',
                line_number=line_num
            ))
        elif directive_str == 'ignore-file':
            directives.append(WhitelistDirective(
                directive_type='ignore-file'
            ))
        elif directive_str.startswith('ignore-rule:'):
            rule_id = directive_str.split(':')[1].upper()
            directives.append(WhitelistDirective(
                directive_type='ignore-rule',
                rule_id=rule_id
            ))
        elif directive_str == 'ignore-all-ips':
            directives.append(WhitelistDirective(
                directive_type='ignore-category',
                rule_id='INTL-01'  # 映射到 IP 检测规则
            ))

    return directives

def should_skip_detection(
    rule_id: str,
    line_number: int,
    directives: List[WhitelistDirective]
) -> bool:
    """
    判断某个检测是否应该被跳过

    优先级:
    1. ignore-file (最高优先级)
    2. ignore-rule:RULE_ID
    3. ignore-line (当前行)
    4. ignore-category (规则类别)
    """
    for directive in directives:
        if directive.directive_type == 'ignore-file':
            return True

        if (directive.directive_type == 'ignore-rule' and
            directive.rule_id == rule_id):
            return True

        if (directive.directive_type == 'ignore-line' and
            directive.line_number == line_number):
            return True

        if (directive.directive_type == 'ignore-category' and
            directive.rule_id == rule_id):
            return True

    return False
```

### Pattern 3: 邮箱排除过滤
**What:** 过滤已知公开邮箱和示例邮箱,减少误报
**When to use:** 检测到邮箱地址后,判断是否需要报告

**Example:**
```python
def should_report_email(email: str, exclude_domains: Set[str] = None) -> bool:
    """
    判断邮箱是否应该被报告

    排除规则:
    1. 公开邮箱域名(如 github.com, example.com)
    2. 用户自定义排除域名

    Args:
        email: 邮箱地址
        exclude_domains: 额外排除的域名集合

    Returns:
        True: 应该报告(可疑邮箱)
        False: 跳过(已知公开邮箱)
    """
    if exclude_domains is None:
        exclude_domains = set()

    # 合并默认排除域名和用户自定义域名
    all_excluded = PUBLIC_EMAIL_DOMAINS | exclude_domains

    # 提取邮箱域名
    try:
        domain = email.split('@')[1].lower()
        return domain not in all_excluded
    except IndexError:
        # 格式错误的邮箱,保守起见报告
        return True
```

### Pattern 4: 集成到 executor.py
**What:** 在现有扫描流程中添加内部信息检测和白名单过滤
**When to use:** run_pre_commit_scan() 函数中

**Example:**
```python
# File: scanner/executor.py (更新部分)

from scanner.rules.internal_info import (
    PRIVATE_IP_RULE,
    INTERNAL_DOMAIN_RULE,
    EMAIL_RULE,
    should_report_email
)
from scanner.rules.whitelist import (
    parse_whitelist_comments,
    should_skip_detection
)

def run_pre_commit_scan(repo_root: Path = None) -> Tuple[bool, List[ScanIssue]]:
    # ... 现有代码 ...

    for file_path, content in staged_files:
        # ... 现有检测 (缓存、配置、敏感信息) ...

        # E. 解析白名单注释 (Phase 8)
        whitelist_directives = parse_whitelist_comments(content, rel_path)

        # 检查是否整个文件被忽略
        if any(d.directive_type == 'ignore-file' for d in whitelist_directives):
            continue

        # F. 检测内部信息 (Phase 8)
        internal_rules = [
            PRIVATE_IP_RULE,
            INTERNAL_DOMAIN_RULE,
            EMAIL_RULE,
        ]

        for rule in internal_rules:
            matches = rule.pattern.finditer(content)
            for match in matches:
                matched_text = match.group(0)
                line_num = content[:match.start()].count('\n') + 1

                # 白名单过滤
                if should_skip_detection(rule.rule_id, line_num, whitelist_directives):
                    continue

                # 邮箱特殊处理:排除公开邮箱
                if rule.rule_id == 'INTL-03':
                    if not should_report_email(matched_text):
                        continue

                # 创建问题报告
                issues.append(create_issue(
                    rule_id=rule.rule_id,
                    severity='high',  # 内部信息作为错误级别
                    file_path=rel_path,
                    line_number=line_num,
                    content=matched_text,
                    suggestion=f'内部信息泄露,添加白名单注释: # gitcheck:ignore-line'
                ))

    # ... 现有报告生成代码 ...
```

### Anti-Patterns to Avoid
- **过度复杂的邮箱正则**: 不要使用完整 RFC 5322 正则(几百个字符),简化版足够
- **严格 IP 验证**: 不要使用 ipaddress 库验证,正则更灵活处理文档中的非规范 IP
- **白名单配置文件**: 不要创建独立的 YAML/JSON 配置文件,行内注释更直观
- **阻塞式集成**: 扫描器本身出错时不要阻止提交,显示警告即可

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 私有 IP 检测 | 自己写 IP 范围判断 | RFC 1918 正则表达式 | 正则简洁高效,避免边界条件错误 |
| 邮箱格式验证 | 复杂的 RFC 5322 实现 | 简化邮箱正则 + 排除列表 | 覆盖 99% 场景,易维护 |
| 白名单解析 | 复杂的配置解析器 | 简单的行内注释匹配 | 代码上下文关联,无需额外文件 |
| 域名后缀匹配 | 自己维护域名列表 | 正则表达式模式匹配 | 易扩展,支持自定义后缀 |

**Key insight:** 内部信息检测的核心是"宁可误报,不可漏检",配合白名单让用户控制误报。不要过度优化检测准确性而牺牲安全性。

## Common Pitfalls

### Pitfall 1: 邮箱检测误报过多
**What goes wrong:** 检测到大量公开邮箱(如 noreply@github.com),用户感到厌烦
**Why it happens:** 没有排除已知公开邮箱域名,所有邮箱格式都被报告
**How to avoid:**
1. 维护公开邮箱排除列表(PUBLIC_EMAIL_DOMAINS)
2. 支持用户自定义排除列表
3. 提供清晰的文档说明如何添加排除域名
**Warning signs:** 扫描报告显示大量 example.com, github.com 等公开邮箱

### Pitfall 2: 白名单注释解析失败
**What goes wrong:** 用户添加了 `# gitcheck:ignore-line` 但扫描仍然报告该行
**Why it happens:**
1. 注释语法错误(如拼写错误、大小写错误)
2. 注释和代码在同一行但位置不对
3. 多行注释时只解析了部分
**How to avoid:**
1. 使用宽松的正则匹配(忽略大小写、多余空格)
2. 检测到语法错误时显示警告
3. 提供测试命令验证白名单是否生效
**Warning signs:** 用户反复添加白名单但问题仍然报告

### Pitfall 3: 私有 IP 正则遗漏边界情况
**What goes wrong:** 某些私有 IP 没有被检测到(如 172.32.x.x 被误判为私有)
**Why it happens:** 正则表达式写错了,172.16-31 的范围判断有误
**How to avoid:**
1. 严格按照 RFC 1918 规范编写正则
2. 编写完整的测试用例覆盖边界值
3. 参考专业工具(如 git-secrets)的实现
**Warning signs:** 172.32.x.x 或 192.169.x.x 被错误报告

### Pitfall 4: 白名单优先级冲突
**What goes wrong:** 同时存在 ignore-file 和 ignore-line,用户不确定哪个生效
**Why it happens:** 没有明确的优先级规则,多个指令产生歧义
**How to avoid:**
1. 定义清晰的优先级:ignore-file > ignore-rule > ignore-line > ignore-category
2. 在文档中明确说明优先级
3. 检测到冲突时显示警告提示用户
**Warning signs:** 用户添加了 ignore-line 但整个文件被忽略

### Pitfall 5: 扫描器集成阻塞提交流程
**What goes wrong:** 扫描器本身抛出异常,导致 git commit 无法执行
**Why it happens:** 没有正确处理扫描器错误,异常向上传播到 pre-commit hook
**How to avoid:**
1. 用 try-except 包裹整个扫描流程
2. 扫描器错误时显示警告但返回 success=True
3. 记录错误日志便于排查
**Warning signs:** 用户运行 git commit 时看到 Python 异常堆栈

## Code Examples

### 完整的内部信息检测模块

```python
# File: scanner/rules/internal_info.py
"""
Phase 8: 内部信息检测规则
检测内网 IP、内部域名、邮箱地址泄露
"""
from dataclasses import dataclass
from typing import Pattern, List, Set, Optional
import re

@dataclass
class DetectionRule:
    """检测规则基类"""
    rule_id: str
    description: str
    pattern: Pattern[str]
    tags: List[str]

    @classmethod
    def create(cls, rule_id: str, description: str,
               pattern: str, tags: List[str]) -> 'DetectionRule':
        return cls(
            rule_id=rule_id,
            description=description,
            pattern=re.compile(pattern, re.IGNORECASE | re.MULTILINE),
            tags=tags
        )

# INTL-01: 私有 IP 地址 (RFC 1918)
# Source: https://tools.ietf.org/html/rfc1918
PRIVATE_IP_RULE = DetectionRule.create(
    rule_id="INTL-01",
    description="检测私有 IP 地址",
    pattern=(
        r'\b('
        r'10\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # 10.0.0.0/8
        r'172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|'  # 172.16.0.0/12
        r'192\.168\.\d{1,3}\.\d{1,3}'  # 192.168.0.0/16
        r')\b'
    ),
    tags=["internal", "ip", "rfc1918", "high-priority"]
)

# INTL-02: 内部域名
# Source: ICANN Reserved TLDs + Common Internal Domains
# https://www.icann.org/resources/pages/registrars-0d-2012-02-25-en
INTERNAL_DOMAIN_RULE = DetectionRule.create(
    rule_id="INTL-02",
    description="检测内部域名",
    pattern=(
        r'\b([a-zA-Z0-9][-a-zA-Z0-9]{0,61}[a-zA-Z0-9]\.'
        r'(?:internal|local|corp|intranet|lan|home|private|test|example|invalid)'
        r')\b'
    ),
    tags=["internal", "domain", "icann-reserved", "high-priority"]
)

# INTL-03: 邮箱地址 (简化版 RFC 5322)
# Source: https://emailregex.com/ (Simplified version)
EMAIL_RULE = DetectionRule.create(
    rule_id="INTL-03",
    description="检测邮箱地址",
    pattern=(
        r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
    ),
    tags=["internal", "email", "pii", "medium-priority"]
)

# 公开邮箱排除列表
PUBLIC_EMAIL_DOMAINS = {
    # 开发平台邮箱
    'github.com', 'gitlab.com', 'bitbucket.org', 'azure.com',
    # 示例邮箱域名
    'example.com', 'test.com', 'domain.com', 'sample.com',
    # 本地测试域名
    'localhost', 'local',
}

def should_report_email(email: str, custom_exclude: Set[str] = None) -> bool:
    """
    判断邮箱是否应该被报告

    Args:
        email: 邮箱地址
        custom_exclude: 用户自定义排除域名

    Returns:
        True: 应该报告
        False: 跳过(已知公开邮箱)
    """
    try:
        domain = email.split('@')[1].lower()
        excluded = PUBLIC_EMAIL_DOMAINS | (custom_exclude or set())
        return domain not in excluded
    except IndexError:
        return True  # 格式错误,保守报告

# 导出所有规则
__all__ = [
    'PRIVATE_IP_RULE',
    'INTERNAL_DOMAIN_RULE',
    'EMAIL_RULE',
    'should_report_email',
    'PUBLIC_EMAIL_DOMAINS',
]
```

### 白名单解析模块

```python
# File: scanner/rules/whitelist.py
"""
Phase 8: 白名单注释解析
支持 # gitcheck:ignore-* 注释标记
"""
from dataclasses import dataclass
from typing import List, Optional
import re

@dataclass
class WhitelistDirective:
    """白名单指令"""
    directive_type: str  # ignore-line, ignore-file, ignore-rule, ignore-category
    rule_id: Optional[str] = None
    line_number: Optional[int] = None

def parse_whitelist_comments(content: str) -> List[WhitelistDirective]:
    """
    解析文件中的白名单注释

    支持格式:
    - # gitcheck:ignore-line
    - # gitcheck:ignore-file
    - # gitcheck:ignore-rule:INTL-01
    - # gitcheck:ignore-all-ips

    Args:
        content: 文件内容

    Returns:
        白名单指令列表
    """
    directives = []
    lines = content.split('\n')

    for line_num, line in enumerate(lines, start=1):
        # 宽松匹配:忽略大小写和多余空格
        match = re.search(
            r'#\s*gitcheck\s*:\s*(ignore-\w+(?::\w+)?)',
            line,
            re.IGNORECASE
        )
        if not match:
            continue

        directive_str = match.group(1).lower()

        if directive_str == 'ignore-line':
            directives.append(WhitelistDirective(
                directive_type='ignore-line',
                line_number=line_num
            ))
        elif directive_str == 'ignore-file':
            directives.append(WhitelistDirective(
                directive_type='ignore-file'
            ))
        elif directive_str.startswith('ignore-rule:'):
            rule_id = directive_str.split(':')[1].upper()
            directives.append(WhitelistDirective(
                directive_type='ignore-rule',
                rule_id=rule_id
            ))
        elif directive_str == 'ignore-all-ips':
            directives.append(WhitelistDirective(
                directive_type='ignore-category',
                rule_id='INTL-01'
            ))
        elif directive_str == 'ignore-all-emails':
            directives.append(WhitelistDirective(
                directive_type='ignore-category',
                rule_id='INTL-03'
            ))

    return directives

def should_skip_detection(
    rule_id: str,
    line_number: int,
    directives: List[WhitelistDirective]
) -> bool:
    """
    判断检测是否应该被跳过

    优先级:
    1. ignore-file
    2. ignore-rule:RULE_ID
    3. ignore-line
    4. ignore-category
    """
    for directive in directives:
        if directive.directive_type == 'ignore-file':
            return True

        if (directive.directive_type == 'ignore-rule' and
            directive.rule_id == rule_id):
            return True

        if (directive.directive_type == 'ignore-line' and
            directive.line_number == line_number):
            return True

        if (directive.directive_type == 'ignore-category' and
            directive.rule_id == rule_id):
            return True

    return False

__all__ = [
    'WhitelistDirective',
    'parse_whitelist_comments',
    'should_skip_detection',
]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 完整 RFC 5322 邮箱正则 | 简化邮箱正则 + 排除列表 | Phase 8 | 减少复杂度,提高可维护性,覆盖 99% 场景 |
| 独立 YAML 配置文件 | 行内注释标记 | Phase 8 | 无需额外文件,代码上下文关联,更直观 |
| 严格 IP 验证 | 正则模式匹配 | Phase 8 | 更灵活,可处理文档中的非规范 IP |
| 阻塞式扫描集成 | 非阻塞 + 警告 | Phase 8 | 扫描器错误不影响提交流程,体验更好 |

**Deprecated/outdated:**
- 完整 RFC 5322 邮箱正则:过于复杂,简化版足够
- ipaddress 库严格验证:不适合检测文档中的非规范 IP

## Open Questions

1. **自定义域名后缀的配置方式**
   - What we know: 需要支持用户添加自定义内网域名后缀(如 *.company.internal)
   - What's unclear: 配置应该放在哪里?(SKILL.md 参数 vs 独立配置文件 vs 环境变量)
   - Recommendation: Phase 8 先实现硬编码列表,后续版本再支持自定义

2. **邮箱排除列表的维护方式**
   - What we know: 需要排除公开邮箱减少误报
   - What's unclear: 如何让用户添加自己的排除域名?
   - Recommendation: Phase 8 先使用内置列表,通过白名单注释处理特殊情况

3. **白名单注释冲突检测**
   - What we know: 可能存在多个指令冲突
   - What's unclear: 是否需要显示警告?还是默默按优先级处理?
   - Recommendation: 默默按优先级处理,避免过多警告干扰用户

## Sources

### Primary (HIGH confidence)
- RFC 1918: Address Allocation for Private Internets - https://tools.ietf.org/html/rfc1918
- ICANN Reserved TLDs - https://www.icann.org/resources/pages/registrars-0d-2012-02-25-en
- ICANN .internal 保留域名 (2024-08) - https://www.icann.org/

### Secondary (MEDIUM confidence)
- Simplified RFC 5322 Email Regex - https://emailregex.com/
- 内部域名最佳实践 - CSDN 博客搜索结果 (2026-02-25)

### Tertiary (LOW confidence)
- WebSearch 搜索的中文博客文章(部分内容可能过时,需要结合 RFC 验证)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 复用 Phase 6/7 架构,无需新依赖
- Architecture: HIGH - 沿用 DetectionRule 模式,白名单解析简单直接
- Pitfalls: MEDIUM - 邮箱误报和正则边界情况需要充分测试

**Research date:** 2026-02-25
**Valid until:** 2027-02-25 (私有 IP 和保留域名规范稳定,邮箱格式基本稳定)
