#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Query notification channel status."""

import sys
from pathlib import Path

# Add hooks/scripts to path for flags module import
sys.path.insert(0, str(Path(__file__).parent.parent / 'hooks' / 'scripts'))
from flags import check_notification_flags


def get_channel_status(channel: str, flags: dict) -> str:
    """Get status of a notification channel.

    Args:
        channel: Channel name (pushover or windows)
        flags: Result dict from check_notification_flags()

    Returns:
        Status string with icon and source info
    """
    disabled_key = f'{channel}_disabled'
    project_path_key = f'{channel}_path'
    global_path_key = f'global_{channel}_path'

    is_disabled = flags[disabled_key]
    status_icon = "✗" if is_disabled else "✓"
    status_text = "已禁用" if is_disabled else "已启用"

    # Show source if disabled
    source = ""
    if is_disabled:
        if flags[project_path_key] is not None:
            source = " (项目级)"
        elif flags[global_path_key] is not None:
            source = " (全局)"

    return f"{status_icon} {status_text}{source}"


def main():
    """Main entry point for notify-status command."""
    flags = check_notification_flags()
    channels = ['pushover', 'windows']

    for channel in channels:
        status = get_channel_status(channel, flags)
        print(f"{channel.capitalize()} 通知: {status}")


if __name__ == "__main__":
    main()
