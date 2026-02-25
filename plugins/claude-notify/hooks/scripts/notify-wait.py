#!/usr/bin/env python3
"""
Claude Code Wait Notification Script

Triggered by UserPromptSubmit hook to notify when Claude is waiting for user input.
Implements debouncing to avoid notification spam.

Performance target: Complete within 3 seconds
"""

import os
import sys
import logging
import subprocess
import re
from pathlib import Path
from datetime import datetime, timedelta

# Debounce configuration
DEBOUNCE_SECONDS = 10
TIMESTAMP_FILE = Path(os.environ.get('TEMP', '.')) / 'claude-notify-last-wait.timestamp'

# Configure logging
log_dir = Path(os.environ.get('APPDATA', '.')) / 'claude-notify' / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"claude-notify-wait-{datetime.now().strftime('%Y%m%d')}-{os.getpid()}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


def should_send_notification() -> bool:
    """
    Check if enough time has passed since last wait notification.

    Returns:
        bool: True if notification should be sent, False otherwise
    """
    try:
        if not TIMESTAMP_FILE.exists():
            logger.info("No timestamp file found, allowing notification")
            return True

        with open(TIMESTAMP_FILE, 'r') as f:
            last_time_str = f.read().strip()
            last_time = datetime.fromisoformat(last_time_str)

        elapsed = datetime.now() - last_time
        elapsed_seconds = elapsed.total_seconds()

        logger.info(f"Time since last notification: {elapsed_seconds:.1f}s")

        if elapsed_seconds >= DEBOUNCE_SECONDS:
            logger.info("Debounce period passed, allowing notification")
            return True
        else:
            logger.info(f"Debounce active ({DEBOUNCE_SECONDS - elapsed_seconds:.1f}s remaining), skipping")
            return False

    except Exception as e:
        logger.error(f"Error checking debounce: {e}, allowing notification")
        return True


def update_timestamp() -> None:
    """Update the last notification timestamp."""
    try:
        TIMESTAMP_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(TIMESTAMP_FILE, 'w') as f:
            f.write(datetime.now().isoformat())
        logger.info(f"Updated timestamp file: {TIMESTAMP_FILE}")
    except Exception as e:
        logger.error(f"Failed to update timestamp: {e}")


def get_recent_conversation():
    """
    Get recent conversation history from Claude CLI.

    Returns:
        str: Last assistant message or empty string if failed
    """
    try:
        logger.info("Requesting conversation history from Claude CLI...")

        # Call claude --print with a prompt to get last assistant message
        result = subprocess.run(
            ['claude', '--print', 'Show the last assistant message from our conversation.'],
            capture_output=True,
            text=True,
            timeout=2,
            encoding='utf-8'
        )

        if result.returncode == 0 and result.stdout.strip():
            message = result.stdout.strip()
            logger.info(f"Retrieved conversation history ({len(message)} chars)")
            return message
        else:
            logger.warning(f"Claude CLI returned non-zero or empty: {result.returncode}")
            return ""

    except subprocess.TimeoutExpired:
        logger.warning("Claude CLI timeout (2s)")
        return ""
    except FileNotFoundError:
        logger.warning("Claude CLI not found")
        return ""
    except Exception as e:
        logger.error(f"Failed to get conversation history: {e}")
        return ""


def contains_wait_markers(text):
    """
    Check if text contains markers indicating Claude is waiting for input.

    Args:
        text (str): Text to check

    Returns:
        bool: True if wait markers found
    """
    if not text:
        return False

    # Patterns that indicate Claude is waiting for user input
    wait_patterns = [
        r'^\d+\.',           # Numbered list (1., 2., 3.)
        r'^[-•]',            # Bullet list (-, •)
        r'\?',               # Question mark
        r'选择',             # Chinese "select/choose"
        r'\bchoose\b',       # English "choose"
        r'\bselect\b',       # English "select"
        r'\boption\b',       # English "option"
        r'\bprefer\b',       # English "prefer"
    ]

    for pattern in wait_patterns:
        if re.search(pattern, text, re.MULTILINE | re.IGNORECASE):
            logger.info(f"Found wait marker matching pattern: {pattern}")
            return True

    logger.info("No wait markers found in text")
    return False


def main() -> int:
    """Main function for wait notification script."""
    logger.info("=== Claude Code Wait Notification Script Started ===")

    try:
        # 1. Check debounce
        if not should_send_notification():
            logger.info("Debounce check failed, exiting")
            return 0

        # 2. Get recent conversation
        recent_msg = get_recent_conversation()
        if not recent_msg:
            logger.info("No conversation history, exiting")
            return 0

        # 3. Check for wait markers
        if not contains_wait_markers(recent_msg):
            logger.info("No wait markers detected, exiting")
            return 0

        logger.info("TEST: Would send notification here")

        # 4. Update timestamp
        update_timestamp()

        logger.info("=== Claude Code Wait Notification Script Finished ===")
        return 0

    except Exception as e:
        logger.error(f"Script failed: {e}")
        logger.info("=== Claude Code Wait Notification Script Finished (with errors) ===")
        return 1


if __name__ == '__main__':
    sys.exit(main())
