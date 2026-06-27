---
status: resolved
trigger: "重启后发现 claude-notify 插件完全不发通知（Pushover + Windows Toast 都收不到）"
created: 2026-06-27T18:30:00+08:00
updated: 2026-06-27T18:50:00+08:00
---

## Current Focus

hypothesis: **ROOT CAUSE CONFIRMED** - 通知 hook（Stop / Notification）和自愈守卫（notify-hooks-guard.js）从 ~/.claude/settings.json 丢失，导致通知触发管线断裂
test: 直接运行 notify-stop.py 模拟 Stop hook
expecting: Pushover 通知成功发送
next_action: 已修复并验证

## Symptoms

expected: Claude Code 任务完成时收到 Pushover 推送 + Windows Toast
actual: 完全收不到任何通知
errors: 无报错（hook 根本未注册，所以静默不触发）
reproduction: 任意任务完成
started: 重启后用户注意到（实际 hook 在 2026-06-15 之前就已丢失）

## Root Cause

claude-notify 通过在 `~/.claude/settings.json` 注册全局 hook 工作：
- `Stop` (matcher `*`) → `notify-stop.py`（任务完成通知）
- `Notification` (matcher `permission_prompt|idle_prompt|elicitation_dialog`) → `notify-attention.py`（等待输入通知）
- `SessionStart` → `notify-hooks-guard.js`（自愈守卫，发现 hook 缺失时自动补回）

某次 settings.json 重写（极可能是 GSD 更新；证据：`settings.json.bak-20260615-*` 自动备份 + 所有 gsd-*.js hook 同为 06-25 时间戳）丢弃了这三项注册。由于守卫本身也被丢弃，无法自愈，hook 永久缺失 → 完全不通知。

关键证据：
- 06-15 备份的 settings.json 就已只有 `gsd-check-update`，无 notify hook（丢失早于 06-15）
- 脚本本身完好：`~/.claude/hooks/` 下 notify-stop.py / notify-attention.py / flags.py / notify-hooks-guard.js 均存在
- PUSHOVER_TOKEN / PUSHOVER_USER 环境变量已设置
- GSD 的 `managed-hooks-registry.cjs` 只管理 gsd-* hook，不包含 notify hook → GSD 不会保留它们

## Fix Applied

在 `~/.claude/settings.json` 的 hooks 段重新注册（备份至 `settings.json.bak-pre-notify-fix-20260627`）：
- SessionStart 追加 `notify-hooks-guard.js`（自愈守卫）
- 新增 Stop → `python notify-stop.py` (async, timeout 10)
- 新增 Notification → `python notify-attention.py` (async, timeout 5)

配置与 installer/src/hooks/hooks-installer.js 的 `registerGlobalHooks()` 输出完全一致。

## Verification

- settings.json JSON 合法，hooks 含 SessionStart(2)/Stop(1)/Notification(1)
- `node notify-hooks-guard.js` 运行正常（hook 已存在，no-op）
- `python notify-stop.py --diagnose`：Pushover API 测试 SUCCESS（已发测试通知）
- 模拟 Stop hook（项目目录运行 notify-stop.py）：日志 `Pushover notification sent successfully`，1 completed / 0 failed

## Secondary Issue (未自动处理，待用户决定)

项目根 `.no-windows`（20992 字节，git tracked @ a820711）**并非真正的 flag 文件**——它是 WPS Office 文档（OLE2 复合文件，D0CF11E0 magic，作者 allan，2023 年保存），被误命名。flags.py 只检查文件是否存在，故在本项目内禁用了 Windows Toast（Pushover 不受影响）。需用户确认是否删除/重命名。

## Durability 风险

settings.json 会被 GSD 更新周期性重写，届时可能再次丢弃 notify hook + 守卫。守卫只要存活就会自愈 Stop/Notification，但守卫自身被丢弃时无法自愈。若再次复发：重跑本修复，或运行 `npx @allanpk716/work-skills-setup`。
