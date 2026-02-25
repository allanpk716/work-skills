"""
Scanning executor - orchestrates the pre-commit scan workflow
Phase 7: Scanning Execution & Reporting
"""
from pathlib import Path
from typing import List, Tuple
import subprocess

from scanner.utils.git_ops import get_staged_files, is_binary_file
from scanner.gitignore import load_gitignore_spec, filter_staged_files


def run_pre_commit_scan(repo_root: Path = None) -> Tuple[bool, List[dict]]:
    """
    Execute pre-commit scanning workflow

    Workflow:
    1. Detect repo root if not provided
    2. Load .gitignore exclusion rules
    3. Get staged files from git
    4. Filter out gitignore files
    5. Scan each file with Phase 6 rules (placeholder for now)
    6. Return scan result (pass/fail) and issue list

    Args:
        repo_root: Git repository root directory (auto-detect if None)

    Returns:
        Tuple of (success: bool, issues: List[dict])
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
    issues: List[dict] = []

    for file_path, content in staged_files:
        # Skip binary files (EXEC-04)
        if is_binary_file(file_path):
            continue

        # TODO: Phase 6 rule integration (placeholder)
        # For now, just count scanned files
        # Actual rule checking will be added in integration phase

    # 6. Return results
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
