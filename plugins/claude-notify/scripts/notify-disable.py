#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Disable notification channel by creating flag file."""

import sys
from pathlib import Path

VALID_CHANNELS = {'pushover', 'windows'}


def disable_channel(channel: str) -> str:
    """Disable a notification channel by creating flag file.

    Args:
        channel: Channel name (pushover or windows)

    Returns:
        Status message in Chinese
    """
    flag_file = Path.cwd() / f".no-{channel}"

    if flag_file.exists():
        return f"{channel.capitalize()} 通知已处于禁用状态"

    try:
        flag_file.touch()
        return f"{channel.capitalize()} 通知已禁用"
    except OSError as e:
        return f"错误:无法创建标志文件 - {e}"


def main():
    """Main entry point for notify-disable command."""
    if len(sys.argv) != 2:
        print("错误:缺少参数。用法:/notify-disable <pushover|windows>")
        sys.exit(1)

    channel = sys.argv[1].lower()

    if channel not in VALID_CHANNELS:
        print(f"错误:无效参数 '{channel}'。")
        print(f"可用选项:{', '.join(sorted(VALID_CHANNELS))}")
        print(f"用法:/notify-disable <pushover|windows>")
        sys.exit(1)

    result = disable_channel(channel)
    print(result)


if __name__ == "__main__":
    main()
