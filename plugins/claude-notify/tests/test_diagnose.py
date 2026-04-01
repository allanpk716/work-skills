#!/usr/bin/env python3
"""
Tests for diagnose_configuration() display of flag detection results.

Tests that diagnose_configuration() correctly consumes check_notification_flags()
return dict and displays project-level paths, global paths, and source labels.
"""

import unittest
import io
import sys
from pathlib import Path
from unittest.mock import patch

# Add hooks/scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'hooks' / 'scripts'))

from notify import diagnose_configuration


def _make_flags(pushover_disabled=False, windows_disabled=False,
                pushover_path=None, windows_path=None,
                global_pushover_path=None, global_windows_path=None):
    """Helper to create check_notification_flags return value with real Path objects."""
    return {
        'pushover_disabled': pushover_disabled,
        'windows_disabled': windows_disabled,
        'pushover_path': pushover_path,
        'windows_path': windows_path,
        'global_pushover_path': global_pushover_path,
        'global_windows_path': global_windows_path,
    }


class TestDiagnoseConfiguration(unittest.TestCase):
    """Test diagnose_configuration() section [2] output."""

    @patch('notify.check_notification_flags')
    def test_project_level_flag_shown(self, mock_flags):
        """Flag found at project-level shows DISABLED with project-level label and path."""
        pushover_path = Path('/home/user/project/.no-pushover')
        mock_flags.return_value = _make_flags(
            pushover_disabled=True,
            pushover_path=pushover_path
        )

        captured = io.StringIO()
        with patch('sys.stdout', captured):
            diagnose_configuration()
        output = captured.getvalue()

        self.assertIn('DISABLED', output)
        self.assertIn('project-level', output)
        self.assertIn(str(pushover_path), output)

    @patch('notify.check_notification_flags')
    def test_global_flag_shown(self, mock_flags):
        """Flag found at global level shows DISABLED with global label."""
        global_windows_path = Path.home() / '.claude' / '.no-windows'
        mock_flags.return_value = _make_flags(
            windows_disabled=True,
            global_windows_path=global_windows_path
        )

        captured = io.StringIO()
        with patch('sys.stdout', captured):
            diagnose_configuration()
        output = captured.getvalue()

        self.assertIn('DISABLED', output)
        self.assertIn('global', output)

    @patch('notify.check_notification_flags')
    def test_no_flags_shows_enabled(self, mock_flags):
        """No flags found shows Enabled for both channels."""
        mock_flags.return_value = _make_flags()  # all defaults = False/None

        captured = io.StringIO()
        with patch('sys.stdout', captured):
            diagnose_configuration()
        output = captured.getvalue()

        # Both channels should show Enabled
        self.assertIn('Pushover', output)
        self.assertIn('Windows', output)
        self.assertIn('Enabled', output)
        self.assertIn('no .no-pushover found', output)
        self.assertIn('no .no-windows found', output)

    @patch('notify.check_notification_flags')
    def test_mixed_sources_shown(self, mock_flags):
        """Mixed project-level and global flags show correct source labels."""
        mock_flags.return_value = _make_flags(
            pushover_disabled=True,
            pushover_path=Path('/project/.no-pushover'),
            windows_disabled=True,
            global_windows_path=Path.home() / '.claude' / '.no-windows'
        )

        captured = io.StringIO()
        with patch('sys.stdout', captured):
            diagnose_configuration()
        output = captured.getvalue()

        # Pushover should be project-level
        self.assertIn('project-level', output)
        # Windows should be global
        self.assertIn('global', output)

    @patch('notify.check_notification_flags')
    def test_parent_dir_path_shown(self, mock_flags):
        """Flag found via upward traversal shows full parent dir path with project-level label."""
        pushover_path = Path('/home/user/project/.no-pushover')
        mock_flags.return_value = _make_flags(
            pushover_disabled=True,
            pushover_path=pushover_path
        )

        captured = io.StringIO()
        with patch('sys.stdout', captured):
            diagnose_configuration()
        output = captured.getvalue()

        # Full path string present in output
        self.assertIn(str(pushover_path), output)
        # Labeled as project-level
        self.assertIn('project-level', output)


if __name__ == '__main__':
    unittest.main(verbosity=2)
