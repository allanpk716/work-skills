---
status: investigating
trigger: "work-skills-no-notifications: 在 work-skills 项目中，既收不到 Pushover 通知，也收不到 Windows 系统通知"
created: 2026-03-29T16:00:00
updated: 2026-03-29T16:30:00
---

## Current Focus

hypothesis: Claude Code 在加载插件时，当项目目录本身就是 marketplace 源仓库时，不会为该项目加载自身 marketplace 的插件 hooks。work-skills 既是 marketplace 提供者（有 .claude-plugin/marketplace.json）又是当前打开的项目，导致 self-referential 加载被跳过。
test: 已通过 session 日志对比验证。work-skills 30个 session 中仅1个有 notify.py 在 stop hooks 中（29个没有），而 nanobot_auto_update 多个 session 都有。
expecting: 如果 hypothesis 正确，需要在 work-skills 项目中通过 .claude/settings.json 或 settings.local.json 手动注册 hooks 来解决
next_action: 验证假设 - 检查在 work-skills 项目中手动配置 hooks 是否可行

## Symptoms

expected: 在 work-skills 项目中使用 Claude Code 时，应该能收到 Pushover 通知和/或 Windows 系统通知
actual: 两种通知都收不到，且没有任何通知脚本日志产生
errors: 无明显错误信息
reproduction: 在 work-skills 项目中使用 Claude Code，完成任务或触发通知
started: 用户发现此问题（可能是从没工作过）

## Eliminated

## Evidence

- timestamp: 2026-03-29T16:01
  checked: work-skills 项目根目录的 .no-pushover 和 .no-windows 文件
  found: 项目根目录没有这两个文件
  implication: 不是 flag 文件导致的禁用

- timestamp: 2026-03-29T16:02
  checked: 今日所有通知日志（claude-notify 和 claude-notify-attention）
  found: 所有日志都来自 daily_recorder 和 nanobot_auto_update 项目，没有任何来自 work-skills 的日志
  implication: hooks 在 work-skills 项目中根本没有被触发

- timestamp: 2026-03-29T16:03
  checked: 通知在其他项目中的表现
  found: daily_recorder 和 nanobot_auto_update 中通知完全正常工作（Pushover 和 Windows Toast 都成功）
  implication: 通知脚本本身没问题，问题在于 work-skills 项目的 hook 注册/加载

- timestamp: 2026-03-29T16:04
  checked: 全局 settings.json 中的 enabledPlugins
  found: "claude-notify@work-skills": true 已配置
  implication: 插件在全局级别是启用的

- timestamp: 2026-03-29T16:04
  checked: work-skills 项目的 .claude/ 目录
  found: 只有 commands 目录，没有 settings.json、settings.local.json 或 hooks.json
  implication: 项目级别没有覆盖任何配置

- timestamp: 2026-03-29T16:05
  checked: 插件 marketplace 结构
  found: work-skills 项目的 .claude-plugin/marketplace.json 定义了 claude-notify 插件（source: "./plugins/claude-notify"）；缓存在 ~/.claude/plugins/cache/work-skills/claude-notify/1.0.2/
  implication: 插件通过 marketplace 机制加载，可能存在自我引用问题

- timestamp: 2026-03-29T16:08
  checked: 手动运行 notify-attention.py 从 work-skills 目录
  found: 脚本完全正常工作，Pushover 和 Windows Toast 都成功发送
  implication: 脚本在 work-skills 目录下可以正常执行，问题不在脚本本身

- timestamp: 2026-03-29T16:15
  checked: 当前 session (6ab53e27) 的 stop_hook_summary
  found: Stop hook 只触发了 3 个 hooks（全部来自 claude-mem 插件的 bun-runner），claude-notify 的 notify.py 不在列表中
  implication: claude-notify 的 hooks 在 work-skills 项目中完全没有被注册

- timestamp: 2026-03-29T16:20
  checked: work-skills 项目所有 30 个 session 的 stop_hook_summary
  found: 只有 1 个 session (63163b6a, 2026-03-16) 的 stop hooks 中包含 notify.py，其余 29 个全部没有
  implication: 几乎所有 work-skills 的 session 都没有加载 claude-notify 的 hooks

- timestamp: 2026-03-29T16:25
  checked: nanobot_auto_update 项目的 session 对比
  found: nanobot 项目中大部分 session 的 stop_hook_summary 都包含 notify.py
  implication: 同一个插件在非 marketplace 源项目中正常加载 hooks

- timestamp: 2026-03-29T16:28
  checked: marketplace 注册路径
  found: marketplace 源是 ~/.claude/plugins/marketplaces/work-skills/（git clone from GitHub），而 work-skills 项目目录是 C:/WorkSpace/agent/work-skills/，两者是不同的路径
  implication: Claude Code 可能通过路径比对来判断"自我引用"，当项目目录和 marketplace clone 目录路径不匹配时可能不触发

- timestamp: 2026-03-29T16:30
  checked: 插件目录中的 .no-pushover 文件
  found: plugins/claude-notify/.no-pushover 存在于源目录和缓存目录中
  implication: 不影响，因为脚本检查的是 Path.cwd() 不是插件目录

## Resolution

root_cause:
fix:
verification:
files_changed: []
