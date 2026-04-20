#!/usr/bin/env python3
"""
Test suite for flags.py - check_notification_flags() with find-up traversal.

Tests upward directory traversal for .no-xxx flag detection:
- Parent directory detection
- Grandparent directory detection
- CLAUDE.md as project root marker
- Filesystem root detection
- Max depth 10 limit
- Channel independence (D-02/D-03)
- Return value structure
"""

import unittest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add hooks/scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'hooks' / 'scripts'))

from flags import check_notification_flags, find_project_root, get_project_name, get_git_branch, build_notification_title


class TestCheckNotificationFlags(unittest.TestCase):
    """Test flags.py check_notification_flags() with upward traversal."""

    def _setup_safe_global_home(self, mock_path_class):
        """Configure mock Path.home() so global fallback finds no flags.

        Without this, mock_path_class.home() returns a generic MagicMock
        whose chained .is_file() returns a truthy MagicMock, causing
        existing tests to falsely detect global flags.
        """
        mock_home = MagicMock()
        mock_claude_dir = MagicMock()

        def claude_dir_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_claude_dir.__truediv__ = claude_dir_div
        mock_home.__truediv__ = lambda self, key: mock_claude_dir
        mock_path_class.home.return_value = mock_home

    @patch('flags.Path')
    def test_no_flags_no_claude_md(self, mock_path_class):
        """CWD has no flags, parent has none, filesystem root stops traversal."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['pushover_path'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_pushover_in_parent(self, mock_path_class):
        """CWD has nothing, parent has .no-pushover."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_windows_in_parent(self, mock_path_class):
        """CWD has nothing, parent has .no-windows."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        windows_in_parent = MagicMock()
        windows_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-windows':
                return windows_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertIsNone(result['pushover_path'])
        self.assertTrue(result['windows_disabled'])
        self.assertEqual(result['windows_path'], windows_in_parent)

    @patch('flags.Path')
    def test_both_in_parent(self, mock_path_class):
        """Both .no-pushover and .no-windows in parent."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True
        windows_in_parent = MagicMock()
        windows_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            if key == '.no-windows':
                return windows_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertTrue(result['windows_disabled'])
        self.assertEqual(result['windows_path'], windows_in_parent)

    @patch('flags.Path')
    def test_pushover_cwd_windows_parent(self, mock_path_class):
        """ .no-pushover in CWD, .no-windows in parent."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        pushover_in_cwd = MagicMock()
        pushover_in_cwd.is_file.return_value = True
        windows_in_parent = MagicMock()
        windows_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            if key == '.no-pushover':
                return pushover_in_cwd
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-windows':
                return windows_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_cwd)
        self.assertTrue(result['windows_disabled'])
        self.assertEqual(result['windows_path'], windows_in_parent)

    @patch('flags.Path')
    def test_flags_in_grandparent(self, mock_path_class):
        """CWD = /a/b/c, .no-pushover at /a (grandparent)."""
        # Build chain: mock_cwd -> mock_level1 -> mock_level2 (grandparent with .no-pushover)
        mock_cwd = MagicMock()
        mock_level1 = MagicMock()
        mock_level2 = MagicMock()
        # level2 is grandparent, its parent is root (self)
        mock_level2.parent = mock_level2

        mock_cwd.parent = mock_level1
        mock_level1.parent = mock_level2

        pushover_in_gp = MagicMock()
        pushover_in_gp.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def level1_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def level2_div(self, key):
            if key == '.no-pushover':
                return pushover_in_gp
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_level1.__truediv__ = level1_div
        mock_level2.__truediv__ = level2_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_gp)
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_claude_md_stops_search(self, mock_path_class):
        """CWD has nothing, parent has CLAUDE.md but no .no-xxx. Search stops at parent."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        claude_md = MagicMock()
        claude_md.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == 'CLAUDE.md':
                return claude_md
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['pushover_path'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_claude_md_with_no_pushover_same_dir(self, mock_path_class):
        """Parent has BOTH CLAUDE.md AND .no-pushover. .no-pushover takes priority (D-02).
        Windows search continues upward past this CLAUDE.md."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_grandparent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_grandparent
        mock_grandparent.parent = mock_grandparent  # root stops traversal

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True
        claude_md = MagicMock()
        claude_md.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            if key == 'CLAUDE.md':
                return claude_md
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def grandparent_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_grandparent.__truediv__ = grandparent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_claude_md_with_no_pushover_stops_windows_search(self, mock_path_class):
        """Parent has CLAUDE.md AND .no-pushover. Windows search continues past parent.
        Grandparent has .no-windows. Result: pushover at parent, windows at grandparent."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_grandparent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_grandparent
        mock_grandparent.parent = mock_grandparent  # root stops traversal

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True
        claude_md = MagicMock()
        claude_md.is_file.return_value = True
        windows_in_grandparent = MagicMock()
        windows_in_grandparent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            if key == 'CLAUDE.md':
                return claude_md
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def grandparent_div(self, key):
            if key == '.no-windows':
                return windows_in_grandparent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_grandparent.__truediv__ = grandparent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertTrue(result['windows_disabled'])
        self.assertEqual(result['windows_path'], windows_in_grandparent)

    @patch('flags.Path')
    def test_max_depth_10(self, mock_path_class):
        """Chain of 11 directories. .no-pushover at depth 11. NOT found because max_depth=10."""
        # Build 12 levels (depth 0 to 11), level 12 is root (self-parent)
        levels = []
        for i in range(12):
            m = MagicMock()
            levels.append(m)

        # Chain: levels[0].parent = levels[1], ..., levels[11].parent = levels[11] (root)
        for i in range(11):
            levels[i].parent = levels[i + 1]
        levels[11].parent = levels[11]  # root stops traversal

        # .no-pushover only at level 11 (depth 11 from CWD)
        pushover_deep = MagicMock()
        pushover_deep.is_file.return_value = True

        for i in range(12):
            level = levels[i]
            if i == 11:
                # Depth 11 - has .no-pushover but should NOT be reached
                def make_div(idx):
                    def div_fn(self, key):
                        if key == '.no-pushover':
                            return pushover_deep
                        m = MagicMock()
                        m.is_file.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_div(i)
            else:
                def make_empty_div(idx):
                    def div_fn(self, key):
                        m = MagicMock()
                        m.is_file.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_empty_div(i)

        mock_path_class.cwd.return_value = levels[0]
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['pushover_path'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_filesystem_root_stops(self, mock_path_class):
        """CWD is filesystem root (parent == self). No flags found."""
        mock_root = MagicMock()
        mock_root.parent = mock_root  # filesystem root: parent == self

        def root_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_root.__truediv__ = root_div
        mock_path_class.cwd.return_value = mock_root
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['pushover_path'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_return_structure_includes_paths(self, mock_path_class):
        """Verify return dict has exactly 6 keys with correct types."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd
        self._setup_safe_global_home(mock_path_class)

        result = check_notification_flags()

        # Verify exactly 6 keys (4 original + 2 global)
        self.assertEqual(set(result.keys()), {
            'pushover_disabled', 'windows_disabled',
            'pushover_path', 'windows_path',
            'global_pushover_path', 'global_windows_path'
        })

        # Verify types
        self.assertIsInstance(result['pushover_disabled'], bool)
        self.assertIsInstance(result['windows_disabled'], bool)
        self.assertTrue(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])

        # pushover_path should be the found mock, windows_path should be None
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertIsNone(result['windows_path'])

        # global fields should be None (no global flags set up)
        self.assertIsNone(result['global_pushover_path'])
        self.assertIsNone(result['global_windows_path'])

    @patch('flags.Path')
    def test_global_pushover_only(self, mock_path_class):
        """Global ~/.claude/.no-pushover exists, no project-level flags -> pushover disabled."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        # Mock Path.home() -> ~/.claude/.no-pushover exists
        mock_home = MagicMock()
        mock_claude_dir = MagicMock()
        mock_global_pushover = MagicMock()
        mock_global_pushover.is_file.return_value = True
        mock_global_windows = MagicMock()
        mock_global_windows.is_file.return_value = False

        def claude_dir_div(self, key):
            if key == '.no-pushover':
                return mock_global_pushover
            if key == '.no-windows':
                return mock_global_windows
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_claude_dir.__truediv__ = claude_dir_div
        mock_home.__truediv__ = lambda self, key: mock_claude_dir
        mock_path_class.home.return_value = mock_home

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['global_pushover_path'], mock_global_pushover)
        self.assertIsNone(result['pushover_path'])
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['global_windows_path'])

    @patch('flags.Path')
    def test_global_windows_only(self, mock_path_class):
        """Global ~/.claude/.no-windows exists, no project-level flags -> windows disabled."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        # Mock Path.home() -> ~/.claude/.no-windows exists
        mock_home = MagicMock()
        mock_claude_dir = MagicMock()
        mock_global_pushover = MagicMock()
        mock_global_pushover.is_file.return_value = False
        mock_global_windows = MagicMock()
        mock_global_windows.is_file.return_value = True

        def claude_dir_div_windows(self, key):
            if key == '.no-pushover':
                return mock_global_pushover
            if key == '.no-windows':
                return mock_global_windows
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_claude_dir.__truediv__ = claude_dir_div_windows
        mock_home.__truediv__ = lambda self, key: mock_claude_dir
        mock_path_class.home.return_value = mock_home

        result = check_notification_flags()

        self.assertTrue(result['windows_disabled'])
        self.assertEqual(result['global_windows_path'], mock_global_windows)
        self.assertIsNone(result['windows_path'])
        self.assertFalse(result['pushover_disabled'])
        self.assertIsNone(result['global_pushover_path'])

    @patch('flags.Path')
    def test_project_level_takes_priority(self, mock_path_class):
        """Project-level .no-pushover AND global .no-pushover -> project-level wins."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        # Global also has .no-pushover, but project-level already disabled it
        mock_home = MagicMock()
        mock_claude_dir = MagicMock()
        mock_global_pushover = MagicMock()
        mock_global_pushover.is_file.return_value = True

        def claude_dir_div_priority(self, key):
            if key == '.no-pushover':
                return mock_global_pushover
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_claude_dir.__truediv__ = claude_dir_div_priority
        mock_home.__truediv__ = lambda self, key: mock_claude_dir
        mock_path_class.home.return_value = mock_home

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        # Project-level path, not global
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        # Global not checked because project-level already disabled
        self.assertIsNone(result['global_pushover_path'])

    @patch('flags.Path')
    def test_mixed_project_and_global(self, mock_path_class):
        """Project-level .no-pushover + global .no-windows -> mixed sources."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        pushover_in_parent = MagicMock()
        pushover_in_parent.is_file.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            if key == '.no-pushover':
                return pushover_in_parent
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        # Global has .no-windows only
        mock_home = MagicMock()
        mock_claude_dir = MagicMock()
        mock_global_pushover = MagicMock()
        mock_global_pushover.is_file.return_value = False
        mock_global_windows = MagicMock()
        mock_global_windows.is_file.return_value = True

        def claude_dir_div_mixed(self, key):
            if key == '.no-pushover':
                return mock_global_pushover
            if key == '.no-windows':
                return mock_global_windows
            m = MagicMock()
            m.is_file.return_value = False
            return m

        mock_claude_dir.__truediv__ = claude_dir_div_mixed
        mock_home.__truediv__ = lambda self, key: mock_claude_dir
        mock_path_class.home.return_value = mock_home

        result = check_notification_flags()

        # Pushover from project level
        self.assertTrue(result['pushover_disabled'])
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertIsNone(result['global_pushover_path'])
        # Windows from global level
        self.assertTrue(result['windows_disabled'])
        self.assertIsNone(result['windows_path'])
        self.assertEqual(result['global_windows_path'], mock_global_windows)


class TestFindProjectRoot(unittest.TestCase):
    """Test find_project_root() upward traversal for project root detection."""

    @patch('flags.Path')
    def test_git_in_cwd(self, mock_path_class):
        """CWD has .git directory -> returns CWD Path object."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        git_dir = MagicMock()
        git_dir.is_dir.return_value = True
        git_dir.is_file.return_value = False
        git_dir.exists.return_value = True

        def cwd_div(self, key):
            if key == '.git':
                return git_dir
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertEqual(result, mock_cwd)

    @patch('flags.Path')
    def test_claude_md_in_cwd(self, mock_path_class):
        """CWD has CLAUDE.md file -> returns CWD Path object."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        claude_md = MagicMock()
        claude_md.is_file.return_value = True
        claude_md.is_dir.return_value = False

        def cwd_div(self, key):
            if key == 'CLAUDE.md':
                return claude_md
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertEqual(result, mock_cwd)

    @patch('flags.Path')
    def test_git_in_parent(self, mock_path_class):
        """Parent has .git directory -> returns parent Path object."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        git_dir = MagicMock()
        git_dir.is_dir.return_value = True
        git_dir.is_file.return_value = False
        git_dir.exists.return_value = True

        def cwd_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        def parent_div(self, key):
            if key == '.git':
                return git_dir
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertEqual(result, mock_parent)

    @patch('flags.Path')
    def test_claude_md_in_parent(self, mock_path_class):
        """Parent has CLAUDE.md file -> returns parent Path object."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        claude_md = MagicMock()
        claude_md.is_file.return_value = True
        claude_md.is_dir.return_value = False

        def cwd_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        def parent_div(self, key):
            if key == 'CLAUDE.md':
                return claude_md
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertEqual(result, mock_parent)

    @patch('flags.Path')
    def test_git_priority_over_claude_md(self, mock_path_class):
        """CWD has both .git (is_dir=True) and CLAUDE.md (is_file=True) -> returns CWD (first check wins)."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        git_dir = MagicMock()
        git_dir.is_dir.return_value = True
        git_dir.is_file.return_value = False
        git_dir.exists.return_value = True

        claude_md = MagicMock()
        claude_md.is_file.return_value = True
        claude_md.is_dir.return_value = False

        def cwd_div(self, key):
            if key == '.git':
                return git_dir
            if key == 'CLAUDE.md':
                return claude_md
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertEqual(result, mock_cwd)

    @patch('flags.Path')
    def test_nested_project_returns_closest(self, mock_path_class):
        """Nested project: .git at depth 2, another marker at depth 5 -> returns depth 2 directory."""
        # Build 6-level chain: level[0]=CWD, level[1]=depth1, ..., level[5]=depth5
        # level[5].parent = level[5] (root stops traversal)
        levels = []
        for i in range(6):
            m = MagicMock()
            m.name = f"level{i}"
            levels.append(m)

        for i in range(5):
            levels[i].parent = levels[i + 1]
        levels[5].parent = levels[5]  # root stops traversal

        # .git at level 2 (depth 2 from CWD)
        git_at_2 = MagicMock()
        git_at_2.is_dir.return_value = True
        git_at_2.is_file.return_value = False
        git_at_2.exists.return_value = True

        # CLAUDE.md at level 5 (depth 5 from CWD) - should NOT be reached
        claude_at_5 = MagicMock()
        claude_at_5.is_file.return_value = True
        claude_at_5.is_dir.return_value = False

        for i in range(6):
            level = levels[i]
            if i == 2:
                def make_div_with_git(idx):
                    def div_fn(self, key):
                        if key == '.git':
                            return git_at_2
                        m = MagicMock()
                        m.is_dir.return_value = False
                        m.is_file.return_value = False
                        m.exists.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_div_with_git(i)
            elif i == 5:
                def make_div_with_claude(idx):
                    def div_fn(self, key):
                        if key == 'CLAUDE.md':
                            return claude_at_5
                        m = MagicMock()
                        m.is_dir.return_value = False
                        m.is_file.return_value = False
                        m.exists.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_div_with_claude(i)
            else:
                def make_empty_div(idx):
                    def div_fn(self, key):
                        m = MagicMock()
                        m.is_dir.return_value = False
                        m.is_file.return_value = False
                        m.exists.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_empty_div(i)

        mock_path_class.cwd.return_value = levels[0]

        result = find_project_root()

        self.assertEqual(result, levels[2])

    @patch('flags.Path')
    def test_no_markers_returns_none(self, mock_path_class):
        """No .git or CLAUDE.md anywhere -> returns None."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        def cwd_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertIsNone(result)

    @patch('flags.Path')
    def test_max_depth_limit(self, mock_path_class):
        """Marker only at depth 11 -> returns None (max_depth=10 stops traversal)."""
        # Build 12 levels (depth 0 to 11), level 12 is root (self-parent)
        levels = []
        for i in range(12):
            m = MagicMock()
            levels.append(m)

        for i in range(11):
            levels[i].parent = levels[i + 1]
        levels[11].parent = levels[11]  # root stops traversal

        # .git only at level 11 (depth 11 from CWD) - should NOT be reached
        git_deep = MagicMock()
        git_deep.is_dir.return_value = True
        git_deep.is_file.return_value = False
        git_deep.exists.return_value = True

        for i in range(12):
            level = levels[i]
            if i == 11:
                def make_div_with_git(idx):
                    def div_fn(self, key):
                        if key == '.git':
                            return git_deep
                        m = MagicMock()
                        m.is_dir.return_value = False
                        m.is_file.return_value = False
                        m.exists.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_div_with_git(i)
            else:
                def make_empty_div(idx):
                    def div_fn(self, key):
                        m = MagicMock()
                        m.is_dir.return_value = False
                        m.is_file.return_value = False
                        m.exists.return_value = False
                        return m
                    return div_fn
                level.__truediv__ = make_empty_div(i)

        mock_path_class.cwd.return_value = levels[0]

        result = find_project_root()

        self.assertIsNone(result)

    @patch('flags.Path')
    def test_filesystem_root_stops(self, mock_path_class):
        """CWD is filesystem root (parent == self), no markers -> returns None."""
        mock_root = MagicMock()
        mock_root.parent = mock_root  # filesystem root: parent == self

        def root_div(self, key):
            m = MagicMock()
            m.is_dir.return_value = False
            m.is_file.return_value = False
            m.exists.return_value = False
            return m

        mock_root.__truediv__ = root_div
        mock_path_class.cwd.return_value = mock_root

        result = find_project_root()

        self.assertIsNone(result)


class TestGetProjectName(unittest.TestCase):
    """Test get_project_name() returns correct directory name."""

    @patch('flags.find_project_root')
    @patch('flags.Path')
    def test_returns_dir_name(self, mock_path_class, mock_find_root):
        """find_project_root returns mock with .name='my-project' -> returns 'my-project'."""
        mock_root = MagicMock()
        mock_root.name = "my-project"
        mock_find_root.return_value = mock_root

        result = get_project_name()

        self.assertEqual(result, "my-project")

    @patch('flags.find_project_root')
    @patch('flags.Path')
    def test_fallback_to_cwd_basename(self, mock_path_class, mock_find_root):
        """find_project_root returns None, cwd has .name='fallback-dir' -> returns 'fallback-dir'."""
        mock_find_root.return_value = None
        mock_cwd = MagicMock()
        mock_cwd.name = "fallback-dir"
        mock_path_class.cwd.return_value = mock_cwd

        result = get_project_name()

        self.assertEqual(result, "fallback-dir")

    @patch('flags.find_project_root')
    @patch('flags.Path')
    def test_name_with_spaces(self, mock_path_class, mock_find_root):
        """Project root .name='my project' -> returns 'my project'."""
        mock_root = MagicMock()
        mock_root.name = "my project"
        mock_find_root.return_value = mock_root

        result = get_project_name()

        self.assertEqual(result, "my project")

    @patch('flags.find_project_root')
    @patch('flags.Path')
    def test_name_with_chinese(self, mock_path_class, mock_find_root):
        """Project root .name with Chinese chars -> returns name correctly."""
        mock_root = MagicMock()
        mock_root.name = "my-project"
        mock_find_root.return_value = mock_root

        result = get_project_name()

        self.assertEqual(result, "my-project")


import subprocess


class TestGetGitBranch(unittest.TestCase):
    """Test get_git_branch() git branch detection."""

    @patch('flags.subprocess.run')
    def test_returns_branch_name(self, mock_run):
        """git branch --show-current returns branch name."""
        mock_run.return_value = MagicMock(returncode=0, stdout="feature-branch\n")
        result = get_git_branch()
        self.assertEqual(result, "feature-branch")

    @patch('flags.subprocess.run')
    def test_returns_none_not_git_repo(self, mock_run):
        """Non git directory returns None (exit code 128)."""
        mock_run.return_value = MagicMock(returncode=128, stdout="")
        result = get_git_branch()
        self.assertIsNone(result)

    @patch('flags.subprocess.run')
    def test_returns_none_detached_head(self, mock_run):
        """DETACHED HEAD returns None (stdout is whitespace)."""
        mock_run.return_value = MagicMock(returncode=0, stdout="\n")
        result = get_git_branch()
        self.assertIsNone(result)

    @patch('flags.subprocess.run')
    def test_returns_none_git_not_found(self, mock_run):
        """Git not in PATH raises FileNotFoundError -> returns None."""
        mock_run.side_effect = FileNotFoundError
        result = get_git_branch()
        self.assertIsNone(result)

    @patch('flags.subprocess.run')
    def test_returns_none_timeout(self, mock_run):
        """Git command timeout -> returns None."""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd='git', timeout=1)
        result = get_git_branch()
        self.assertIsNone(result)

    @patch('flags.subprocess.run')
    def test_branch_with_special_characters(self, mock_run):
        """Branch name with special characters returned correctly."""
        mock_run.return_value = MagicMock(returncode=0, stdout="feature/JIRA-123:fix\n")
        result = get_git_branch()
        self.assertEqual(result, "feature/JIRA-123:fix")


class TestBuildNotificationTitle(unittest.TestCase):
    """Test build_notification_title() title formatting."""

    def test_with_branch(self):
        """Branch present -> [project:branch]."""
        self.assertEqual(build_notification_title("my-project", "feature-x"), "[my-project:feature-x]")

    def test_without_branch(self):
        """No branch -> [project]."""
        self.assertEqual(build_notification_title("my-project", None), "[my-project]")

    def test_empty_branch(self):
        """Empty string branch -> [project]."""
        self.assertEqual(build_notification_title("my-project", ""), "[my-project]")

    def test_with_branch_and_suffix(self):
        """Branch and suffix -> [project:branch] suffix."""
        self.assertEqual(
            build_notification_title("my-project", "feature-x", suffix="Attention Needed"),
            "[my-project:feature-x] Attention Needed"
        )

    def test_without_branch_with_suffix(self):
        """No branch with suffix -> [project] suffix."""
        self.assertEqual(
            build_notification_title("my-project", None, suffix="Attention Needed"),
            "[my-project] Attention Needed"
        )

    def test_with_branch_no_suffix(self):
        """Branch with no suffix -> [project:branch]."""
        self.assertEqual(build_notification_title("my-project", "main", suffix=None), "[my-project:main]")

    def test_special_char_branch_in_title(self):
        """Branch with special chars in title."""
        self.assertEqual(
            build_notification_title("proj", "feature/JIRA-123:fix"),
            "[proj:feature/JIRA-123:fix]"
        )


class TestFindProjectRootWorktree(unittest.TestCase):
    """Test find_project_root() in git worktree scenario (.git is file, not directory)."""

    @patch('flags.Path')
    def test_worktree_git_file_not_dir(self, mock_path_class):
        """In worktree, .git is a file (exists=True, is_dir=False) -> still returns CWD."""
        mock_cwd = MagicMock()
        mock_parent = MagicMock()
        mock_cwd.parent = mock_parent
        mock_parent.parent = mock_parent  # root stops traversal

        git_path = MagicMock()
        git_path.exists.return_value = True
        git_path.is_dir.return_value = False
        git_path.is_file.return_value = True

        def cwd_div(self, key):
            if key == '.git':
                return git_path
            m = MagicMock()
            m.exists.return_value = False
            m.is_dir.return_value = False
            m.is_file.return_value = False
            return m

        def parent_div(self, key):
            m = MagicMock()
            m.exists.return_value = False
            m.is_dir.return_value = False
            m.is_file.return_value = False
            return m

        mock_cwd.__truediv__ = cwd_div
        mock_parent.__truediv__ = parent_div
        mock_path_class.cwd.return_value = mock_cwd

        result = find_project_root()

        self.assertEqual(result, mock_cwd)


if __name__ == '__main__':
    unittest.main(verbosity=2)
