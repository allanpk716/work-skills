#!/usr/bin/env python3
"""
Claude Code AskUserQuestion Notification Script

Triggered by PostToolUse hook when Claude asks a question.
Sends high-priority notification to alert the user.

Note: This uses PostToolUse hook to detect AskUserQuestion, which is
currently an undocumented behavior. May change in future versions.
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
log_file = log_dir / f"claude-notify-question-{datetime.now().strftime('%Y%m%d')}-{os.getpid()}.log"

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
        priority (int): Notification priority (default: 1 for high priority)

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


def check_notification_flags(cwd):
    """
    Check for project-level notification disable flags.

    Args:
        cwd (str): Current working directory

    Returns:
        dict: {'pushover_disabled': bool, 'windows_disabled': bool}
    """
    project_dir = Path(cwd)

    flags = {
        'pushover_disabled': (project_dir / '.no-pushover').is_file(),
        'windows_disabled': (project_dir / '.no-windows').is_file()
    }

    if flags['pushover_disabled']:
        logger.info("Pushover notifications disabled by .no-pushover file")

    if flags['windows_disabled']:
        logger.info("Windows notifications disabled by .no-windows file")

    return flags


def main():
    """
    Main function: Process PostToolUse hook input and send question notifications.
    """
    logger.info("=== Claude Code Question Notification Script Started ===")

    try:
        # Read hook input from stdin (JSON format)
        hook_input_str = sys.stdin.read()
        logger.info(f"Received hook input length: {len(hook_input_str)}")

        if not hook_input_str:
            logger.error("No hook input received")
            return 1

        hook_input = json.loads(hook_input_str)
        tool_name = hook_input.get('tool_name', '')
        session_id = hook_input.get('session_id', 'unknown')
        cwd = hook_input.get('cwd', os.getcwd())

        logger.info(f"Tool: {tool_name}, Session: {session_id}, CWD: {cwd}")

        # Only process AskUserQuestion tool
        if tool_name != 'AskUserQuestion':
            logger.info(f"Ignoring tool: {tool_name}")
            return 0

        # Get question from tool result
        tool_result = hook_input.get('tool_result', {})
        questions = tool_result.get('questions', [])

        if not questions:
            logger.info("No questions found in AskUserQuestion result")
            return 0

        # Extract first question
        first_question = questions[0].get('question', 'Waiting for your input')
        logger.info(f"Question: {first_question[:100]}...")

        # Get project name
        project_name = get_project_name()

        # Build notification
        title = f"[{project_name}] Question for You"
        message = f"{first_question}"

        # Truncate message if too long
        if len(message) > 200:
            message = message[:197] + "..."
            logger.info("Message truncated to 200 characters")

        logger.info(f"Notification title: {title}")
        logger.info(f"Notification message: {message}")

        # Check notification flags
        flags = check_notification_flags(cwd)

        # Send notifications
        pushover_result = False
        windows_result = False

        if not flags['pushover_disabled']:
            pushover_result = send_pushover_notification(title, message, priority=1)

        if not flags['windows_disabled']:
            windows_result = send_windows_notification(title, message)

        if pushover_result or windows_result:
            logger.info(f"Notifications sent (Pushover: {pushover_result}, Windows: {windows_result})")
        else:
            logger.warning("All notification channels failed or disabled")

        logger.info("=== Claude Code Question Notification Script Finished ===")
        return 0

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse hook input as JSON: {e}")
        return 1
    except Exception as e:
        logger.error(f"Script failed: {e}")
        logger.info("=== Claude Code Question Notification Script Finished (with errors) ===")
        return 1


if __name__ == '__main__':
    sys.exit(main())
