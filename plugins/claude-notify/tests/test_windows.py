import unittest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root / '.claude' / 'hooks'))

class TestWindowsNotification(unittest.TestCase):
    """Test Windows Toast notification."""

    @patch('notify.subprocess.run')
    def test_send_windows_notification_success(self, mock_run):
        """Test successful Windows Toast notification."""
        mock_run.return_value = MagicMock(returncode=0, stderr='')

        from notify import send_windows_notification
        result = send_windows_notification('Test Title', 'Test Message')

        self.assertTrue(result)

        # Verify PowerShell was called
        self.assertEqual(mock_run.call_count, 1)
        args = mock_run.call_args
        self.assertEqual(args[0][0][0], 'powershell')
        self.assertEqual(args[0][0][1], '-Command')

        # Verify timeout is set
        self.assertEqual(args[1].get('timeout'), 1)

    @patch('notify.subprocess.run')
    def test_send_windows_notification_timeout(self, mock_run):
        """Test Windows Toast timeout handling."""
        from subprocess import TimeoutExpired
        mock_run.side_effect = TimeoutExpired(cmd='powershell', timeout=1)

        from notify import send_windows_notification
        result = send_windows_notification('Test Title', 'Test Message')

        self.assertFalse(result)

    @patch('notify.subprocess.run')
    def test_send_windows_notification_error(self, mock_run):
        """Test Windows Toast error handling."""
        mock_run.return_value = MagicMock(
            returncode=1,
            stderr='PowerShell error'
        )

        from notify import send_windows_notification
        result = send_windows_notification('Test Title', 'Test Message')

        self.assertFalse(result)

    @patch('notify.subprocess.run')
    def test_send_windows_notification_with_special_chars(self, mock_run):
        """Test Windows Toast with special characters in message."""
        mock_run.return_value = MagicMock(returncode=0, stderr='')

        from notify import send_windows_notification
        result = send_windows_notification('项目名称', '任务完成: 测试成功')

        self.assertTrue(result)

        # Verify special characters are handled in PowerShell command
        args = mock_run.call_args[0]
        command = args[0][2]  # PowerShell command string
        self.assertIn('项目名称', command)
        self.assertIn('任务完成', command)

    @patch('notify.subprocess.run')
    def test_send_windows_notification_with_spaces(self, mock_run):
        """Test Windows Toast with spaces in title and message."""
        mock_run.return_value = MagicMock(returncode=0, stderr='')

        from notify import send_windows_notification
        result = send_windows_notification('My Project Name', 'Task completed with success')

        self.assertTrue(result)

        # Verify spaces are preserved in PowerShell command
        args = mock_run.call_args[0]
        command = args[0][2]  # PowerShell command string
        self.assertIn('My Project Name', command)
        self.assertIn('Task completed with success', command)

if __name__ == '__main__':
    unittest.main(verbosity=2)
