"""
Windows Git Commit Security Scanner
Phase 6: Core detection rules
Phase 7: Scanning execution workflow
"""

# Phase 6: Detection rules
from scanner.rules import (
    # Sensitive data rules
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

    # Cache file rules
    CacheFileRule,
    PYTHON_CACHE_RULE,
    NODEJS_CACHE_RULE,
    COMPILED_CACHE_RULE,
    SYSTEM_CACHE_RULE,
    CACHE_FILE_RULES,
    is_cache_file,

    # Config file rules
    ConfigFileRule,
    ENV_FILE_RULE,
    CREDENTIALS_FILE_RULE,
    SENSITIVE_FIELD_RULE,
    CONFIG_FILE_RULES,
    is_config_file,
    scan_config_content,
)

# Phase 6: Utilities
from scanner.utils import (
    get_staged_files,
    is_binary_file,
    match_path_pattern,
)

# Phase 7: Execution workflow
from scanner.executor import run_pre_commit_scan

# Phase 7: Gitignore support
from scanner.gitignore import (
    load_gitignore_spec,
    filter_staged_files,
)

# Phase 7: Reporting
from scanner.reporter import (
    ScanIssue,
    format_issues_table,
    print_scan_report,
    create_issue,
)

__all__ = [
    # Phase 6: Rules
    'DetectionRule',
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

    # Phase 6: Cache rules
    'CacheFileRule',
    'PYTHON_CACHE_RULE',
    'NODEJS_CACHE_RULE',
    'COMPILED_CACHE_RULE',
    'SYSTEM_CACHE_RULE',
    'CACHE_FILE_RULES',
    'is_cache_file',

    # Phase 6: Config rules
    'ConfigFileRule',
    'ENV_FILE_RULE',
    'CREDENTIALS_FILE_RULE',
    'SENSITIVE_FIELD_RULE',
    'CONFIG_FILE_RULES',
    'is_config_file',
    'scan_config_content',

    # Phase 6: Utilities
    'get_staged_files',
    'is_binary_file',
    'match_path_pattern',

    # Phase 7: Execution
    'run_pre_commit_scan',

    # Phase 7: Gitignore
    'load_gitignore_spec',
    'filter_staged_files',

    # Phase 7: Reporting
    'ScanIssue',
    'format_issues_table',
    'print_scan_report',
    'create_issue',
]
