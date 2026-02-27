#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tests for notify-status command."""

import pytest
import tempfile
import os
from pathlib import Path
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

    def test_both_enabled(self, temp_dir, capsys):
        """Test status when both channels are enabled."""
        sys.argv = ["notify-status.py"]
        main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✓ 已启用" in captured.out
        assert "Windows 通知: ✓ 已启用" in captured.out

    def test_pushover_disabled(self, temp_dir, capsys):
        """Test status when pushover is disabled."""
        flag_file = Path(temp_dir) / ".no-pushover"
        flag_file.touch()

        sys.argv = ["notify-status.py"]
        main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✗ 已禁用" in captured.out
        assert "Windows 通知: ✓ 已启用" in captured.out

    def test_windows_disabled(self, temp_dir, capsys):
        """Test status when windows is disabled."""
        flag_file = Path(temp_dir) / ".no-windows"
        flag_file.touch()

        sys.argv = ["notify-status.py"]
        main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✓ 已启用" in captured.out
        assert "Windows 通知: ✗ 已禁用" in captured.out

    def test_both_disabled(self, temp_dir, capsys):
        """Test status when both channels are disabled."""
        (Path(temp_dir) / ".no-pushover").touch()
        (Path(temp_dir) / ".no-windows").touch()

        sys.argv = ["notify-status.py"]
        main()

        captured = capsys.readouterr()
        assert "Pushover 通知: ✗ 已禁用" in captured.out
        assert "Windows 通知: ✗ 已禁用" in captured.out

    def test_get_channel_status_enabled(self, temp_dir):
        """Test get_channel_status for enabled state."""
        result = get_channel_status("pushover")
        assert "✓" in result
        assert "已启用" in result

    def test_get_channel_status_disabled(self, temp_dir):
        """Test get_channel_status for disabled state."""
        flag_file = Path(temp_dir) / ".no-pushover"
        flag_file.touch()

        result = get_channel_status("pushover")
        assert "✗" in result
        assert "已禁用" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
