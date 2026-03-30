---
status: resolved
trigger: "设置了 .no-windows 文件但仍然偶发 Windows 通知"
created: 2026-03-29T00:00:00
updated: 2026-03-30T01:00:00
---

## Current Focus

hypothesis: CONFIRMED - installer one-time copy caused deployed script to diverge from source
test: Deployed fixed source and updated installer to always re-copy
expecting: Windows notifications will no longer appear when .no-windows is present
next_action: resolved

## Symptoms

expected: 当项目目录中存在 .no-windows 文件时，不应发送 Windows 系统通知
actual: 即使存在 .no-windows 文件，Notification hook 触发的 attention 通知仍然发送 Windows 通知（偶发）
errors: 无错误信息
reproduction: 在有 .no-windows 文件的项目中使用 Claude Code，触发 permission_prompt 或 elicitation_dialog 事件

## Root Cause Chain

1. **原始 bug**: notify-attention.py 缺少 check_notification_flags() - 在上一轮已修复
2. **部署 bug（本轮）**: 修复只应用到 plugins/ 源码，未部署到 ~/.claude/hooks/ 实际运行位置
3. **安装器缺陷**: isHooksInstalled() 只检查文件是否存在，不比较内容。一旦部署过，重装会跳过整个安装流程包括文件复制

## Evidence

- plugins/claude-notify/hooks/scripts/notify-attention.py: HAS check_notification_flags() (line 168)
- ~/.claude/hooks/notify-attention.py (before fix): NO check_notification_flags(), unconditionally sends both channels (line 212-214)
- hooks-installer.js copyScripts(): uses copyFileSync (overwrites), but is never called because index.js short-circuits via isHooksInstalled()

## Resolution

root_cause: Installer uses one-time file copy from plugin source to ~/.claude/hooks/. The isHooksInstalled() guard only checks file existence, not content. After the fix was applied to source, re-running the installer skipped the copy because files already existed. This caused the deployed hook to diverge from the fixed source.

fix:
1. Deployed fixed notify-attention.py from plugin source to ~/.claude/hooks/
2. Added isHooksRegistered() to separate settings check from script existence check
3. Modified runHooksInstallation() to ALWAYS re-copy scripts (idempotent), only varying the status message

files_changed:
- ~/.claude/hooks/notify-attention.py (deployed fixed version)
- installer/src/hooks/hooks-installer.js (added isHooksRegistered, updated exports)
- installer/src/hooks/index.js (always run installHooks, show appropriate message)
