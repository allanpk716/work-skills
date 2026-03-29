"""
Scan result reporter with colored table output
Phase 7: Scanning Execution & Reporting
Phase 10: UX Polish - smart color detection, bilingual support
"""
from dataclasses import dataclass
from typing import List
import sys
from colorama import Fore, Style, just_fix_windows_console
from tabulate import tabulate
from scanner.messages import get_message

# Initialize Windows terminal color support
just_fix_windows_console()


@dataclass
class ScanIssue:
    """
    Represents a detected security issue

    Attributes:
        rule_id: Rule identifier (e.g., 'SENS-01', 'CACHE-01')
        severity: Issue severity ('critical', 'high', 'medium', 'warning')
        file_path: Relative path to the file containing the issue
        line_number: Line number where issue was detected (0 for file-level)
        content_snippet: Snippet of problematic content (will be masked)
        suggestion: Actionable fix suggestion
    """
    rule_id: str
    severity: str
    file_path: str
    line_number: int
    content_snippet: str
    suggestion: str


# Note on code context display (CONTEXT.md requirement):
# The CONTEXT.md mentions showing "problem code snippet (前后几行代码)".
# Current implementation focuses on showing the matched content (masked).
# Future enhancement can add a context_lines field to ScanIssue and
# display surrounding lines in the report. For Phase 7, we keep it simple
# by showing the problematic line only, which is the minimum viable approach.


# Severity level colors (CONTEXT.md decision)
SEVERITY_COLORS = {
    'critical': Fore.RED,
    'high': Fore.LIGHTRED_EX,
    'medium': Fore.YELLOW,
    'warning': Fore.LIGHTYELLOW_EX,
}

# Severity order for sorting (most severe first)
SEVERITY_ORDER = {
    'critical': 0,
    'high': 1,
    'medium': 2,
    'warning': 3,
}


def mask_sensitive(text: str, show_chars: int = 4) -> str:
    """
    Mask sensitive information for safe display

    Args:
        text: Text to mask
        show_chars: Number of characters to show at start and end

    Returns:
        Masked text (e.g., "sk-1234***cdef")

    Examples:
        >>> mask_sensitive("sk-1234567890abcdef")
        'sk-1***cdef'
        >>> mask_sensitive("short")
        'sh***'
    """
    if len(text) <= show_chars * 2:
        # Too short, show minimal info
        return text[:2] + '***'
    return f"{text[:show_chars]}***{text[-show_chars:]}"


def should_use_colors() -> bool:
    """
    Determine if colors should be used based on output destination

    Colors are enabled when:
    - Output is to a TTY (terminal)
    - Not redirected to a file or pipe

    Colors are disabled when:
    - Output is redirected to a file
    - Output is piped to another command
    - Running in non-interactive environments

    Returns:
        True if colors should be used, False otherwise
    """
    return sys.stdout.isatty()


def format_issues_table(issues: List[ScanIssue], use_colors: bool = True, lang: str = 'zh') -> str:
    """
    Format issues as colored table

    Args:
        issues: List of detected issues
        use_colors: Whether to use ANSI color codes
        lang: Language code for messages ('zh' or 'en')

    Returns:
        Formatted table string with ANSI color codes (if enabled)

    Table columns (from CONTEXT.md):
    - Rule ID: Colored by severity
    - File: File path (relative to repo root)
    - Line: Line number
    - Content: Masked content snippet
    - Suggestion: Fix suggestion
    """
    if not issues:
        msg = get_message('report_no_issues', lang)
        if use_colors:
            return Fore.GREEN + "[OK] " + msg + Style.RESET_ALL
        else:
            return "[OK] " + msg

    # Sort by severity (most severe first) - CONTEXT.md decision
    issues.sort(key=lambda x: SEVERITY_ORDER.get(x.severity, 4))

    table_data = []
    for issue in issues:
        # Select color based on severity
        color = SEVERITY_COLORS.get(issue.severity, Fore.WHITE) if use_colors else ''

        # Build table row with colored severity (if enabled)
        rule_id = issue.rule_id
        if use_colors:
            rule_id = color + issue.rule_id + Style.RESET_ALL

        table_data.append([
            rule_id,
            issue.file_path,
            str(issue.line_number),
            mask_sensitive(issue.content_snippet),
            issue.suggestion
        ])

    # Create headers with translations
    if use_colors:
        headers = [
            Fore.CYAN + get_message('table_rule_id', lang) + Style.RESET_ALL,
            Fore.CYAN + get_message('table_file', lang) + Style.RESET_ALL,
            Fore.CYAN + get_message('table_line', lang) + Style.RESET_ALL,
            Fore.CYAN + get_message('table_content', lang) + Style.RESET_ALL,
            Fore.CYAN + get_message('table_suggestion', lang) + Style.RESET_ALL
        ]
    else:
        headers = [
            get_message('table_rule_id', lang),
            get_message('table_file', lang),
            get_message('table_line', lang),
            get_message('table_content', lang),
            get_message('table_suggestion', lang)
        ]

    # Generate table using tabulate
    return tabulate(table_data, headers=headers, tablefmt='simple')


def print_scan_report(issues: List[ScanIssue], use_colors: bool = None, lang: str = 'zh') -> None:
    """
    Print complete scan report to console

    Report structure (from CONTEXT.md):
    1. Header with separator line
    2. Issue count summary
    3. Formatted table (if issues exist)
    4. Suggested actions (if issues exist)
    5. Success message (if no issues)

    Args:
        issues: List of detected issues
        use_colors: Whether to use ANSI colors (None = auto-detect from TTY)
        lang: Language code for messages ('zh' or 'en')
    """
    # Auto-detect color usage if not specified
    if use_colors is None:
        use_colors = should_use_colors()

    # Print header
    print("\n" + "="*60)
    if use_colors:
        print(Fore.CYAN + get_message('report_title', lang) + Style.RESET_ALL)
    else:
        print(get_message('report_title', lang))
    print("="*60 + "\n")

    if issues:
        # Issue summary
        if use_colors:
            print(Fore.RED + get_message('report_issues_found', lang, count=len(issues)) + "\n" + Style.RESET_ALL)
        else:
            print(get_message('report_issues_found', lang, count=len(issues)) + "\n")

        # Print table
        print(format_issues_table(issues, use_colors, lang))

        # Print suggested actions
        if use_colors:
            print("\n" + Fore.YELLOW + get_message('report_suggested_actions', lang) + Style.RESET_ALL)
        else:
            print("\n" + get_message('report_suggested_actions', lang))
        print("  " + get_message('report_action_1', lang))
        print("  " + get_message('report_action_2', lang))
        print("  " + get_message('report_action_3', lang))
        print("  " + get_message('report_action_4', lang))
    else:
        # No issues found
        msg = get_message('report_no_issues', lang)
        if use_colors:
            print(Fore.GREEN + "[OK] " + msg + Style.RESET_ALL)
        else:
            print("[OK] " + msg)


# Convenience function for creating issues
def create_issue(
    rule_id: str,
    severity: str,
    file_path: str,
    line_number: int,
    content: str,
    suggestion: str = None
) -> ScanIssue:
    """
    Convenience function to create ScanIssue with default suggestion

    Args:
        rule_id: Rule identifier
        severity: Issue severity
        file_path: File path
        line_number: Line number
        content: Content snippet
        suggestion: Optional custom suggestion (default generated from rule_id)

    Returns:
        ScanIssue instance
    """
    if suggestion is None:
        suggestion = f"Fix {rule_id} issue or add to .gitignore"

    return ScanIssue(
        rule_id=rule_id,
        severity=severity,
        file_path=file_path,
        line_number=line_number,
        content_snippet=content,
        suggestion=suggestion
    )
