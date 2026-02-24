# Feature Research

**Domain:** Claude Code Notification Skills
**Researched:** 2026-02-24
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Task completion notification** | Core value proposition - user wants to know when AI finishes | LOW | Uses Stop hook event. Most basic requirement. |
| **Push/remote notification** | Developers step away during long tasks - need mobile alerts | MEDIUM | Services like Pushover, Telegram, Slack provide this |
| **Desktop notification** | Local alerts when at computer but focused elsewhere | LOW | Windows Toast, macOS Notification Center |
| **Environment variable configuration** | Security requirement - API keys should not be in code | LOW | Standard practice for secrets management |
| **Hook timeout compliance** | Claude Code requires hooks complete within 5 seconds | MEDIUM | Must be fast, may need async processing |
| **Multi-instance support** | Developers often run multiple Claude Code sessions | MEDIUM | PID-based file isolation prevents conflicts |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI-generated task summaries** | Rich context in notification - what was actually done | MEDIUM | Uses Claude CLI to summarize, may fail gracefully |
| **Smart notification filtering** | Reduces notification spam - only meaningful alerts | MEDIUM | Filter out idle_prompt, duplicate alerts, noise |
| **Project name extraction** | Notifications show which project, not generic title | LOW | Uses CLAUDE_PROJECT_DIR environment variable |
| **Priority differentiation** | Attention-needed vs completion use different alert styles | LOW | Permission requests = high priority, completion = normal |
| **Dual notification channels** | Simultaneous push + desktop for reliability | LOW | Parallel execution, fail-soft on either channel |
| **Per-project disable controls** | Fine-grained control via .no-pushover / .no-windows files | LOW | Zero-config opt-out mechanism |
| **Automatic log rotation** | Maintenance-free operation - old logs cleaned automatically | LOW | Keep last N days, prevents disk bloat |
| **Graceful degradation** | Continues working when optional features fail (AI summary, desktop) | MEDIUM | Never blocks the hook from completing |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Notification for every tool use** | Want complete visibility | Overwhelming - 50+ notifications per task, causes alert fatigue | Only notify on Stop (completion) or Notification (attention needed) |
| **Config file for settings** | More flexible than environment variables | Global skills have no project directory for config files | Use environment variables + per-project .disable files |
| **Rich HTML notifications** | Better-looking alerts | Inconsistent support across platforms, complexity | Plain text with clear formatting works everywhere |
| **Real-time progress updates** | Want to see task progress | Would require streaming, exceeds 5s timeout | Final summary only, use AI to condense |
| **Sound customization** | Personalize alert sounds | Platform-specific, complex for minimal value | Use system default sounds, let OS handle |
| **Response content in notification** | See what AI replied | Notifications have character limits, privacy concerns | Summary only, link to session or log |
| **Project-level installation mode** | Per-project customization | Maintenance burden - need to install/update in every project | Global skill with per-project opt-out controls |
| **Linux/macOS system notifications** | Cross-platform support | Scope creep - most users on one OS, dilutes focus | Phase 1: Windows only, add others based on demand |

## Feature Dependencies

```
[Task Completion Notification]
    └──requires──> [Stop Hook Event]

[Remote Push Notification]
    ├──requires──> [Pushover API Credentials (env vars)]
    └──requires──> [Network Access]

[Desktop Notification]
    └──requires──> [Windows Toast / OS Notification System]

[AI-Generated Summary]
    ├──requires──> [Claude CLI Available]
    ├──requires──> [Session Cache (stores user prompt)]
    └──conflicts──> [5s Timeout] (may exceed, needs timeout)

[Multi-Instance Support]
    └──requires──> [PID-based File Isolation]

[Project Name in Notification]
    └──requires──> [CLAUDE_PROJECT_DIR Environment Variable]

[Smart Filtering]
    ├──requires──> [Notification Type Detection]
    └──requires──> [Idle Prompt Filtering]

[Graceful Degradation]
    └──enhances──> [All Notification Features]
```

### Dependency Notes

- **AI-Generated Summary requires Session Cache:** The Stop hook doesn't receive the user's original prompt, so UserPromptSubmit hook must cache it first
- **AI-Generated Summary conflicts with 5s Timeout:** Generating summary with Claude CLI can take 2-10+ seconds, needs careful timeout handling or skip strategy
- **Graceful Degradation enhances all features:** If any optional feature fails (AI summary, Windows notification, etc.), core notification still works
- **Smart Filtering requires Notification Type Detection:** Must parse hook event to filter idle_prompt vs permission_prompt vs elicitation_dialog

## MVP Definition

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- [ ] **Task completion notification** — Core value: know when AI finishes
- [ ] **Pushover remote notification** — Mobile alerts via Pushover API
- [ ] **Windows desktop notification** — Local alerts via Windows Toast
- [ ] **Environment variable configuration** — PUSHOVER_TOKEN, PUSHOVER_USER
- [ ] **Project name extraction** — Use CLAUDE_PROJECT_DIR for context
- [ ] **Hook timeout compliance** — Complete within 5 seconds
- [ ] **Basic error handling** — Fail silently, log errors for debugging

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **AI-generated task summaries** — Rich context in notifications (requires timeout handling)
- [ ] **Smart notification filtering** — Filter idle_prompt, reduce noise
- [ ] **Multi-instance support** — PID-based isolation for concurrent sessions
- [ ] **Per-project disable controls** — .no-pushover / .no-windows files
- [ ] **Automatic log rotation** — Clean up old debug logs
- [ ] **Priority differentiation** — High priority for attention-needed, normal for completion

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Additional notification channels** — Slack, Discord, Telegram, Email
- [ ] **Cross-platform support** — macOS and Linux system notifications
- [ ] **Notification history dashboard** — View past notifications, search/filter
- [ ] **Custom notification templates** — User-defined message formats
- [ ] **Notification analytics** — Track response times, notification rates
- [ ] **Batched notifications** — Group multiple completions into single alert

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Task completion notification | HIGH | LOW | P1 |
| Pushover notification | HIGH | LOW | P1 |
| Windows desktop notification | HIGH | LOW | P1 |
| Environment variable config | HIGH | LOW | P1 |
| Project name extraction | MEDIUM | LOW | P1 |
| Hook timeout compliance | HIGH | MEDIUM | P1 |
| AI-generated summaries | MEDIUM | MEDIUM | P2 |
| Smart filtering | MEDIUM | MEDIUM | P2 |
| Multi-instance support | MEDIUM | MEDIUM | P2 |
| Per-project disable | LOW | LOW | P2 |
| Log rotation | LOW | LOW | P3 |
| Priority differentiation | MEDIUM | LOW | P3 |
| Additional channels | LOW | HIGH | P3 |
| Cross-platform | LOW | HIGH | P3 |
| History dashboard | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | cc-pushover-hook (existing) | code-notify | ai-common-notify | Our Approach (claude-notify) |
|---------|----------------------------|-------------|------------------|------------------------------|
| **Installation** | Per-project install.py | Global skill | Unified service | Global skill (simpler) |
| **Notification channels** | Pushover + Windows | System desktop | Desktop only | Pushover + Windows (match) |
| **AI summaries** | Yes (Claude CLI) | No | No | Yes (match) |
| **Multi-instance** | Yes (PID isolation) | Unknown | Unknown | Yes (match) |
| **Smart filtering** | Yes (filter idle_prompt) | Yes (multiple types) | Unknown | Yes (match) |
| **Configuration** | Environment variables | Environment variables | Environment variables | Environment variables (match) |
| **Project name** | Yes (from CLAUDE_PROJECT_DIR) | Yes | Yes | Yes (match) |
| **Per-project controls** | Yes (.no-pushover files) | Unknown | Unknown | Yes (match) |
| **Log management** | Yes (rotation, cleanup) | Unknown | Unknown | Yes (match) |
| **Error handling** | Graceful degradation | Unknown | Unknown | Graceful degradation (match) |
| **Cross-platform** | Windows only | macOS, Windows, Linux | Unknown | Windows first (match scope) |

## Key Insights

### What Table Stakes Means Here

Unlike traditional software where users expect a feature set, notification skills are **infrastructure** - users only notice them when they fail or spam. This inverts the usual product thinking:

1. **Silent success is the goal** - Best notification is one you see, act on, and forget
2. **Failure modes matter more than features** - Wrong notifications are worse than no notifications
3. **Speed trumps completeness** - 5 second timeout is hard constraint, not guideline

### Differentiation Strategy

The notification space has two distinct approaches:

1. **Utility approach** (code-notify): Minimal, reliable, system-native
2. **Rich approach** (cc-pushover-hook): AI summaries, multi-channel, smart filtering

**Recommended:** Start with utility (P1 features only), add richness based on user feedback. The 5s timeout makes richness expensive - don't over-invest in features users won't notice.

### The Alert Fatigue Problem

Research shows alert fatigue is the #1 enemy:
- AWS: "Too many alerts = important ones get ignored"
- Atlassian: "30% attention drop with each repeated alert"
- Monitoring studies: "Self-healing alerts should not generate notifications"

**Implication:** Smart filtering and restraint are more valuable than feature breadth. Better to under-notify than over-notify.

### Global vs Project-Level Installation

Competitor analysis reveals a split:
- **code-notify**: Global skill, simple setup
- **cc-pushover-hook**: Project-level, more control

**Recommendation:** Global skill is correct for Phase 1:
- Simpler user experience (one install, all projects)
- Aligns with "infrastructure" nature of notifications
- Per-project .disable files provide sufficient control
- Can add project-level mode in v2 if demand exists

## Sources

- [Claude Code Hooks Documentation](https://runoob.com) - Official hooks reference
- [Notifiers Python Library](https://pypi.org/project/notifiers) - Unified notification SDK comparison
- [guanguans/notify PHP SDK](https://packagist.org/packages/guanguans/notify) - Multi-platform notification patterns
- [PingMe CLI](https://oschina.net/p/pingme) - CLI notification tool patterns
- [AWS Well-Architected Framework REL06-BP03](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_notification_monitor.html) - Alert anti-patterns
- [Atlassian IT Alerting Best Practices](https://www.atlassian.com/incident-management/on-call/it-alerting) - Alert fatigue research
- [MCP Application Monitoring Alert Template](https://blog.csdn.net/gitblog_00955/article/details/154322521) - Notification UX metrics
- [win10toast Python Library](https://pypi.org/project/win10toast) - Windows desktop notification implementation

---
*Feature research for: Claude Code notification skills*
*Researched: 2026-02-24*
