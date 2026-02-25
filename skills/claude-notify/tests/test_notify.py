import unittest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root / '.claude' / 'hooks'))

from notify import get_project_name, get_claude_summary

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

    def test_get_project_name_with_chinese_chars(self):
        """Test project name with Chinese characters in path."""
        with patch('os.getcwd', return_value='C:/Users/Test/项目名称'):
            result = get_project_name()
            self.assertEqual(result, '项目名称')

    @patch('notify.subprocess.run')
    def test_claude_summary_success(self, mock_run):
        """Test successful summary generation."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='Completed task successfully'
        )

        result = get_claude_summary('test-project')
        self.assertEqual(result, 'Completed task successfully')

    @patch('notify.subprocess.run')
    def test_claude_summary_timeout_fallback(self, mock_run):
        """Test fallback message when Claude CLI times out."""
        from subprocess import TimeoutExpired
        mock_run.side_effect = TimeoutExpired(cmd='claude', timeout=2)

        result = get_claude_summary('test-project')
        self.assertEqual(result, '[test-project] Task completed')

    @patch('notify.subprocess.run')
    def test_claude_summary_error_fallback(self, mock_run):
        """Test fallback message when Claude CLI returns error."""
        mock_run.return_value = MagicMock(
            returncode=1,
            stderr='Claude CLI error'
        )

        result = get_claude_summary('test-project')
        self.assertEqual(result, '[test-project] Task completed')

    @patch('notify.subprocess.run')
    def test_claude_summary_empty_output_fallback(self, mock_run):
        """Test fallback message when Claude CLI returns empty output."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='   '
        )

        result = get_claude_summary('test-project')
        self.assertEqual(result, '[test-project] Task completed')

    @patch('notify.subprocess.run')
    def test_claude_summary_cli_not_found_fallback(self, mock_run):
        """Test fallback message when Claude CLI is not found."""
        mock_run.side_effect = FileNotFoundError('claude not found')

        result = get_claude_summary('test-project')
        self.assertEqual(result, '[test-project] Task completed')

    @patch('notify.subprocess.run')
    def test_claude_summary_truncates_long_output(self, mock_run):
        """Test that summary is truncated to 200 characters."""
        long_summary = 'A' * 300
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=long_summary
        )

        result = get_claude_summary('test-project')
        self.assertEqual(len(result), 200)
        self.assertEqual(result, 'A' * 200)

if __name__ == '__main__':
    unittest.main(verbosity=2)
