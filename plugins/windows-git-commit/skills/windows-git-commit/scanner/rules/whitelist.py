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
    - # gitcheck:ignore-all-emails

    Args:
        content: 文件内容

    Returns:
        白名单指令列表
    """
    directives = []
    lines = content.split('\n')

    for line_num, line in enumerate(lines, start=1):
        # 宽松匹配:忽略大小写和多余空格
        # 注意:使用 [\w-]+ 匹配连字符(如 INTL-03)
        match = re.search(
            r'#\s*gitcheck\s*:\s*(ignore-[\w-]+(?::[\w-]+)?)',
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

    Args:
        rule_id: 规则 ID
        line_number: 行号
        directives: 白名单指令列表

    Returns:
        True: 跳过此检测
        False: 不跳过,报告此检测
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
