#!/usr/bin/env python3
"""
Claude Code Notification Script

This script is triggered by Claude Code's Stop hook and sends notifications
via Pushover and Windows Toast notifications when a task completes.

Performance target: Complete within 5 seconds
"""

import os
import sys
import subprocess
import logging
import requests
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging with PID isolation for concurrent safety
log_dir = Path(os.environ.get('APPDATA', '.')) / 'claude-notify' / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"claude-notify-{datetime.now().strftime('%Y%m%d')}-{os.getpid()}.log"

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


def get_claude_summary(project_name):
    """
    Get task summary from Claude CLI.

    Args:
        project_name (str): Project name for fallback message

    Returns:
        str: Task summary (max 200 chars) or fallback message
    """
    fallback_message = f"[{project_name}] Task completed"

    try:
        logger.info("Requesting summary from Claude CLI...")

        # Call claude --print with a summary prompt
        result = subprocess.run(
            ['claude', '--print', 'Summarize the completed task in one short sentence (max 200 chars).'],
            capture_output=True,
            text=True,
            timeout=2,
            encoding='utf-8'
        )

        if result.returncode == 0 and result.stdout.strip():
            summary = result.stdout.strip()[:200]
            logger.info(f"Summary received: {summary}")
            return summary
        else:
            logger.warning(f"Claude CLI returned non-zero or empty: {result.returncode}")
            return fallback_message

    except subprocess.TimeoutExpired:
        logger.warning("Claude CLI timeout (2s), using fallback message")
        return fallback_message
    except FileNotFoundError:
        logger.warning("Claude CLI not found, using fallback message")
        return fallback_message
    except Exception as e:
        logger.error(f"Failed to get Claude summary: {e}")
        return fallback_message


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

        # PowerShell script to send Toast notification
        ps_script = f'''
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $template = @"
        <toast>
            <visual>
                <binding template="ToastText02">
                    <text id="1">{title}</text>
                    <text id="2">{message}</text>
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
    Main function: Send parallel notifications with strict timeout control.

    Total timeout: 4 seconds (within 5s Claude Code limit)
    """
    logger.info("=== Claude Code Notification Script Started ===")

    try:
        # Get project name
        project_name = get_project_name()

        # Get Claude CLI summary
        summary = get_claude_summary(project_name)

        logger.info(f"Final summary: {summary}")

        # Check project-level notification flags
        flags = check_notification_flags()

        # Send notifications in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {}

            # Only submit Pushover if not disabled
            if not flags['pushover_disabled']:
                futures[executor.submit(send_pushover_notification, project_name, summary)] = 'pushover'

            # Only submit Windows if not disabled
            if not flags['windows_disabled']:
                futures[executor.submit(send_windows_notification, project_name, summary)] = 'windows'

            # If both disabled, log and exit
            if not futures:
                logger.info("All notifications disabled by project flags")
                return 0

            # Wait for all notifications with overall timeout
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

        logger.info(f"Notifications completed: {completed}, failed: {failed}")
        logger.info("=== Claude Code Notification Script Finished ===")

        return 0

    except Exception as e:
        logger.error(f"Script failed: {e}")
        logger.info("=== Claude Code Notification Script Finished (with errors) ===")
        return 1


if __name__ == '__main__':
    sys.exit(main())
