from pathlib import Path
from typing import List, Tuple
from dataclasses import dataclass
import re


@dataclass
class ConfigFileRule:
    """配置文件检测规则"""
    rule_id: str                    # 规则 ID (如 CONF-01)
    description: str                # 规则描述(中文)
    file_patterns: List[str]        # 文件名模式
    content_pattern: re.Pattern     # 内容扫描模式(可选)
    tags: List[str]                 # 分类标签


# CONF-01: 环境配置文件
ENV_FILE_RULE = ConfigFileRule(
    rule_id="CONF-01",
    description="检测环境配置文件",
    file_patterns=[
        '.env',
        '.env.local',
        '.env.*.local',
    ],
    content_pattern=None,  # 不扫描内容,仅检测文件名
    tags=["env", "config", "secrets"]
)

# CONF-02: 凭证文件
CREDENTIALS_FILE_RULE = ConfigFileRule(
    rule_id="CONF-02",
    description="检测凭证文件",
    file_patterns=[
        'credentials.json',
        'secrets.yaml',
        'secrets.yml',
        'secrets.xml',
    ],
    content_pattern=None,  # 不扫描内容,仅检测文件名
    tags=["credentials", "secrets", "config"]
)

# CONF-03: 包含敏感字段的配置文件
SENSITIVE_FIELD_RULE = ConfigFileRule(
    rule_id="CONF-03",
    description="检测配置文件中的敏感字段",
    file_patterns=[],  # 不限制文件名,扫描所有文件内容
    content_pattern=re.compile(
        r'(password|api_key|secret|token)\s*[=:]\s*[\'"]?([^\'"}\s]+)',
        re.IGNORECASE | re.MULTILINE
    ),
    tags=["sensitive", "config", "secrets"]
)

# 所有配置文件规则
CONFIG_FILE_RULES = [
    ENV_FILE_RULE,
    CREDENTIALS_FILE_RULE,
    SENSITIVE_FIELD_RULE,
]


def is_config_file(file_path: Path) -> Tuple[bool, str]:
    """
    检测文件是否为配置文件(基于文件名)

    Args:
        file_path: 文件路径

    Returns:
        (is_config, rule_id) 元组
        - is_config: True 如果是配置文件
        - rule_id: 匹配的规则 ID (如 "CONF-01")
    """
    file_name = file_path.name

    for rule in CONFIG_FILE_RULES:
        if not rule.file_patterns:  # 跳过仅扫描内容的规则
            continue

        for pattern in rule.file_patterns:
            if pattern.startswith('.env'):
                # 环境变量文件特殊匹配
                if file_name == pattern or file_name.startswith('.env.'):
                    return True, rule.rule_id
            else:
                # 精确文件名匹配
                if file_name == pattern:
                    return True, rule.rule_id

    return False, ""


def scan_config_content(content: str) -> List[Tuple[str, str, int]]:
    """
    扫描配置文件内容,检测敏感字段

    Args:
        content: 文件内容

    Returns:
        List of (field_name, masked_value, line_number) tuples
    """
    matches = SENSITIVE_FIELD_RULE.content_pattern.finditer(content)
    results = []

    for match in matches:
        field_name = match.group(1)
        value = match.group(2)
        line_number = content[:match.start()].count('\n') + 1

        # 脱敏显示: 前 4 字符 + *** + 后 4 字符
        if len(value) > 12:
            masked_value = f"{value[:4]}***{value[-4:]}"
        else:
            masked_value = f"{value[:2]}***{value[-2:]}"

        results.append((field_name, masked_value, line_number))

    return results
