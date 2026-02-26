# 敏感信息检测规则
from .secrets import (
    DetectionRule,
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    AWS_SESSION_TOKEN_RULE,
    GITHUB_TOKEN_RULE,
    GITLAB_TOKEN_RULE,
    BITBUCKET_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,
    PGP_KEY_RULE,
    PEM_CERT_RULE,
)

# 缓存文件检测规则
from .cache_files import (
    CacheFileRule,
    PYTHON_CACHE_RULE,
    NODEJS_CACHE_RULE,
    COMPILED_CACHE_RULE,
    SYSTEM_CACHE_RULE,
    CACHE_FILE_RULES,
    is_cache_file,
)

# 配置文件检测规则
from .config_files import (
    ConfigFileRule,
    ENV_FILE_RULE,
    CREDENTIALS_FILE_RULE,
    SENSITIVE_FIELD_RULE,
    CONFIG_FILE_RULES,
    is_config_file,
    scan_config_content,
)

# Phase 8: 内部信息检测规则
from .internal_info import (
    PRIVATE_IP_RULE,
    INTERNAL_DOMAIN_RULE,
    EMAIL_RULE,
    should_report_email,
    PUBLIC_EMAIL_DOMAINS,
)

# Phase 8: 白名单规则
from .whitelist import (
    WhitelistDirective,
    parse_whitelist_comments,
    should_skip_detection,
)

__all__ = [
    # 基类
    'DetectionRule',
    'CacheFileRule',
    'ConfigFileRule',

    # 敏感信息规则
    'AWS_ACCESS_KEY_RULE',
    'AWS_SECRET_KEY_RULE',
    'AWS_SESSION_TOKEN_RULE',
    'GITHUB_TOKEN_RULE',
    'GITLAB_TOKEN_RULE',
    'BITBUCKET_TOKEN_RULE',
    'GENERIC_API_KEY_RULE',
    'SSH_KEY_RULE',
    'PGP_KEY_RULE',
    'PEM_CERT_RULE',

    # 缓存文件规则
    'PYTHON_CACHE_RULE',
    'NODEJS_CACHE_RULE',
    'COMPILED_CACHE_RULE',
    'SYSTEM_CACHE_RULE',
    'CACHE_FILE_RULES',
    'is_cache_file',

    # 配置文件规则
    'ENV_FILE_RULE',
    'CREDENTIALS_FILE_RULE',
    'SENSITIVE_FIELD_RULE',
    'CONFIG_FILE_RULES',
    'is_config_file',
    'scan_config_content',

    # Phase 8: 内部信息检测
    'PRIVATE_IP_RULE',
    'INTERNAL_DOMAIN_RULE',
    'EMAIL_RULE',
    'should_report_email',
    'PUBLIC_EMAIL_DOMAINS',

    # Phase 8: 白名单
    'WhitelistDirective',
    'parse_whitelist_comments',
    'should_skip_detection',
]
