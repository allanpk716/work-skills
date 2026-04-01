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

from flags import check_notification_flags


class TestCheckNotificationFlags(unittest.TestCase):
    """Test flags.py check_notification_flags() with upward traversal."""

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

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])
        self.assertIsNone(result['pushover_path'])
        self.assertIsNone(result['windows_path'])

    @patch('flags.Path')
    def test_return_structure_includes_paths(self, mock_path_class):
        """Verify return dict has exactly 4 keys with correct types."""
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

        result = check_notification_flags()

        # Verify exactly 4 keys
        self.assertEqual(set(result.keys()), {
            'pushover_disabled', 'windows_disabled',
            'pushover_path', 'windows_path'
        })

        # Verify types
        self.assertIsInstance(result['pushover_disabled'], bool)
        self.assertIsInstance(result['windows_disabled'], bool)
        self.assertTrue(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])

        # pushover_path should be the found mock, windows_path should be None
        self.assertEqual(result['pushover_path'], pushover_in_parent)
        self.assertIsNone(result['windows_path'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
