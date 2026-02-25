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
import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

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


def should_send_notification():
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


def update_timestamp():
    """Update the last notification timestamp."""
    try:
        TIMESTAMP_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(TIMESTAMP_FILE, 'w') as f:
            f.write(datetime.now().isoformat())
        logger.info(f"Updated timestamp file: {TIMESTAMP_FILE}")
    except Exception as e:
        logger.error(f"Failed to update timestamp: {e}")


def main():
    """Main function for wait notification script."""
    logger.info("=== Claude Code Wait Notification Script Started ===")

    # Test debounce function
    if should_send_notification():
        logger.info("TEST: Debounce check would allow notification")
        update_timestamp()
    else:
        logger.info("TEST: Debounce check would skip notification")

    logger.info("=== Claude Code Wait Notification Script Finished ===")
    return 0


if __name__ == '__main__':
    sys.exit(main())
