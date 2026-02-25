"""
Scan result reporter with colored table output
Phase 7: Scanning Execution & Reporting
"""
from dataclasses import dataclass
from typing import List
from colorama import Fore, Style, just_fix_windows_console
from tabulate import tabulate

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


def format_issues_table(issues: List[ScanIssue]) -> str:
    """
    Format issues as colored table

    Args:
        issues: List of detected issues

    Returns:
        Formatted table string with ANSI color codes

    Table columns (from CONTEXT.md):
    - Rule ID: Colored by severity
    - File: File path (relative to repo root)
    - Line: Line number
    - Content: Masked content snippet
    - Suggestion: Fix suggestion
    """
    if not issues:
        return Fore.GREEN + "✓ No issues found." + Style.RESET_ALL

    # Sort by severity (most severe first) - CONTEXT.md decision
    issues.sort(key=lambda x: SEVERITY_ORDER.get(x.severity, 4))

    table_data = []
    for issue in issues:
        # Select color based on severity
        color = SEVERITY_COLORS.get(issue.severity, Fore.WHITE)

        # Build table row with colored severity
        table_data.append([
            color + issue.rule_id + Style.RESET_ALL,
            issue.file_path,
            str(issue.line_number),
            mask_sensitive(issue.content_snippet),
            issue.suggestion
        ])

    # Create colored headers
    headers = [
        Fore.CYAN + 'Rule ID' + Style.RESET_ALL,
        Fore.CYAN + 'File' + Style.RESET_ALL,
        Fore.CYAN + 'Line' + Style.RESET_ALL,
        Fore.CYAN + 'Content' + Style.RESET_ALL,
        Fore.CYAN + 'Suggestion' + Style.RESET_ALL
    ]

    # Generate table using tabulate
    return tabulate(table_data, headers=headers, tablefmt='simple')


def print_scan_report(issues: List[ScanIssue]) -> None:
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
    """
    # Print header
    print("\n" + "="*60)
    print(Fore.CYAN + "Git Security Scan Report" + Style.RESET_ALL)
    print("="*60 + "\n")

    if issues:
        # Issue summary
        print(Fore.RED + f"Found {len(issues)} issue(s):\n" + Style.RESET_ALL)

        # Print table
        print(format_issues_table(issues))

        # Print suggested actions
        print("\n" + Fore.YELLOW + "Suggested actions:" + Style.RESET_ALL)
        print("  1. Remove sensitive data from staged files")
        print("  2. Add files to .gitignore if needed: git reset HEAD <file>")
        print("  3. Re-stage changes: git add <file>")
        print("  4. Retry commit")
    else:
        # No issues found
        print(Fore.GREEN + "✓ No issues detected." + Style.RESET_ALL)


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
