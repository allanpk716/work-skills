"""
Scanning executor - orchestrates the pre-commit scan workflow
Phase 7: Scanning Execution & Reporting
"""
from pathlib import Path
from typing import List, Tuple
import subprocess

from scanner.utils.git_ops import get_staged_files, is_binary_file
from scanner.gitignore import load_gitignore_spec, filter_staged_files
from scanner.rules import (
    # Sensitive data rules
    AWS_ACCESS_KEY_RULE,
    AWS_SECRET_KEY_RULE,
    GITHUB_TOKEN_RULE,
    GENERIC_API_KEY_RULE,
    SSH_KEY_RULE,

    # Cache/config rules
    is_cache_file,
    is_config_file,
    scan_config_content,
)
from scanner.reporter import ScanIssue, create_issue, print_scan_report


def run_pre_commit_scan(repo_root: Path = None) -> Tuple[bool, List[ScanIssue]]:
    """
    Execute pre-commit scanning workflow

    Workflow:
    1. Detect repo root if not provided
    2. Load .gitignore exclusion rules
    3. Get staged files from git
    4. Filter out gitignore files
    5. Scan each file with Phase 6 rules
    6. Print report and return scan result

    Args:
        repo_root: Git repository root directory (auto-detect if None)

    Returns:
        Tuple of (success: bool, issues: List[ScanIssue])
        - success: True if no issues found, False otherwise
        - issues: List of detected issues (empty if success=True)
    """
    # 1. Detect repo root if not provided
    if repo_root is None:
        result = subprocess.run(
            ['git', 'rev-parse', '--show-toplevel'],
            capture_output=True,
            text=True,
            check=True
        )
        repo_root = Path(result.stdout.strip())

    # 2. Load .gitignore rules
    try:
        gitignore_spec = load_gitignore_spec(repo_root)
    except Exception as e:
        print(f"Warning: Failed to load .gitignore: {e}")
        gitignore_spec = None

    # 3. Get staged files
    try:
        staged_files = get_staged_files(repo_root)
    except Exception as e:
        print(f"Error: Failed to get staged files: {e}")
        return False, []

    # 4. Filter out .gitignore files
    if gitignore_spec:
        file_paths = [f for f, _ in staged_files]
        filtered_paths = filter_staged_files(file_paths, gitignore_spec)
        # Rebuild staged_files with filtered paths
        path_to_content = {f: c for f, c in staged_files}
        staged_files = [(f, path_to_content[f]) for f in filtered_paths]

    # 5. Scan each file
    issues: List[ScanIssue] = []

    for file_path, content in staged_files:
        # Skip binary files (EXEC-04)
        if is_binary_file(file_path):
            continue

        rel_path = str(file_path.relative_to(repo_root))

        # A. Check for cache files (CACHE-01 to CACHE-04)
        if is_cache_file(file_path):
            issues.append(create_issue(
                rule_id='CACHE-DETECTED',
                severity='warning',
                file_path=rel_path,
                line_number=0,
                content='<cache file>',
                suggestion=f'Add {file_path.name} to .gitignore'
            ))
            # Don't scan cache file content
            continue

        # B. Check for config files (CONF-01 to CONF-03)
        is_config, rule_id = is_config_file(file_path)
        if is_config:
            issues.append(create_issue(
                rule_id=rule_id,
                severity='medium',
                file_path=rel_path,
                line_number=0,
                content='<config file>',
                suggestion='Remove from commit or add to .gitignore'
            ))

        # C. Scan content for sensitive information (SENS-01 to SENS-06)
        # Use Phase 6 rules to scan file content
        sensitive_rules = [
            AWS_ACCESS_KEY_RULE,
            AWS_SECRET_KEY_RULE,
            GITHUB_TOKEN_RULE,
            GENERIC_API_KEY_RULE,
            SSH_KEY_RULE,
        ]

        for rule in sensitive_rules:
            matches = rule.pattern.finditer(content)
            for match in matches:
                # Extract matched text
                matched_text = match.group(0)

                # Find line number
                line_num = content[:match.start()].count('\n') + 1

                # Extract context (CONTEXT.md requirement: show surrounding lines)
                # Get 2 lines before and after the issue
                lines = content.split('\n')
                context_start = max(0, line_num - 3)  # 2 lines before
                context_end = min(len(lines), line_num + 2)  # 2 lines after

                # Note: For now, we only store the matched text in content_snippet
                # Full context display will be implemented in reporter.py enhancement
                # This keeps the initial implementation simple while allowing future expansion

                issues.append(create_issue(
                    rule_id=rule.rule_id,
                    severity='critical',
                    file_path=rel_path,
                    line_number=line_num,
                    content=matched_text,
                    suggestion=f'Remove {rule.description} or use environment variable'
                ))

        # D. Scan for sensitive fields in config files (CONF-03)
        if is_config:
            field_issues = scan_config_content(content)
            for field_name, masked_value, line_num in field_issues:
                issues.append(create_issue(
                    rule_id='CONF-03',
                    severity='high',
                    file_path=rel_path,
                    line_number=line_num,
                    content=f'{field_name}={masked_value}',
                    suggestion=f'Remove {field_name} field or use environment variable'
                ))

    # 6. Print report and return results
    print_scan_report(issues)

    success = len(issues) == 0
    return success, issues


def main():
    """CLI entry point for testing"""
    import sys

    print("Starting pre-commit scan...")
    success, issues = run_pre_commit_scan()

    if success:
        print("✓ Scan passed. No issues detected.")
        sys.exit(0)
    else:
        print(f"✗ Scan failed. Found {len(issues)} issue(s).")
        sys.exit(1)


if __name__ == '__main__':
    main()
