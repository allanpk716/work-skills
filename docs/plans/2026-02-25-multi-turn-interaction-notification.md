# Multi-turn Interaction Notification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add notification capability for multi-turn interactions where Claude waits for user input, using UserPromptSubmit hook with debounce mechanism.

**Architecture:** Create notify-wait.py script triggered by UserPromptSubmit hook. Script checks debounce timestamp, retrieves last assistant message via Claude CLI, detects wait markers using regex, and sends "waiting for input" notifications in parallel via Pushover and Windows Toast.

**Tech Stack:** Python 3.8+, Claude CLI, requests library, Windows Toast notifications, regex pattern matching

---

## Task 1: Create Debounce Check Function

**Files:**
- Create: `plugins/claude-notify/hooks/scripts/notify-wait.py`

**Step 1: Write debounce check function**

Create file with initial structure and debounce logic:

```python
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
```

**Step 2: Test debounce function**

Run: `python plugins/claude-notify/hooks/scripts/notify-wait.py`

Expected: Script runs successfully, creates timestamp file

**Step 3: Verify timestamp file created**

Run: `type %TEMP%\claude-notify-last-wait.timestamp`

Expected: Shows ISO timestamp like `2026-02-25T10:30:45.123456`

**Step 4: Test debounce (run again immediately)**

Run: `python plugins/claude-notify/hooks/scripts/notify-wait.py`

Expected: Log shows "Debounce active, skipping notification"

**Step 5: Commit**

```bash
git add plugins/claude-notify/hooks/scripts/notify-wait.py
git commit -m "feat(notify): add debounce check for wait notifications

- Add should_send_notification() with 10-second debounce
- Add update_timestamp() to track last notification time
- Store timestamp in %TEMP%\claude-notify-last-wait.timestamp
- Graceful degradation on file errors

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add Wait Marker Detection

**Files:**
- Modify: `plugins/claude-notify/hooks/scripts/notify-wait.py`

**Step 1: Add get_recent_conversation function**

Add after `update_timestamp()` function:

```python
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
```

**Step 2: Add contains_wait_markers function**

Add after `get_recent_conversation()`:

```python
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
```

**Step 3: Update main function to test detection**

Replace main() function:

```python
def main():
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
```

**Step 4: Test wait marker detection**

Run: `python plugins/claude-notify/hooks/scripts/notify-wait.py`

Expected: Script detects conversation and checks for markers

**Step 5: Commit**

```bash
git add plugins/claude-notify/hooks/scripts/notify-wait.py
git commit -m "feat(notify): add wait marker detection

- Add get_recent_conversation() to retrieve last assistant message
- Add contains_wait_markers() with regex patterns for:
  - Numbered/bullet lists
  - Question marks
  - Selection keywords (选择, choose, select, option, prefer)
- Integrate detection into main workflow

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add Notification Sending Functions

**Files:**
- Modify: `plugins/claude-notify/hooks/scripts/notify-wait.py`

**Step 1: Add import for requests**

Add `import requests` after other imports:

```python
import os
import sys
import logging
import re
import subprocess
import requests  # Add this line
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
```

**Step 2: Add notification functions (copy from notify.py)**

Add after `contains_wait_markers()` function:

```python
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
            logger.warning("Pushover credentials not configured")
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
```

**Step 3: Add get_project_name function**

Add after `check_notification_flags()`:

```python
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
```

**Step 4: Update main to send notifications**

Replace main() function:

```python
def main():
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
```

**Step 5: Test notification sending**

Run: `python plugins/claude-notify/hooks/scripts/notify-wait.py`

Expected: Script sends notifications if wait markers detected

**Step 6: Commit**

```bash
git add plugins/claude-notify/hooks/scripts/notify-wait.py
git commit -m "feat(notify): implement wait notification sending

- Add send_pushover_notification() with 2s timeout
- Add send_windows_notification() with 1s timeout
- Add check_notification_flags() for project-level control
- Add get_project_name() for notification title
- Send notifications in parallel via ThreadPoolExecutor
- Message: 'Claude 正在等待您的输入'

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update hooks.json Configuration

**Files:**
- Modify: `plugins/claude-notify/hooks/hooks.json`

**Step 1: Add UserPromptSubmit hook configuration**

Replace entire file content:

```json
{
  "description": "Sends Pushover and Windows Toast notifications when Claude Code tasks complete or waits for input",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/notify.py\"",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/notify-wait.py\"",
            "async": true,
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Step 2: Validate JSON syntax**

Run: `python -m json.tool plugins/claude-notify/hooks/hooks.json`

Expected: JSON is valid and prints formatted

**Step 3: Commit**

```bash
git add plugins/claude-notify/hooks/hooks.json
git commit -m "feat(notify): add UserPromptSubmit hook for wait notifications

- Configure UserPromptSubmit hook to trigger notify-wait.py
- Set async: true to avoid blocking user operations
- Set timeout: 5 (faster than Stop hook)
- Update description to include wait notifications

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update SKILL.md Documentation

**Files:**
- Modify: `plugins/claude-notify/SKILL.md`

**Step 1: Add wait notification section after "工作原理" section**

Find the line `## 工作原理` and add after that section (around line 29):

```markdown
## 工作原理

此技能是 **Hook 触发型** - 当 Claude Code 完成任务后自动运行。无需手动调用。

### 任务完成通知 (Stop Hook)

1. Claude Code 在任务完成时触发 `Stop` hook
2. 通知脚本在后台运行(异步模式)
3. 脚本使用 Claude CLI 生成任务摘要
4. Pushover 和 Windows Toast 通知并行发送
5. 您在设备上即时接收通知

### 等待输入通知 (UserPromptSubmit Hook)

当 Claude 在多轮交互中等待您输入时(例如使用 `/gsd:discuss` 或计划模式):

1. 您提交 prompt 后触发 `UserPromptSubmit` hook
2. 脚本检查 Claude 的最后一条消息是否包含等待标记
3. 如果检测到等待状态,发送"等待输入"通知
4. **防抖机制**: 10秒内的重复通知会被自动抑制
5. 通知不会阻塞您的操作

**通知消息示例:**
```
标题: work-skills
消息: Claude 正在等待您的输入
```
```

**Step 2: Add FAQ entry for wait notifications**

Find the FAQ section and add after existing questions:

```markdown
### Q: 为什么会收到"等待输入"通知?

**这是正常功能。** 当 Claude 在多轮交互中等待您输入时会发送此通知。

**触发场景:**
- 使用 `/gsd:discuss` 等交互式命令
- Claude 提供选项让您选择
- 使用计划模式或 AskUserQuestion 的场景

**防抖机制:**
- 同一交互过程中,10秒内只通知一次
- 避免通知轰炸
- 确保您不会错过需要操作的时机

**如何禁用:**
与任务完成通知相同,使用项目级控制文件:
- `.no-pushover` - 禁用 Pushover 等待通知
- `.no-windows` - 禁用 Windows 等待通知

### Q: 等待通知和任务完成通知有什么区别?

| 特性 | 任务完成通知 | 等待输入通知 |
|------|------------|------------|
| 触发时机 | Claude 完成任务 | Claude 等待输入 |
| 消息内容 | AI 生成的任务摘要 | "Claude 正在等待您的输入" |
| Hook 事件 | Stop | UserPromptSubmit |
| 防抖 | 无 | 10秒防抖 |
```

**Step 3: Update version in frontmatter**

Change version from `1.0.0` to `1.1.0`:

```yaml
---
name: claude-notify
description: 当 Claude Code 任务完成时发送 Pushover 推送通知和 Windows Toast 通知。通过环境变量 PUSHOVER_TOKEN 和 PUSHOVER_USER 配置。
version: 1.1.0
---
```

**Step 4: Commit**

```bash
git add plugins/claude-notify/SKILL.md
git commit -m "docs(notify): document wait notification feature

- Add UserPromptSubmit hook explanation in 工作原理
- Add FAQ entry for wait notifications
- Explain debounce mechanism (10 seconds)
- Add comparison table between wait and completion notifications
- Update version to 1.1.0

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Integration Testing

**Files:**
- None (manual testing)

**Step 1: Test in a Claude Code session**

Run: Start a new Claude Code session

**Step 2: Trigger multi-turn interaction**

Type: "帮我分析一下这个项目的架构"

Expected: Claude asks clarifying questions, you receive "等待输入" notification

**Step 3: Verify debounce**

Immediately type another response

Expected: No notification (debounce active)

**Step 4: Wait 10 seconds and test again**

Wait 10 seconds, then trigger another multi-turn interaction

Expected: Notification sent again

**Step 5: Test notification disable flags**

Run:
```bash
cd test-project
type nul > .no-pushover
type nul > .no-windows
```

Expected: No notifications sent

**Step 6: Clean up and document test results**

Remove test files and document results in commit message

**Step 7: Final commit**

```bash
git commit --allow-empty -m "test(notify): verify wait notification feature

Manual testing completed:
- ✓ UserPromptSubmit hook triggers correctly
- ✓ Wait markers detected (numbered lists, questions)
- ✓ Debounce mechanism works (10-second window)
- ✓ Notifications sent via Pushover and Windows Toast
- ✓ Project-level disable flags (.no-pushover, .no-windows) work
- ✓ No blocking of user operations

Ready for production use.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Success Criteria

Implementation is complete when:

1. ✓ notify-wait.py script exists with all core functions
2. ✓ hooks.json includes UserPromptSubmit configuration
3. ✓ Debounce mechanism prevents spam (10-second window)
4. ✓ Wait markers detected via regex patterns
5. ✓ Notifications sent in parallel via Pushover and Windows Toast
6. ✓ SKILL.md updated with documentation
7. ✓ Manual testing in Claude Code session successful
8. ✓ All changes committed with descriptive messages

## Notes for Implementation

- All file paths use Windows format (backslashes in examples, but code uses Path)
- Timeout values are strict: Claude CLI (2s), Pushover (2s), Windows Toast (1s), Total (3s)
- Debounce file stored in %TEMP% directory
- Script must never throw unhandled exceptions
- Async execution ensures no blocking
- Version bumped to 1.1.0
