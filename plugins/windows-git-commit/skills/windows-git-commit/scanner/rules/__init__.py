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

# 缓存文件检测规则 (将在 Plan 02 添加)
# from .cache_files import ...

# 配置文件检测规则 (将在 Plan 02 添加)
# from .config_files import ...

__all__ = [
    # 基类
    'DetectionRule',

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
]
