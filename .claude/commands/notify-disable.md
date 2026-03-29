---
name: notify-disable
description: Disable a notification channel (pushover or windows) by creating the .no-{channel} flag file
---

Disable the specified notification channel for this project.

**Argument:** $ARGUMENTS

<process>
1. Parse the argument - must be either `pushover` or `windows`
2. Run the disable script:
   ```bash
   python plugins/claude-notify/scripts/notify-disable.py <pushover|windows>
   ```
3. Report the result to the user
</process>

<rules>
- If no argument provided, ask user to specify: `pushover` or `windows`
- If invalid argument, show valid options and ask again
- The script is idempotent - disabling an already-disabled channel shows "already disabled"
</rules>
