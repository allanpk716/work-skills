#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tests for notify-disable command."""

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

notify_disable = load_script_module("notify_disable")
disable_channel = notify_disable.disable_channel
main = notify_disable.main


class TestNotifyDisable:
    """Test cases for notify-disable command."""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for tests."""
        with tempfile.TemporaryDirectory() as tmpdir:
            old_cwd = os.getcwd()
            os.chdir(tmpdir)
            yield tmpdir
            os.chdir(old_cwd)

    def test_missing_parameter(self, capsys):
        """Test that missing parameter shows error."""
        sys.argv = ["notify-disable.py"]  # Reset sys.argv
        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1
        captured = capsys.readouterr()
        assert "错误:缺少参数" in captured.out
        assert "/notify-disable <pushover|windows>" in captured.out

    def test_invalid_parameter(self, capsys):
        """Test that invalid parameter shows error."""
        with pytest.raises(SystemExit) as exc_info:
            sys.argv = ["notify-disable.py", "slack"]
            main()

        assert exc_info.value.code == 1
        captured = capsys.readouterr()
        assert "错误:无效参数 'slack'" in captured.out
        assert "可用选项:pushover, windows" in captured.out

    def test_disable_pushover_success(self, temp_dir, capsys):
        """Test successfully disabling pushover channel."""
        sys.argv = ["notify-disable.py", "pushover"]
        main()

        captured = capsys.readouterr()
        assert "Pushover 通知已禁用" in captured.out

        flag_file = Path(temp_dir) / ".no-pushover"
        assert flag_file.exists()  # File should be created

    def test_disable_pushover_already_disabled(self, temp_dir, capsys):
        """Test disabling when already disabled."""
        # Create flag file first
        flag_file = Path(temp_dir) / ".no-pushover"
        flag_file.touch()

        sys.argv = ["notify-disable.py", "pushover"]
        main()

        captured = capsys.readouterr()
        assert "Pushover 通知已处于禁用状态" in captured.out

    def test_disable_windows_success(self, temp_dir, capsys):
        """Test successfully disabling windows channel."""
        sys.argv = ["notify-disable.py", "windows"]
        main()

        captured = capsys.readouterr()
        assert "Windows 通知已禁用" in captured.out

        flag_file = Path(temp_dir) / ".no-windows"
        assert flag_file.exists()

    def test_disable_channel_function(self, temp_dir):
        """Test disable_channel function directly."""
        result = disable_channel("pushover")
        assert "已禁用" in result

        flag_file = Path(temp_dir) / ".no-pushover"
        assert flag_file.exists()

    def test_permission_error_handling(self, temp_dir, capsys):
        """Test handling of permission errors."""
        # Mock touch to raise permission error
        with patch.object(Path, 'touch', side_effect=PermissionError("Access denied")):
            sys.argv = ["notify-disable.py", "pushover"]
            main()

        captured = capsys.readouterr()
        assert "错误" in captured.out or "Error" in captured.out


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
