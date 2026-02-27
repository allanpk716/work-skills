#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Query notification channel status."""

import sys
import io
from pathlib import Path

# Set UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def get_channel_status(channel: str) -> str:
    """Get status of a notification channel.

    Args:
        channel: Channel name (pushover or windows)

    Returns:
        Status string with icon (✓ or ✗)
    """
    flag_file = Path.cwd() / f".no-{channel}"
    is_enabled = not flag_file.exists()
    status_icon = "✓" if is_enabled else "✗"
    status_text = "已启用" if is_enabled else "已禁用"
    return f"{status_icon} {status_text}"


def main():
    """Main entry point for notify-status command."""
    channels = ['pushover', 'windows']

    for channel in channels:
        status = get_channel_status(channel)
        print(f"{channel.capitalize()} 通知: {status}")


if __name__ == "__main__":
    main()
