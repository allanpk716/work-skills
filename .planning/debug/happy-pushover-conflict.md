---
status: diagnosed
trigger: "安装 https://github.com/slopus/happy 后，本项目的 pushover 通知失效"
created: 2026-04-10T13:00:00+08:00
updated: 2026-04-10T14:00:00+08:00
---

## Current Focus

hypothesis: CONFIRMED - ~/.claude/settings.json 在 2026-04-09 17:00 被完全重写，丢失了 Stop 和 Notification hooks 注册
test: 时间线对比分析
expecting: Happy npm install (16:55) 后，settings.json (17:00) 被某个操作重写
next_action: 返回诊断结果

## Symptoms

expected: 本项目配置的 pushover 通知正常工作
actual: 安装 happy 程序后，pushover 通知不再工作
errors: 用户未提供具体错误信息
reproduction: 安装 happy 后触发通知即可复现
started: 安装 happy 后开始出现

## Eliminated

- hypothesis: Happy 直接修改了 ~/.claude/settings.json，删除了 Stop/Notification hooks
  evidence: Happy 源码分析确认它只修改 ~/.happy/settings.json（Happy 自己的配置），不修改 ~/.claude/settings.json。Happy 的 persistence 模块操作的 settingsFile 是 ~/.happy/settings.json。
  timestamp: 2026-04-10T13:30

- hypothesis: Happy 的 --settings 参数替换了全局 settings.json 的 hooks
  evidence: Claude Code 的 --settings 参数是合并（merge）行为（GitHub issue #11392 确认）。Happy 传递的临时文件只包含 SessionStart hook，应与现有 hooks 合并而非替换。
  timestamp: 2026-04-10T13:35

- hypothesis: Happy 的 postinstall 脚本修改了 settings.json
  evidence: Happy 的 postinstall 脚本 (unpack-tools.cjs) 只解压 difftastic 和 ripgrep 二进制文件，完全不涉及 Claude 配置。
  timestamp: 2026-04-10T13:40## Evidence

- timestamp: 2026-04-10T13:05
  checked: ~/.claude/settings.json 的 hooks 配置
  found: 只有 SessionStart hook（GSD 的 gsd-check-update.js），**没有 Stop 和 Notification hooks**
  implication: 通知脚本根本不会触发，这是通知失效的直接原因

- timestamp: 2026-04-10T13:06
  checked: ~/.claude/settings.json 的文件时间戳
  found: Birth: 2026-04-09 17:00:38，Modify: 2026-04-09 17:00:38 - 文件是昨天创建的
  implication: settings.json 在昨天被重新创建或完全覆写，丢失了原有的 Stop/Notification hooks 注册

- timestamp: 2026-04-10T13:08
  checked: ~/.claude/hooks/ 目录
  found: notify-stop.py、notify-attention.py、flags.py 仍然存在（4月2日的版本）
  implication: 通知脚本本身没有被删除，问题不在脚本层面

- timestamp: 2026-04-10T13:10
  checked: Happy CLI 源码 (happy v1.1.4, npm 全局安装)
  found: Happy 通过 `--settings <path>` 参数传递临时文件（如 session-hook-11456.json），文件内容只有 `{hooks: {SessionStart: [...]}}`
  implication: Happy 不会直接修改 ~/.claude/settings.json

- timestamp: 2026-04-10T13:12
  checked: Happy 的 claude-env 功能
  found: Happy 支持 `--claude-env KEY=VALUE` 设置 Claude Code 的环境变量，但不会修改 settings.json
  implication: Happy 不直接覆盖 settings.json

- timestamp: 2026-04-10T13:14
  checked: Claude Code `--settings` 标志的行为（GitHub issue #11392）
  found: `--settings` 标志是**合并**行为（merge），不是替换。Happy 传的 SessionStart hook 应与全局 settings.json 的 hooks 合并
  implication: 即使 Happy 使用 --settings，也不应覆盖现有的 Stop/Notification hooks

- timestamp: 2026-04-10T13:16
  checked: 本项目通知机制（hooks-installer.js）
  found: Stop hook 注册 notify-stop.py，Notification hook 注册 notify-attention.py，都应写入 ~/.claude/settings.json 的 hooks 节
  implication: 这些 hooks 需要在 settings.json 中注册才能工作

- timestamp: 2026-04-10T13:20
  checked: 通知日志时间线
  found: 最后一次成功通知日志是 2026-04-09 08:03（Pushover 成功发送），之后再无通知日志
  implication: hooks 在 4月9日 08:03 之后停止触发，与 settings.json 被重写的时间吻合

- timestamp: 2026-04-10T13:25
  checked: Happy npm 包安装时间 vs settings.json 创建时间
  found: Happy package.json 创建时间 2026-04-09 16:55:48，settings.json 创建时间 2026-04-09 17:00:38（仅差5分钟）
  implication: 两个事件高度关联。Happy 安装完成后约5分钟，settings.json 被重写

- timestamp: 2026-04-10T13:30
  checked: Happy 使用的 settingsFile 路径
  found: Happy 的 Configuration 类中 settingsFile = path.join(happyHomeDir, "settings.json")，即 ~/.happy/settings.json
  implication: Happy 的 persistence 模块操作的是自己的配置文件，不是 Claude 的

- timestamp: 2026-04-10T13:35
  checked: enabledPlugins 中是否包含 claude-notify
  found: 当前 settings.json 的 enabledPlugins 中**不包含** claude-notify@work-skills
  implication: 之前的 session 记录中显示曾启用过 claude-notify@work-skills，进一步确认 settings.json 被完全重写

- timestamp: 2026-04-10T13:45
  checked: 4月9日 17:00 左右的 Claude Code 会话
  found: work-me-around/DepartmentProjectInfoService 有一个 4月9日 17:47 的会话（entrypoint: sdk-ts），可能是通过 Happy 启动的
  implication: settings.json 在 17:00 被重写后，17:47 的会话已经受影响

- timestamp: 2026-04-10T13:50
  checked: Happy 启动 Claude Code 的完整流程
  found: Happy 使用 claudeLocal() 函数，通过 spawn 启动 Claude Code，传入 --settings <temp-hook-file> 和 --append-system-prompt 等参数。使用 process.env（非 clean env）传递环境变量。
  implication: Happy 不会改变 Claude Code 读取 ~/.claude/settings.json 的行为

## Resolution

root_cause: |
  ~/.claude/settings.json 在 2026-04-09 17:00:38 被完全重写，丢失了 Stop 和 Notification hooks 注册。

  **直接原因：** 当前 settings.json 中只有 SessionStart hook（GSD），缺少 Stop hook（notify-stop.py）和 Notification hook（notify-attention.py），导致通知脚本永远不会被 Claude Code 调用。

  **时间线：**
  - 2026-04-09 08:03 -- 最后一次通知成功（日志确认 Pushover 发送成功）
  - 2026-04-09 16:55 -- Happy npm 包安装/更新完成
  - 2026-04-09 17:00 -- settings.json 被完全重写（Birth 和 Modify 时间相同，说明是新建文件）
  - 2026-04-09 17:47 -- 第一个受影响的会话（通过 Happy 启动的 DepartmentProjectInfoService）

  **间接关联：** Happy 安装后约5分钟，settings.json 被重写。但 Happy 源码确认它不直接修改 ~/.claude/settings.json。可能的原因：
  1. Happy 安装后用户运行了 Happy 或 Happy 的某个配置命令，间接触发 Claude Code 重写 settings.json
  2. Claude Code 自身在某个操作（如用户通过 UI 修改设置、启用/禁用插件）中重写了 settings.json，但未保留原有的 hooks 配置
  3. 其他工具或手动编辑导致

  **关键技术证据：**
  - Happy 使用 --settings 参数传递临时 hooks 文件（只有 SessionStart），与全局 settings.json **合并**（不是替换），所以 Happy 运行时不应影响现有 hooks
  - 通知脚本文件（notify-stop.py、notify-attention.py、flags.py）仍然存在于 ~/.claude/hooks/ 目录
  - 问题不是脚本缺失或环境变量问题，而是 hooks 注册丢失

fix: |
  重新运行 npx 安装命令恢复 hooks 注册：
  ```bash
  npx github:allanpk716/work-skills#main
  ```
  此命令会调用 hooks-installer.js，重新在 ~/.claude/settings.json 中注册 Stop 和 Notification hooks。

  **长期改进建议：** hooks-installer.js 应该在每次 Claude Code 会话启动时检查 hooks 是否存在（通过 SessionStart hook），如果不存在则自动重新注册。或者将 hooks 注册逻辑添加到 GSD 的 check-update 脚本中。
verification:
files_changed: []
