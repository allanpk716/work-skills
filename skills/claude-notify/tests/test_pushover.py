import unittest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root / '.claude' / 'hooks'))

class TestPushoverNotification(unittest.TestCase):
    """Test Pushover API integration."""

    @patch('notify.requests.post')
    @patch.dict('os.environ', {'PUSHOVER_TOKEN': 'test_token_1234567890', 'PUSHOVER_USER': 'test_user_1234567890'})
    def test_send_pushover_success(self, mock_post):
        """Test successful Pushover notification."""
        mock_post.return_value = MagicMock(status_code=200)

        from notify import send_pushover_notification
        result = send_pushover_notification('Test Title', 'Test Message')

        self.assertTrue(result)
        mock_post.assert_called_once()

        # Verify API endpoint
        args, kwargs = mock_post.call_args
        self.assertIn('pushover.net', args[0])

        # Verify required fields
        data = kwargs.get('data', {})
        self.assertEqual(data.get('title'), 'Test Title')
        self.assertEqual(data.get('message'), 'Test Message')
        self.assertEqual(data.get('priority'), 0)

        # Verify timeout is set
        self.assertEqual(kwargs.get('timeout'), 2)

    @patch('notify.requests.post')
    @patch.dict('os.environ', {'PUSHOVER_TOKEN': 'test_token_1234567890', 'PUSHOVER_USER': 'test_user_1234567890'})
    def test_send_pushover_api_error(self, mock_post):
        """Test Pushover API error handling."""
        mock_post.return_value = MagicMock(
            status_code=400,
            text='Bad request'
        )

        from notify import send_pushover_notification
        result = send_pushover_notification('Test Title', 'Test Message')

        self.assertFalse(result)

    @patch('notify.requests.post')
    @patch.dict('os.environ', {'PUSHOVER_TOKEN': 'test_token_1234567890', 'PUSHOVER_USER': 'test_user_1234567890'})
    def test_send_pushover_timeout(self, mock_post):
        """Test Pushover API timeout handling."""
        from requests.exceptions import Timeout
        mock_post.side_effect = Timeout('Connection timeout')

        from notify import send_pushover_notification
        result = send_pushover_notification('Test Title', 'Test Message')

        self.assertFalse(result)

    @patch('notify.requests.post')
    def test_send_pushover_missing_token(self, mock_post):
        """Test Pushover with missing token."""
        with patch.dict('os.environ', {}, clear=False):
            # Remove PUSHOVER_TOKEN if it exists
            import os
            os.environ.pop('PUSHOVER_TOKEN', None)
            os.environ.pop('PUSHOVER_USER', None)

            from notify import send_pushover_notification
            result = send_pushover_notification('Test Title', 'Test Message')

            # Should return False when credentials are missing
            self.assertFalse(result)
            # Should NOT make API call
            mock_post.assert_not_called()

    @patch('notify.requests.post')
    @patch.dict('os.environ', {'PUSHOVER_TOKEN': 'test_token', 'PUSHOVER_USER': 'test_user'})
    def test_send_pushover_with_chinese_chars(self, mock_post):
        """Test Pushover with Chinese characters in message."""
        mock_post.return_value = MagicMock(status_code=200)

        from notify import send_pushover_notification
        result = send_pushover_notification('项目名称', '任务完成: 测试成功')

        self.assertTrue(result)

        # Verify Chinese characters are in payload
        args, kwargs = mock_post.call_args
        data = kwargs.get('data', {})
        self.assertEqual(data.get('title'), '项目名称')
        self.assertEqual(data.get('message'), '任务完成: 测试成功')

if __name__ == '__main__':
    unittest.main(verbosity=2)
