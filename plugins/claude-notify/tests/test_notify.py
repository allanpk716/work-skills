#!/usr/bin/env python3
"""
Test suite for core notify.py functionality.

Tests core functions: get_project_name, get_claude_summary, check_notification_flags, cleanup_old_logs
"""

import unittest
import sys
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

# Add hooks/scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'hooks' / 'scripts'))

from notify import get_project_name, get_claude_summary, check_notification_flags, cleanup_old_logs


class TestNotify(unittest.TestCase):
    """Test notify.py core functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.project_name = "test-project"

    def test_get_project_name_success(self):
        """Test project name extraction from current directory."""
        with patch('os.getcwd', return_value='/path/to/my-project'):
            result = get_project_name()
            self.assertEqual(result, 'my-project')

    def test_get_project_name_with_spaces(self):
        """Test project name with spaces in path."""
        with patch('os.getcwd', return_value='C:/Users/Test/My Project'):
            result = get_project_name()
            self.assertEqual(result, 'My Project')

    def test_get_project_name_with_chinese(self):
        """Test project name with Chinese characters."""
        with patch('os.getcwd', return_value='C:/Users/Test/测试项目'):
            result = get_project_name()
            self.assertEqual(result, '测试项目')

    @patch('subprocess.run')
    def test_claude_summary_success(self, mock_run):
        """Test successful summary generation."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='Completed task successfully'
        )

        result = get_claude_summary('test-project')
        self.assertEqual(result, 'Completed task successfully')

    @patch('subprocess.run')
    def test_claude_summary_truncation(self, mock_run):
        """Test summary truncation to 200 characters."""
        long_summary = 'A' * 300
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=long_summary
        )

        result = get_claude_summary('test-project')
        self.assertEqual(len(result), 200)
        self.assertEqual(result, 'A' * 200)

    @patch('subprocess.run')
    def test_claude_summary_timeout_fallback(self, mock_run):
        """Test fallback message when Claude CLI times out."""
        from subprocess import TimeoutExpired
        mock_run.side_effect = TimeoutExpired(cmd='claude', timeout=2)

        result = get_claude_summary('test-project')
        self.assertEqual(result, '[test-project] Task completed')

    @patch('subprocess.run')
    def test_claude_summary_error_fallback(self, mock_run):
        """Test fallback message when Claude CLI returns error."""
        mock_run.return_value = MagicMock(
            returncode=1,
            stderr='Claude CLI error'
        )

        result = get_claude_summary('test-project')
        self.assertEqual(result, '[test-project] Task completed')

    @patch('notify.Path')
    def test_check_notification_flags_none(self, mock_path_class):
        """Test notification flags when no control files exist."""
        mock_project_dir = MagicMock()
        mock_pushover = MagicMock()
        mock_pushover.is_file.return_value = False
        mock_windows = MagicMock()
        mock_windows.is_file.return_value = False

        mock_project_dir.__truediv__ = lambda self, key: (
            mock_pushover if key == '.no-pushover'
            else mock_windows if key == '.no-windows'
            else MagicMock()
        )

        mock_path_class.cwd.return_value = mock_project_dir

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])

    @patch('notify.Path')
    def test_check_notification_flags_pushover_disabled(self, mock_path_class):
        """Test notification flags when .no-pushover exists."""
        mock_project_dir = MagicMock()
        mock_pushover = MagicMock()
        mock_pushover.is_file.return_value = True
        mock_windows = MagicMock()
        mock_windows.is_file.return_value = False

        mock_project_dir.__truediv__ = lambda self, key: (
            mock_pushover if key == '.no-pushover'
            else mock_windows if key == '.no-windows'
            else MagicMock()
        )

        mock_path_class.cwd.return_value = mock_project_dir

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertFalse(result['windows_disabled'])

    @patch('notify.Path')
    def test_check_notification_flags_windows_disabled(self, mock_path_class):
        """Test notification flags when .no-windows exists."""
        mock_project_dir = MagicMock()
        mock_pushover = MagicMock()
        mock_pushover.is_file.return_value = False
        mock_windows = MagicMock()
        mock_windows.is_file.return_value = True

        mock_project_dir.__truediv__ = lambda self, key: (
            mock_pushover if key == '.no-pushover'
            else mock_windows if key == '.no-windows'
            else MagicMock()
        )

        mock_path_class.cwd.return_value = mock_project_dir

        result = check_notification_flags()

        self.assertFalse(result['pushover_disabled'])
        self.assertTrue(result['windows_disabled'])

    @patch('notify.Path')
    def test_check_notification_flags_both_disabled(self, mock_path_class):
        """Test notification flags when both control files exist."""
        mock_project_dir = MagicMock()
        mock_pushover = MagicMock()
        mock_pushover.is_file.return_value = True
        mock_windows = MagicMock()
        mock_windows.is_file.return_value = True

        mock_project_dir.__truediv__ = lambda self, key: (
            mock_pushover if key == '.no-pushover'
            else mock_windows if key == '.no-windows'
            else MagicMock()
        )

        mock_path_class.cwd.return_value = mock_project_dir

        result = check_notification_flags()

        self.assertTrue(result['pushover_disabled'])
        self.assertTrue(result['windows_disabled'])

    def test_cleanup_old_logs(self):
        """Test log cleanup removes old files."""
        import time

        # Setup
        current_time = time.time()

        # Create temporary test directory and files
        import tempfile
        import os

        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir)

            # Create old log file (6 days old) - MUST match pattern claude-notify-*.log
            old_file = log_dir / 'claude-notify-old.log'
            old_file.write_text('old log content')
            # Set mtime to 6 days ago
            old_time = current_time - (6 * 86400)
            os.utime(old_file, (old_time, old_time))

            # Create new log file (2 days old)
            new_file = log_dir / 'claude-notify-new.log'
            new_file.write_text('new log content')
            new_time = current_time - (2 * 86400)
            os.utime(new_file, (new_time, new_time))

            # Execute
            cleanup_old_logs(log_dir, days_to_keep=5)

            # Verify only old file is removed
            self.assertFalse(old_file.exists())
            self.assertTrue(new_file.exists())

    @patch('os.remove')
    def test_cleanup_old_logs_nonexistent_dir(self, mock_remove):
        """Test log cleanup with nonexistent directory."""
        mock_log_dir = MagicMock()
        mock_log_dir.exists.return_value = False

        # Should not raise exception
        cleanup_old_logs(mock_log_dir, days_to_keep=5)

        # Should not attempt to remove any files
        mock_remove.assert_not_called()


if __name__ == '__main__':
    unittest.main(verbosity=2)
