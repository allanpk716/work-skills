"""
Bilingual message support for security scanner.

Messages organized by category:
- errors: Error messages for blocked issues
- warnings: Warning messages (future feature)
- info: Informational messages
- help: Help and usage messages
"""

MESSAGES = {
    'zh': {
        # Error messages
        'error_prefix': '[错误]',
        'error_sensitive': '检测到敏感信息',
        'error_cache': '检测到缓存文件',
        'error_config': '检测到配置文件',
        'error_internal': '检测到内部信息',
        'error_api_key': '检测到 API 密钥',
        'error_aws_key': '检测到 AWS 密钥',
        'error_ssh_key': '检测到 SSH 私钥',
        'error_email': '检测到邮箱地址',
        'error_private_ip': '检测到内网 IP 地址',
        'error_internal_domain': '检测到内部域名',

        # Warning messages (future feature)
        'warning_prefix': '[警告]',
        'warning_cache': '检测到缓存文件(不阻止提交)',

        # Info messages
        'info_scan_complete': '安全扫描完成。未发现问题。',
        'info_scan_start': '开始安全扫描...',
        'info_files_scanned': '已扫描文件: {count} 个',
        'info_issues_found': '发现问题: {count} 个',
        'info_errors': '错误: {count}',
        'info_warnings': '警告: {count}',

        # Blocking messages
        'block_commit': '提交被阻止: 发现安全问题',
        'block_fix_issues': '请修复上述问题或添加白名单注释',
        'block_whitelist_help': '白名单注释示例: # gitcheck:ignore-line',

        # Help messages
        'help_lang': '使用 --lang zh/en 切换语言',
        'help_no_color': '使用 --no-color 禁用彩色输出',
        'help_emergency': '紧急情况跳过扫描: git commit --no-verify',

        # File type labels
        'file_env': '环境配置文件',
        'file_credentials': '凭证文件',
        'file_pycache': 'Python 缓存文件',
        'file_node_modules': 'Node.js 依赖目录',

        # Suggestion messages
        'suggest_gitignore': '建议添加到 .gitignore 文件',
        'suggest_remove': '建议从暂存区移除此文件',
        'suggest_whitelist': '如需提交,添加白名单注释: # gitcheck:ignore-file',

        # Report messages
        'report_title': 'Git 安全扫描报告',
        'report_issues_found': '发现 {count} 个问题:',
        'report_no_issues': '未发现问题。',
        'report_suggested_actions': '建议操作:',
        'report_action_1': '1. 从暂存文件中移除敏感数据',
        'report_action_2': '2. 如需要,将文件添加到 .gitignore: git reset HEAD <file>',
        'report_action_3': '3. 重新暂存更改: git add <file>',
        'report_action_4': '4. 重试提交',

        # Table headers
        'table_rule_id': '规则 ID',
        'table_file': '文件',
        'table_line': '行号',
        'table_content': '内容',
        'table_suggestion': '建议',
    },

    'en': {
        # Error messages
        'error_prefix': '[ERROR]',
        'error_sensitive': 'Sensitive information detected',
        'error_cache': 'Cache file detected',
        'error_config': 'Configuration file detected',
        'error_internal': 'Internal information detected',
        'error_api_key': 'API key detected',
        'error_aws_key': 'AWS credentials detected',
        'error_ssh_key': 'SSH private key detected',
        'error_email': 'Email address detected',
        'error_private_ip': 'Private IP address detected',
        'error_internal_domain': 'Internal domain detected',

        # Warning messages (future feature)
        'warning_prefix': '[WARNING]',
        'warning_cache': 'Cache file detected (does not block commit)',

        # Info messages
        'info_scan_complete': 'Security scan complete. No issues found.',
        'info_scan_start': 'Starting security scan...',
        'info_files_scanned': 'Files scanned: {count}',
        'info_issues_found': 'Issues found: {count}',
        'info_errors': 'Errors: {count}',
        'info_warnings': 'Warnings: {count}',

        # Blocking messages
        'block_commit': 'Commit blocked: Security issues found',
        'block_fix_issues': 'Please fix the issues above or add whitelist comments',
        'block_whitelist_help': 'Whitelist example: # gitcheck:ignore-line',

        # Help messages
        'help_lang': 'Use --lang zh/en to switch language',
        'help_no_color': 'Use --no-color to disable colored output',
        'help_emergency': 'Emergency skip: git commit --no-verify',

        # File type labels
        'file_env': 'Environment file',
        'file_credentials': 'Credentials file',
        'file_pycache': 'Python cache file',
        'file_node_modules': 'Node.js dependencies',

        # Suggestion messages
        'suggest_gitignore': 'Consider adding to .gitignore',
        'suggest_remove': 'Consider removing from staging area',
        'suggest_whitelist': 'To commit, add whitelist comment: # gitcheck:ignore-file',

        # Report messages
        'report_title': 'Git Security Scan Report',
        'report_issues_found': 'Found {count} issue(s):',
        'report_no_issues': 'No issues detected.',
        'report_suggested_actions': 'Suggested actions:',
        'report_action_1': '1. Remove sensitive data from staged files',
        'report_action_2': '2. Add files to .gitignore if needed: git reset HEAD <file>',
        'report_action_3': '3. Re-stage changes: git add <file>',
        'report_action_4': '4. Retry commit',

        # Table headers
        'table_rule_id': 'Rule ID',
        'table_file': 'File',
        'table_line': 'Line',
        'table_content': 'Content',
        'table_suggestion': 'Suggestion',
    }
}


def get_message(key, lang='zh', **kwargs):
    """
    Get translated message by key.

    Args:
        key: Message key (e.g., 'error_sensitive')
        lang: Language code ('zh' or 'en'), defaults to 'zh'
        **kwargs: Format arguments for message templating

    Returns:
        Translated message string

    Example:
        >>> get_message('error_sensitive', lang='zh')
        '检测到敏感信息'

        >>> get_message('info_files_scanned', lang='en', count=10)
        'Files scanned: 10'
    """
    # Get language dictionary (fallback to Chinese if lang not found)
    lang_dict = MESSAGES.get(lang, MESSAGES['zh'])

    # Get message (fallback to key if message not found)
    message = lang_dict.get(key, key)

    # Apply template formatting if kwargs provided
    if kwargs:
        try:
            message = message.format(**kwargs)
        except KeyError:
            # If formatting fails, return unformatted message
            pass

    return message


def get_available_languages():
    """Return list of supported language codes."""
    return list(MESSAGES.keys())
