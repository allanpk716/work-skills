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
    rule_id: str                    # 规则 ID (如 INTL-01)
    description: str                # 规则描述(中文)
    pattern: Pattern[str]           # 正则表达式模式
    tags: List[str]                 # 分类标签

    @classmethod
    def create(cls, rule_id: str, description: str,
               pattern: str, tags: List[str]) -> 'DetectionRule':
        """工厂方法,编译正则表达式"""
        return cls(
            rule_id=rule_id,
            description=description,
            pattern=re.compile(pattern, re.IGNORECASE | re.MULTILINE),
            tags=tags
        )


# INTL-01: 私有 IP 地址检测 (RFC 1918)
# Source: https://tools.ietf.org/html/rfc1918
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
    tags=["internal", "ip", "rfc1918", "high-priority"]
)

# INTL-02: 内部域名检测
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

# INTL-03: 邮箱地址检测 (简化版 RFC 5322)
# Source: https://emailregex.com/ (Simplified version)
EMAIL_RULE = DetectionRule.create(
    rule_id="INTL-03",
    description="检测邮箱地址",
    pattern=(
        r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
    ),
    tags=["internal", "email", "pii", "medium-priority"]
)

# 公开邮箱排除列表(公开邮箱和示例邮箱)
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
    if custom_exclude is None:
        custom_exclude = set()

    # 合并默认排除域名和用户自定义域名
    all_excluded = PUBLIC_EMAIL_DOMAINS | custom_exclude

    # 提取邮箱域名
    try:
        domain = email.split('@')[1].lower()
        return domain not in all_excluded
    except IndexError:
        # 格式错误的邮箱,保守起见报告
        return True


# 导出所有规则
__all__ = [
    'DetectionRule',
    'PRIVATE_IP_RULE',
    'INTERNAL_DOMAIN_RULE',
    'EMAIL_RULE',
    'should_report_email',
    'PUBLIC_EMAIL_DOMAINS',
]
