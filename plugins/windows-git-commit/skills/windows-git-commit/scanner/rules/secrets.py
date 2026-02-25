from dataclasses import dataclass
from typing import Pattern, List, Optional
import re


@dataclass
class DetectionRule:
    """检测规则基类"""
    rule_id: str                    # 规则 ID (如 SENS-01)
    description: str                # 规则描述(中文)
    pattern: Pattern[str]           # 正则表达式模式
    tags: List[str]                 # 分类标签
    entropy_threshold: Optional[float] = None  # 熵值阈值(Phase 7 使用)

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


# SENS-01: AWS 凭证检测
AWS_ACCESS_KEY_RULE = DetectionRule.create(
    rule_id="SENS-01",
    description="检测 AWS Access Key ID",
    pattern=r'\b((?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16})\b',
    tags=["aws", "access-key", "high-priority"]
)

AWS_SECRET_KEY_RULE = DetectionRule.create(
    rule_id="SENS-01",
    description="检测 AWS Secret Access Key",
    pattern=r'aws(.{0,20})?[\'\"]?[0-9a-zA-Z\/+]{40}[\'\"]?',
    tags=["aws", "secret-key", "high-priority"]
)

AWS_SESSION_TOKEN_RULE = DetectionRule.create(
    rule_id="SENS-01",
    description="检测 AWS Session Token",
    pattern=r'(?i)(aws_session_token|awssessiontoken|session_token)(?:.{0,20})?[\'\"]?[a-zA-Z0-9/+=]{16,}[\'\"]?',
    tags=["aws", "session-token", "high-priority"]
)

# SENS-02: Git 服务 token 检测
GITHUB_TOKEN_RULE = DetectionRule.create(
    rule_id="SENS-02",
    description="检测 GitHub Personal Access Token",
    pattern=r'\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b',
    tags=["github", "token", "high-priority"]
)

GITLAB_TOKEN_RULE = DetectionRule.create(
    rule_id="SENS-02",
    description="检测 GitLab Personal Access Token",
    pattern=r'\b(glpat-[a-zA-Z0-9\-_]{20})\b',
    tags=["gitlab", "token", "high-priority"]
)

BITBUCKET_TOKEN_RULE = DetectionRule.create(
    rule_id="SENS-02",
    description="检测 Bitbucket Access Token",
    pattern=r'(?i)bitbucket(.{0,20})?[\'\"]?[a-zA-Z0-9]{32}[\'\"]?',
    tags=["bitbucket", "token", "high-priority"]
)

# SENS-03: 通用 API 密钥检测
GENERIC_API_KEY_RULE = DetectionRule.create(
    rule_id="SENS-03",
    description="检测通用 API 密钥",
    pattern=(
        r'[\w.-]{0,50}?(?:access|auth|[Aa]pi|API|credential|creds|key|passw(?:or)?d|secret|token)'
        r'(?:[ \t\w.-]{0,20})[\s\'"]{0,3}'
        r'(?:=||:{1,3}=|\|\||:|=|\?=|,)'
        r'[\x60\'"\s=]{0,5}'
        r'([\w.=-]{10,150}|[a-z0-9][a-z0-9+/]{11,}={0,3})'
    ),
    tags=["api-key", "generic", "medium-priority"]
)

# SENS-04: SSH 私钥检测
SSH_KEY_RULE = DetectionRule.create(
    rule_id="SENS-04",
    description="检测 SSH 私钥文件",
    pattern=r'-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----',
    tags=["ssh", "private-key", "critical"]
)

# SENS-05: PGP 私钥检测
PGP_KEY_RULE = DetectionRule.create(
    rule_id="SENS-05",
    description="检测 PGP 私钥文件",
    pattern=r'-----BEGIN PGP PRIVATE KEY BLOCK-----',
    tags=["pgp", "private-key", "critical"]
)

# SENS-06: PEM 证书检测
PEM_CERT_RULE = DetectionRule.create(
    rule_id="SENS-06",
    description="检测 PEM 证书文件",
    pattern=r'-----BEGIN CERTIFICATE-----',
    tags=["pem", "certificate", "medium-priority"]
)
