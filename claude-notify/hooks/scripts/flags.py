"""
Shared notification flag detection module with upward directory traversal.

Provides check_notification_flags() that searches from CWD upward through
parent directories for .no-pushover and .no-windows flag files.

Traversal rules (per D-01 through D-05):
1. Start at CWD, check .no-pushover and .no-windows at each level
2. Each channel tracked independently (D-02 strict reading)
3. If CLAUDE.md found at a level where NEITHER .no-xxx was found, stop entirely (D-03)
4. If CLAUDE.md found but one .no-xxx WAS found, continue searching for the other channel
5. Maximum 10 levels (D-04)
6. Stop at filesystem root (parent == self)
"""

import logging
import subprocess
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)


def check_notification_flags() -> Dict:
    """
    Check for notification disable flags, searching from CWD upward.

    At each directory level, checks for .no-pushover and .no-windows files.
    Each channel is tracked independently -- finding one does not stop the
    search for the other (D-02).

    Stops searching when:
    - Both channels found (early exit)
    - CLAUDE.md found and no .no-xxx found at that level (D-03)
    - Filesystem root reached (parent == self)
    - Maximum traversal depth (10) exceeded

    Returns:
        dict: {
            'pushover_disabled': bool,
            'windows_disabled': bool,
            'pushover_path': Optional[Path],          # Path to found .no-pushover (project-level)
            'windows_path': Optional[Path],           # Path to found .no-windows (project-level)
            'global_pushover_path': Optional[Path],   # Path to ~/.claude/.no-pushover if global flag found
            'global_windows_path': Optional[Path]     # Path to ~/.claude/.no-windows if global flag found
        }
    """
    current = Path.cwd()
    depth = 0
    max_depth = 10

    pushover_disabled = False
    windows_disabled = False
    pushover_path = None
    windows_path = None

    while depth <= max_depth:
        # Track what we find at this level
        found_pushover_this_level = False
        found_windows_this_level = False

        # Check pushover flag at current level
        if not pushover_disabled:
            flag = current / '.no-pushover'
            if flag.is_file():
                pushover_disabled = True
                pushover_path = flag
                found_pushover_this_level = True

        # Check windows flag at current level (independent channel)
        if not windows_disabled:
            flag = current / '.no-windows'
            if flag.is_file():
                windows_disabled = True
                windows_path = flag
                found_windows_this_level = True

        # Both found, no need to continue
        if pushover_disabled and windows_disabled:
            break

        # Check for CLAUDE.md project root marker
        has_claude_md = (current / 'CLAUDE.md').is_file()

        # D-02/D-03: CLAUDE.md only stops search when NO .no-xxx found at this level
        if has_claude_md and not found_pushover_this_level and not found_windows_this_level:
            break

        # Move up to parent directory
        parent = current.parent
        if parent == current:  # filesystem root
            break
        current = parent
        depth += 1

    # Log results
    if pushover_disabled:
        logger.info(f"Pushover disabled by {pushover_path}")
    if windows_disabled:
        logger.info(f"Windows disabled by {windows_path}")

    # Global fallback: check ~/.claude/.no-xxx for channels not found at project level (D-11)
    global_dir = Path.home() / '.claude'
    global_pushover_path = None
    global_windows_path = None

    if not pushover_disabled:
        global_flag = global_dir / '.no-pushover'
        if global_flag.is_file():
            pushover_disabled = True
            global_pushover_path = global_flag
            logger.info(f"Pushover disabled by global flag {global_flag}")

    if not windows_disabled:
        global_flag = global_dir / '.no-windows'
        if global_flag.is_file():
            windows_disabled = True
            global_windows_path = global_flag
            logger.info(f"Windows disabled by global flag {global_flag}")

    return {
        'pushover_disabled': pushover_disabled,
        'windows_disabled': windows_disabled,
        'pushover_path': pushover_path,
        'windows_path': windows_path,
        'global_pushover_path': global_pushover_path,
        'global_windows_path': global_windows_path,
    }


def find_project_root():
    """
    Find the project root directory by searching upward from CWD.

    Looks for .git (directory or file for worktree support) or CLAUDE.md file as project root markers.
    Returns the first (closest) directory containing either marker.

    Traversal stops when:
    - .git directory or CLAUDE.md file is found
    - Filesystem root is reached (parent == self)
    - Maximum traversal depth (10) exceeded

    Returns:
        Optional[Path]: The project root directory, or None if no markers found
    """
    current = Path.cwd()
    depth = 0
    max_depth = 10

    while depth <= max_depth:
        # Check for .git directory (standard git repo)
        if (current / '.git').exists():
            return current

        # Check for CLAUDE.md file (Claude Code project marker)
        if (current / 'CLAUDE.md').is_file():
            return current

        # Move up to parent directory
        parent = current.parent
        if parent == current:  # filesystem root
            break
        current = parent
        depth += 1

    return None


def get_project_name():
    """
    Get the current project name by finding the project root directory.

    Returns the directory name of the project root. Falls back to
    the current working directory's basename if no project root
    markers (.git or CLAUDE.md) are found.

    Returns:
        str: Project name (directory name)
    """
    root = find_project_root()
    if root is not None:
        return root.name
    return Path.cwd().name


def get_git_branch() -> Optional[str]:
    """
    Get current git branch name.

    Uses 'git branch --show-current' which correctly handles:
    - Normal branches: returns branch name
    - DETACHED HEAD: returns empty string (exit 0)
    - Not a git repo: exit code 128
    - Worktrees: returns the worktree's checked-out branch

    Returns:
        Optional[str]: Branch name or None if not available
    """
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True,
            text=True,
            timeout=1,
            encoding='utf-8',
            stderr=subprocess.DEVNULL
        )
        if result.returncode == 0 and result.stdout.strip():
            branch = result.stdout.strip()
            logger.info(f"Detected git branch: {branch}")
            return branch
        return None
    except subprocess.TimeoutExpired:
        logger.warning("Git branch detection timeout (1s)")
        return None
    except FileNotFoundError:
        logger.warning("Git not found in PATH")
        return None
    except Exception as e:
        logger.error(f"Failed to detect git branch: {e}")
        return None


def build_notification_title(project_name: str, git_branch: Optional[str] = None, suffix: Optional[str] = None) -> str:
    """
    Build notification title with optional git branch and suffix.

    Consolidates title formatting for both stop and attention hooks
    to avoid duplication (per WTREE-01, D-01, D-02).

    Args:
        project_name: Project name (from get_project_name())
        git_branch: Git branch name (from get_git_branch()), None for no branch
        suffix: Optional suffix like "Attention Needed"

    Returns:
        str: "[project:branch] suffix" or "[project] suffix" or "[project:branch]" or "[project]"
    """
    if git_branch:
        title = f"[{project_name}:{git_branch}]"
    else:
        title = f"[{project_name}]"

    if suffix:
        title = f"{title} {suffix}"

    return title
