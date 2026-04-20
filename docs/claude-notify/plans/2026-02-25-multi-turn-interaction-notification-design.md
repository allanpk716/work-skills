# Design: Multi-turn Interaction Notification System

**Created:** 2026-02-25
**Status:** Approved
**Related Todo:** Fix notification hook not triggering during multi-turn interactions

## Problem Statement

When using Claude Code for multi-turn interactions (e.g., `/gsd:discuss`, plan mode, or any command using AskUserQuestion), the `Stop` hook does not trigger during interaction pauses. Users may miss the timing when they need to provide input, leading to delays.

**Current Behavior:**
- Hook only triggers on `Stop` event
- Multi-turn interaction pauses don't trigger `Stop`
- No notification when waiting for user input

**Expected Behavior:**
- Send notification when Claude is waiting for user input
- Debounce to avoid notification spam
- Clear distinction between "waiting" and "completed" states

## Solution Overview

Utilize Claude Code's **UserPromptSubmit** hook event to detect when the previous assistant response contains wait markers (e.g., option lists), then send a "waiting for input" notification.

**Key Components:**
1. UserPromptSubmit hook configuration
2. notify-wait.py script with debounce mechanism
3. Wait marker detection via regex
4. Parallel notification delivery

## Architecture

### Hook Configuration

**File:** `hooks/hooks.json`

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

### Workflow

```
User submits prompt
    ↓
UserPromptSubmit Hook triggers (async)
    ↓
notify-wait.py executes:
  1. Debounce check (< 10s since last?)
     ├─ Yes → Exit
     └─ No → Continue
  2. Get conversation history (2s timeout)
     ├─ Fail → Exit
     └─ Success → Continue
  3. Detect wait markers (regex match)
     ├─ Not found → Exit
     └─ Found → Continue
  4. Send notifications (parallel)
     ├─ Pushover (2s timeout)
     └─ Windows Toast (1s timeout)
  5. Update timestamp file
    ↓
Claude processes user prompt (main flow unaffected)
```

## Implementation Details

### notify-wait.py Script

**File:** `hooks/scripts/notify-wait.py`

**Core Functions:**

1. **should_send_notification()** - Debounce check
   - Read timestamp file: `%TEMP%\claude-notify-last-wait.timestamp`
   - Check if >= 10 seconds since last notification
   - Allow notification on failure (graceful degradation)

2. **get_recent_conversation()** - Get conversation history
   - Call `claude --print` to get last assistant message
   - Timeout: 2 seconds
   - Return empty string on failure

3. **contains_wait_markers(text)** - Detect wait markers
   - Patterns:
     ```python
     wait_patterns = [
         r'^\d+\.',      # Numbered list (1., 2., 3.)
         r'^[-•]',       # Bullet list (-, •)
         r'\?',          # Question mark
         r'选择|choose|select',  # Selection keywords
     ]
     ```
   - Use `re.search(pattern, text, re.MULTILINE | re.IGNORECASE)`

4. **send_wait_notifications()** - Send notifications
   - Reuse Pushover and Windows Toast functions from notify.py
   - Message format: `[Project Name] Claude 正在等待您的输入`
   - Parallel delivery with independent timeouts

5. **update_timestamp()** - Update timestamp
   - Write current time to timestamp file
   - Silent ignore on failure (non-critical)

### Notification Format

**Wait Notification:**

| Field | Content | Example |
|-------|---------|---------|
| Title | Project name | work-skills |
| Message | Fixed text | Claude 正在等待您的输入 |
| Priority | 0 | 0 (normal priority) |

**Comparison with Stop Notification:**

| Feature | Stop Notification | Wait Notification |
|---------|------------------|-------------------|
| Message source | Claude CLI generated | Fixed text |
| Generation time | ~1 second | ~0 seconds |
| Trigger event | Stop | UserPromptSubmit |
| Meaning | Task completed | Waiting for input |

### Error Handling

**Error Strategy:**

```python
try:
    # Any step failure → fast exit
    if not should_send_notification():
        return 0
    if not recent_msg:
        return 0
    if not contains_wait_markers(recent_msg):
        return 0
    # Send notifications
except Exception:
    # Silent failure, don't affect main flow
    return 0
```

**Degradation Handling:**

- Claude CLI unavailable → Skip detection
- Timestamp file corrupted → Allow notification
- Pushover fails → Windows Toast still sends
- Windows Toast fails → Pushover still sends

### Performance Metrics

| Operation | Timeout | Note |
|-----------|---------|------|
| Debounce check | < 0.01s | File read |
| Claude CLI | 2s | Get conversation history |
| Regex match | < 0.01s | Lightweight detection |
| Pushover API | 2s | Parallel execution |
| Windows Toast | 1s | Parallel execution |
| **Total** | **3s** | **Faster than Stop hook** |

**Performance Guarantees:**
- `async: true` ensures no blocking of user operations
- Every step has timeout protection
- Fast failure, no retries

### Debounce Mechanism

**Timestamp File:**
- Path: `%TEMP%\claude-notify-last-wait.timestamp`
- Format: ISO 8601 timestamp (e.g., `2026-02-25T10:30:45.123456`)
- Lifecycle: Permanent (until next update)

**Debounce Logic:**
```python
DEBOUNCE_SECONDS = 10

def should_send_notification():
    if not TIMESTAMP_FILE.exists():
        return True  # First run

    last_time = read_timestamp()
    elapsed = datetime.now() - last_time

    return elapsed.total_seconds() >= DEBOUNCE_SECONDS
```

**Effect:**
- Only one notification per 10 seconds in same interaction
- Avoid notification spam
- User-friendly experience

## Success Criteria

Users should be able to:

1. ✓ Receive notification when Claude waits for input during multi-turn interactions (e.g., `/gsd:discuss`)
2. ✓ Duplicate notifications within 10 seconds are automatically suppressed
3. ✓ Notifications don't block or affect normal Claude Code operations
4. ✓ Notifications clearly distinguish between "waiting for input" and "task completed" states
5. ✓ Even if notification system fails, it doesn't affect Claude Code main flow

## Implementation Plan

**Phase 1: Core Implementation**
1. Create `notify-wait.py` script
2. Update `hooks/hooks.json` configuration
3. Test UserPromptSubmit hook triggering

**Phase 2: Testing & Verification**
1. Verify notification triggering in test project
2. Test debounce mechanism
3. Test error handling

**Phase 3: Documentation Update**
1. Update `SKILL.md` to explain wait notification feature
2. Add configuration instructions
3. Update FAQ section

## Future Extensions (Optional)

1. **Configurable debounce time**: Set via environment variable `CLAUDE_NOTIFY_DEBOUNCE`
2. **Toggle wait notifications**: Control via environment variable `CLAUDE_NOTIFY_WAIT_ENABLED`
3. **Enhanced detection**: Use more sophisticated pattern recognition (e.g., detect AskUserQuestion markers)
4. **Notification strategy**: Only notify after interaction exceeds certain duration

## Technical Constraints

- Complete within 3 seconds (faster than Stop hook)
- Must not block user prompt submission
- Must handle all error cases gracefully
- Timestamp file must be process-safe (single writer)
- Regex patterns must cover common wait scenarios

## Dependencies

- Claude CLI (for conversation history retrieval)
- Python 3.8+ (standard library only)
- `requests` library (for Pushover API)
- Windows 10+ (for Toast notifications)
- Pushover account (optional, for mobile notifications)

## Testing Strategy

**Unit Tests:**
- Test `should_send_notification()` with various timestamp scenarios
- Test `contains_wait_markers()` with different text patterns
- Test `get_recent_conversation()` mock Claude CLI responses

**Integration Tests:**
- Test full workflow in Claude Code session
- Test multi-turn interaction scenarios
- Test debounce across multiple prompts
- Test error recovery

**Manual Tests:**
- Verify notification appears on mobile device (Pushover)
- Verify notification appears on desktop (Windows Toast)
- Verify no blocking of user operations
- Verify notification content is correct

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude CLI unavailable | Cannot detect wait state | Skip notification, no impact on main flow |
| Regex false positives | Unwanted notifications | Use conservative patterns, user can disable via `.no-pushover`/`.no-windows` |
| Timestamp file corruption | Debounce fails | Graceful degradation, allow notification |
| Performance impact | User experience degradation | Strict timeouts, async execution |
| Notification spam | User annoyance | 10-second debounce, clear "waiting" message |

## References

- Claude Code hook events documentation (Context7)
- Phase 01.1 research on hook configuration
- notify.py implementation (Stop event)
- SKILL.md documentation structure
