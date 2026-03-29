---
name: notify-status
description: Show the current status of all notification channels (pushover and windows)
---

Show the current enable/disable status of all notification channels for this project.

<process>
1. Run the status script:
   ```bash
   python plugins/claude-notify/scripts/notify-status.py
   ```
2. Display the output to the user
3. If any channel is disabled, remind the user they can re-enable with `/notify-enable <channel>`
</process>
