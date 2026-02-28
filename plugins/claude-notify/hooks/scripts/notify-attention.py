#!/usr/bin/env python3
"""
Claude Code Attention Notification Script

This script is triggered by Claude Code's Notification hook and sends
high-priority notifications when user attention is needed (e.g., during
multi-turn interactions).

Reference: git@github.com:allanpk716/cc-pushover-hook.git
"""

import os
import sys
import json
import logging
import requests
import xml.sax.saxutils
import subprocess
from pathlib import Path
from datetime import datetime

# Configure logging
log_dir = Path(os.environ.get('APPDATA', '.')) / 'claude-notify' / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"claude-notify-attention-{datetime.now().strftime('%Y%m%d')}-{os.getpid()}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


def get_project_name():
    """
    Get the current project name from the working directory.

    Returns:
        str: Project name (directory name)
    """
    try:
        project_name = os.path.basename(os.getcwd())
        logger.info(f"Project name: {project_name}")
        return project_name
    except Exception as e:
        logger.error(f"Failed to get project name: {e}")
        return "Claude Code"


def send_pushover_notification(title, message, priority=1):
    """
    Send notification via Pushover API.

    Args:
        title (str): Notification title
        message (str): Notification message
        priority (int): Notification priority (-2 to 2, default: 1 for high priority)

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

        logger.info(f"Sending Pushover notification (priority={priority})...")

        response = requests.post(
            'https://api.pushover.net/1/messages.json',
            data={
                'token': token,
                'user': user,
                'title': title,
                'message': message,
                'priority': priority
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


def main():
    """
    Main function: Process Notification hook input and send attention notifications.
    """
    logger.info("=== Claude Code Attention Notification Script Started ===")

    try:
        # Read hook input from stdin (JSON format)
        hook_input_str = sys.stdin.read()
        logger.info(f"Received hook input: {hook_input_str[:200]}...")

        if not hook_input_str:
            logger.error("No hook input received")
            return 1

        hook_input = json.loads(hook_input_str)
        hook_event = hook_input.get('hook_event_name', 'Unknown')
        notification_type = hook_input.get('notification_type', 'notification')
        session_id = hook_input.get('session_id', 'unknown')

        logger.info(f"Hook event: {hook_event}, Notification type: {notification_type}, Session: {session_id}")

        # Skip idle_prompt notifications (CLI idle for 60+ seconds)
        if notification_type == 'idle_prompt':
            logger.info("Skipping idle_prompt notification - not user attention needed")
            return 0

        # Get project name
        project_name = get_project_name()

        # Build notification content
        title = f"[{project_name}] Attention Needed"
        notification_message = hook_input.get('message', '')

        if notification_message:
            details = notification_message
        else:
            details = "No additional details provided"

        message = f"Session: {session_id}\nType: {notification_type}\n{details}"

        logger.info(f"Notification title: {title}")
        logger.info(f"Notification message: {message[:100]}...")

        # Send notifications (both channels)
        pushover_result = send_pushover_notification(title, message, priority=1)
        windows_result = send_windows_notification(title, message)

        if pushover_result or windows_result:
            logger.info(f"Notifications sent successfully (Pushover: {pushover_result}, Windows: {windows_result})")
        else:
            logger.warning("All notification channels failed")

        logger.info("=== Claude Code Attention Notification Script Finished ===")
        return 0

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse hook input as JSON: {e}")
        return 1
    except Exception as e:
        logger.error(f"Script failed: {e}")
        logger.info("=== Claude Code Attention Notification Script Finished (with errors) ===")
        return 1


if __name__ == '__main__':
    sys.exit(main())
