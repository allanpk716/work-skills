---
created: 2026-02-25T08:33:38.623Z
title: Add slash commands to toggle notification channels
area: tooling
files:
  - plugins/claude-notify/SKILL.md
  - plugins/claude-notify/hooks/scripts/notify.py:96-116
---

## Problem

当前 claude-notify 技能通过项目根目录的 `.no-pushover` 和 `.no-windows` 标志文件来控制通知的启用/禁用。用户需要手动创建或删除这些文件,不够便捷。需要提供更直观的斜杠命令来快速切换通知状态。

现有控制机制:
- `.no-pushover` 文件存在 → 禁用 Pushover 通知
- `.no-windows` 文件存在 → 禁用 Windows Toast 通知
- 文件不存在 → 通知启用

## Solution

创建两个斜杠命令 `/notify-enable` 和 `/notify-disable`,支持通过参数指定要控制的通知渠道(pushover/windows)。

### 命令设计

**命令 1: `/notify-enable`**
- 用途: 启用指定类型的通知
- 参数: `pushover` 或 `windows` (可选,不提供则启用全部)
- 行为: 删除对应的 `.no-*` 标志文件

**命令 2: `/notify-disable`**
- 用途: 禁用指定类型的通知
- 参数: `pushover` 或 `windows` (可选,不提供则禁用全部)
- 行为: 创建对应的 `.no-*` 标志文件

### 实现要点

1. 创建两个斜杠命令文件:
   - `plugins/claude-notify/commands/notify-enable.md`
   - `plugins/claude-notify/commands/notify-disable.md`

2. 命令实现逻辑:
   - 解析参数确定目标通知类型
   - 检查当前状态(文件是否存在)
   - 执行启用/禁用操作(创建/删除文件)
   - 提供操作反馈(已启用/已禁用/状态未改变)

3. 边界情况处理:
   - 无参数时操作所有通知渠道
   - 文件已存在/不存在时的幂等性
   - 提供清晰的状态反馈

4. 命令文档:
   - 在 SKILL.md 中添加斜杠命令使用说明
   - 包含命令示例和预期效果

### 示例用法

```bash
# 禁用 Pushover 通知
/notify-disable pushover

# 启用 Windows 通知
/notify-enable windows

# 禁用所有通知
/notify-disable

# 启用所有通知
/notify-enable
```
