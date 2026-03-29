"""
.gitignore pattern parser and file filter
Phase 7: Scanning Execution & Reporting
"""
import pathspec
from pathlib import Path
from typing import Optional


def load_gitignore_spec(repo_root: Path) -> pathspec.GitIgnoreSpec:
    """
    Load project-level and global .gitignore rules

    Loading order (later rules override earlier):
    1. Project .gitignore (<repo_root>/.gitignore)
    2. Global .gitignore (Windows: %USERPROFILE%\\.gitignore)
    3. Default excludes (always skip .git/)

    Args:
        repo_root: Git repository root directory

    Returns:
        Merged GitIgnoreSpec object
    """
    patterns = []

    # 1. Load project .gitignore
    project_gitignore = repo_root / '.gitignore'
    if project_gitignore.exists():
        with open(project_gitignore, 'r', encoding='utf-8', errors='ignore') as f:
            patterns.extend(f.read().splitlines())

    # 2. Load global .gitignore (Windows: %USERPROFILE%\\.gitignore)
    global_gitignore = Path.home() / '.gitignore'
    if global_gitignore.exists():
        with open(global_gitignore, 'r', encoding='utf-8', errors='ignore') as f:
            patterns.extend(f.read().splitlines())

    # 3. Add default excludes (always skip)
    default_excludes = [
        '.git/',
        '.gitignore',
    ]
    patterns.extend(default_excludes)

    # Use GitIgnoreSpec for correct gitignore semantics
    return pathspec.GitIgnoreSpec.from_lines(patterns)


def filter_staged_files(
    file_paths: list[Path],
    spec: pathspec.GitIgnoreSpec
) -> list[Path]:
    """
    Filter out files that should be ignored based on gitignore rules

    Args:
        file_paths: List of staged file paths (absolute or relative to repo root)
        spec: GitIgnoreSpec object from load_gitignore_spec()

    Returns:
        List of files that should NOT be skipped
    """
    return [f for f in file_paths if not spec.match_file(str(f))]
