#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tests for notify-status command."""

import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import patch
import sys
import importlib.util

# Load scripts as modules using importlib
def load_script_module(script_name):
    """Load a script from the scripts directory as a module."""
    scripts_dir = Path(__file__).parent.parent / "scripts"
    script_path = scripts_dir / f"{script_name.replace('_', '-')}.py"
    spec = importlib.util.spec_from_file_location(script_name, script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

notify_status = load_script_module("notify_status")
get_channel_status = notify_status.get_channel_status
main = notify_status.main


class TestNotifyStatus:
    """Test cases for notify-status command."""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for tests."""
        with tempfile.TemporaryDirectory() as tmpdir:
            old_cwd = os.getcwd()
            os.chdir(tmpdir)
            yield tmpdir
            os.chdir(old_cwd)

    def _default_flags(self, **overrides):
        """Build a default flags dict with optional overrides."""
        flags = {
            'pushover_disabled': False,
            'windows_disabled': False,
            'pushover_path': None,
            'windows_path': None,
            'global_pushover_path': None,
            'global_windows_path': None,
        }
        flags.update(overrides)
        return flags

    def test_both_enabled(self, temp_dir, capsys):
        """Test status when both channels are enabled."""
        flags = self._default_flags()
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✓ 已启用" in captured.out
        assert "Windows 通知: ✓ 已启用" in captured.out

    def test_pushover_disabled_project(self, temp_dir, capsys):
        """Test status when pushover is disabled at project level."""
        flags = self._default_flags(
            pushover_disabled=True,
            pushover_path=Path(temp_dir) / ".no-pushover",
        )
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✗ 已禁用 (项目级)" in captured.out
        assert "Windows 通知: ✓ 已启用" in captured.out

    def test_windows_disabled_project(self, temp_dir, capsys):
        """Test status when windows is disabled at project level."""
        flags = self._default_flags(
            windows_disabled=True,
            windows_path=Path(temp_dir) / ".no-windows",
        )
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✓ 已启用" in captured.out
        assert "Windows 通知: ✗ 已禁用 (项目级)" in captured.out

    def test_both_disabled_project(self, temp_dir, capsys):
        """Test status when both channels are disabled at project level."""
        flags = self._default_flags(
            pushover_disabled=True,
            windows_disabled=True,
            pushover_path=Path(temp_dir) / ".no-pushover",
            windows_path=Path(temp_dir) / ".no-windows",
        )
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✗ 已禁用 (项目级)" in captured.out
        assert "Windows 通知: ✗ 已禁用 (项目级)" in captured.out

    def test_global_pushover_disabled_status(self, temp_dir, capsys):
        """Test status when pushover is disabled globally."""
        flags = self._default_flags(
            pushover_disabled=True,
            global_pushover_path=Path.home() / '.claude' / '.no-pushover',
        )
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✗ 已禁用 (全局)" in captured.out
        assert "Windows 通知: ✓ 已启用" in captured.out

    def test_project_pushover_disabled_status(self, temp_dir, capsys):
        """Test project-level disable shows (项目级) not (全局)."""
        flags = self._default_flags(
            pushover_disabled=True,
            pushover_path=Path(temp_dir) / ".no-pushover",
            global_pushover_path=None,
        )
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✗ 已禁用 (项目级)" in captured.out
        assert "全局" not in captured.out

    def test_global_and_project_both_set(self, temp_dir, capsys):
        """Test project-level takes priority when both flags exist."""
        flags = self._default_flags(
            pushover_disabled=True,
            pushover_path=Path(temp_dir) / ".no-pushover",
            global_pushover_path=Path.home() / '.claude' / '.no-pushover',
        )
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "项目级" in captured.out

    def test_no_flags_both_enabled(self, temp_dir, capsys):
        """Test both channels enabled when no flags exist."""
        flags = self._default_flags()
        with patch.object(notify_status, 'check_notification_flags', return_value=flags):
            sys.argv = ["notify-status.py"]
            main()

        captured = capsys.readouterr()
        assert "✓ 已启用" in captured.out
        assert "✗" not in captured.out

    def test_get_channel_status_enabled(self, temp_dir):
        """Test get_channel_status for enabled state."""
        flags = self._default_flags()
        result = get_channel_status("pushover", flags)
        assert "✓" in result
        assert "已启用" in result

    def test_get_channel_status_disabled_project(self, temp_dir):
        """Test get_channel_status for project-level disabled state."""
        flags = self._default_flags(
            pushover_disabled=True,
            pushover_path=Path(temp_dir) / ".no-pushover",
        )
        result = get_channel_status("pushover", flags)
        assert "✗" in result
        assert "已禁用" in result
        assert "项目级" in result

    def test_get_channel_status_disabled_global(self, temp_dir):
        """Test get_channel_status for globally disabled state."""
        flags = self._default_flags(
            pushover_disabled=True,
            global_pushover_path=Path.home() / '.claude' / '.no-pushover',
        )
        result = get_channel_status("pushover", flags)
        assert "✗" in result
        assert "已禁用" in result
        assert "全局" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
