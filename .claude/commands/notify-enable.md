---
name: notify-enable
description: Enable a notification channel (pushover or windows) by removing the .no-{channel} flag file
---

Enable the specified notification channel for this project.

**Argument:** $ARGUMENTS

<process>
1. Parse the argument - must be either `pushover` or `windows`
2. Run the enable script:
   ```bash
   python plugins/claude-notify/scripts/notify-enable.py <pushover|windows>
   ```
3. Report the result to the user
</process>

<rules>
- If no argument provided, ask user to specify: `pushover` or `windows`
- If invalid argument, show valid options and ask again
- The script is idempotent - enabling an already-enabled channel shows "already enabled"
</rules>
