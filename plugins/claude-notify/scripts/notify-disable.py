#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Disable notification channel by creating flag file."""

import sys
from pathlib import Path

VALID_CHANNELS = {'pushover', 'windows'}


def disable_channel(channel: str, use_global: bool = False) -> str:
    """Disable a notification channel by creating flag file.

    Args:
        channel: Channel name (pushover or windows)
        use_global: If True, operate on ~/.claude/.no-xxx instead of CWD

    Returns:
        Status message in Chinese
    """
    if use_global:
        flag_file = Path.home() / '.claude' / f".no-{channel}"
    else:
        flag_file = Path.cwd() / f".no-{channel}"

    if flag_file.exists():
        return f"{channel.capitalize()} 通知已处于禁用状态"

    try:
        flag_file.parent.mkdir(parents=True, exist_ok=True)
        flag_file.touch()
        return f"{channel.capitalize()} 通知已禁用"
    except OSError as e:
        return f"错误:无法创建标志文件 - {e}"


def main():
    """Main entry point for notify-disable command."""
    args = sys.argv[1:]
    use_global = '--global' in args
    args = [a for a in args if a != '--global']

    if len(args) != 1:
        print("错误:缺少参数。用法:/notify-disable <pushover|windows> [--global]")
        sys.exit(1)

    channel = args[0].lower()

    if channel not in VALID_CHANNELS:
        print(f"错误:无效参数 '{channel}'。")
        print(f"可用选项:{', '.join(sorted(VALID_CHANNELS))}")
        print(f"用法:/notify-disable <pushover|windows> [--global]")
        sys.exit(1)

    result = disable_channel(channel, use_global=use_global)
    print(result)


if __name__ == "__main__":
    main()
