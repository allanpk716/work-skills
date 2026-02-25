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
import requests
import xml.sax.saxutils
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


def send_pushover_notification(title, message):
    """
    Send notification via Pushover API.

    Args:
        title (str): Notification title
        message (str): Notification message

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        token = os.environ.get('PUSHOVER_TOKEN')
        user = os.environ.get('PUSHOVER_USER')

        if not token or not user:
            logger.warning(
                "Pushover credentials not configured. "
                "Set PUSHOVER_TOKEN and PUSHOVER_USER environment variables."
            )
            return False

        logger.info("Sending Pushover notification...")

        response = requests.post(
            'https://api.pushover.net/1/messages.json',
            data={
                'token': token,
                'user': user,
                'title': title,
                'message': message,
                'priority': 0
            },
            timeout=2
        )

        if response.status_code == 200:
            logger.info("Pushover notification sent successfully")
            return True
        else:
            logger.error(f"Pushover API error: {response.status_code} - {response.text}")
            return False

    except requests.Timeout:
        logger.warning("Pushover API timeout (2s)")
        return False
    except Exception as e:
        logger.error(f"Failed to send Pushover notification: {e}")
        return False


def send_windows_notification(title, message):
    """
    Send Windows Toast notification via PowerShell.

    Args:
        title (str): Notification title
        message (str): Notification message

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        logger.info("Sending Windows Toast notification...")

        # Escape XML special characters to prevent injection
        title_escaped = xml.sax.saxutils.escape(title)
        message_escaped = xml.sax.saxutils.escape(message)

        # PowerShell script to send Toast notification
        ps_script = f'''
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $template = @"
        <toast>
            <visual>
                <binding template="ToastText02">
                    <text id="1">{title_escaped}</text>
                    <text id="2">{message_escaped}</text>
                </binding>
            </visual>
        </toast>
"@

        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
        '''

        result = subprocess.run(
            ['powershell', '-Command', ps_script],
            capture_output=True,
            text=True,
            timeout=1,
            encoding='utf-8'
        )

        if result.returncode == 0:
            logger.info("Windows Toast notification sent successfully")
            return True
        else:
            logger.error(f"PowerShell error: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        logger.warning("Windows Toast timeout (1s)")
        return False
    except Exception as e:
        logger.error(f"Failed to send Windows notification: {e}")
        return False


def check_notification_flags():
    """
    Check for project-level notification disable flags.

    Returns:
        dict: {'pushover_disabled': bool, 'windows_disabled': bool}
    """
    project_dir = Path.cwd()

    flags = {
        'pushover_disabled': (project_dir / '.no-pushover').is_file(),
        'windows_disabled': (project_dir / '.no-windows').is_file()
    }

    if flags['pushover_disabled']:
        logger.info("Pushover notifications disabled by .no-pushover file")

    if flags['windows_disabled']:
        logger.info("Windows notifications disabled by .no-windows file")

    return flags


def get_project_name():
    """
    Get the current project name from the working directory.

    Returns:
        str: Project name (directory name), sanitized and truncated
    """
    try:
        project_name = os.path.basename(os.getcwd())

        # Fallback if empty
        if not project_name or project_name.strip() == "":
            logger.warning("Empty project name, using default")
            return "Claude Code"

        # Truncate to reasonable length (50 chars)
        if len(project_name) > 50:
            project_name = project_name[:47] + "..."
            logger.info(f"Project name truncated to: {project_name}")

        # Remove characters that could break PowerShell XML
        project_name = re.sub(r'[<>&"\']', '', project_name)

        logger.info(f"Project name: {project_name}")
        return project_name

    except Exception as e:
        logger.error(f"Failed to get project name: {e}")
        return "Claude Code"


def main() -> int:
    """Main function for wait notification script."""
    logger.info("=== Claude Code Wait Notification Script Started ===")

    try:
        # 1. Check debounce
        if not should_send_notification():
            return 0

        # 2. Get recent conversation
        recent_msg = get_recent_conversation()
        if not recent_msg:
            return 0

        # 3. Check for wait markers
        if not contains_wait_markers(recent_msg):
            return 0

        # 4. Get project name
        project_name = get_project_name()

        # 5. Check notification flags
        flags = check_notification_flags()

        # 6. Send notifications in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {}

            wait_message = "Claude 正在等待您的输入"

            if not flags['pushover_disabled']:
                futures[executor.submit(send_pushover_notification, project_name, wait_message)] = 'pushover'

            if not flags['windows_disabled']:
                futures[executor.submit(send_windows_notification, project_name, wait_message)] = 'windows'

            if not futures:
                logger.info("All notifications disabled by project flags")
                return 0

            # Wait for all notifications
            completed = 0
            failed = 0

            for future in as_completed(futures, timeout=4):
                channel = futures[future]
                try:
                    result = future.result()
                    if result:
                        logger.info(f"{channel} notification succeeded")
                        completed += 1
                    else:
                        logger.warning(f"{channel} notification failed")
                        failed += 1
                except Exception as e:
                    logger.error(f"{channel} notification exception: {e}")
                    failed += 1

        # 7. Update timestamp
        update_timestamp()

        logger.info(f"Notifications completed: {completed}, failed: {failed}")
        logger.info("=== Claude Code Wait Notification Script Finished ===")

        return 0

    except Exception as e:
        logger.error(f"Script failed: {e}")
        logger.info("=== Claude Code Wait Notification Script Finished (with errors) ===")
        return 1


if __name__ == '__main__':
    sys.exit(main())
