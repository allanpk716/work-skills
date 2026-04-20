# 斜杠命令详情

> 返回 [SKILL.md](../SKILL.md) 主文档

提供便捷的斜杠命令来控制通知通道和检查环境配置。

## /check-notify-env

检查 claude-notify 插件的运行环境是否满足要求。

**用法:**
```
/check-notify-env
```

**示例:**
```bash
/check-notify-env
```

**检查项目:**
- ✓ Python 版本 (3.8+)
- ✓ Python 依赖包 (requests 库)
- ✓ 环境变量 (PUSHOVER_TOKEN, PUSHOVER_USER)
- ✓ Hooks 配置 (Stop hook, Notification hook)

**输出示例 (所有检查通过):**
```
=== Claude Notify 环境检查 ===

✓ Python 版本: 3.11.9 (满足要求 >= 3.8)
✓ requests 库: 2.32.5 (已安装)
✓ 环境变量 PUSHOVER_TOKEN: 已设置
✓ 环境变量 PUSHOVER_USER: 已设置
✓ Stop hook: 已配置
✓ Notification hook: 已配置

所有检查通过! 通知功能已准备就绪。
```

**输出示例 (发现问题):**
```
=== Claude Notify 环境检查 ===

✓ Python 版本: 3.11.9 (满足要求 >= 3.8)
✗ requests 库: 未安装
  修复方法: python -m pip install requests
✓ 环境变量 PUSHOVER_TOKEN: 已设置
✓ 环境变量 PUSHOVER_USER: 已设置
✗ Stop hook: 未配置
  修复方法: Hooks 需要手动添加到 settings.json

发现问题: 请按照上述修复方法解决配置问题。
```

**使用场景:**
- 在新机器上安装插件后验证环境
- 通知功能不工作时快速诊断问题
- 定期检查配置是否正确

**工作原理:**
此命令检查系统环境、Python 依赖、环境变量和 Claude Code hooks 配置,自动诊断可能导致通知失败的问题,并提供具体的修复步骤。

---

## /notify-enable

启用指定的通知通道。

**用法:**
```
/notify-enable <pushover|windows>
```

**参数:**
- `pushover` - 启用 Pushover 推送通知
- `windows` - 启用 Windows Toast 通知

**示例:**
```bash
# 启用 Pushover 通知
/notify-enable pushover

# 启用 Windows 通知
/notify-enable windows
```

**工作原理:**
此命令调用 `scripts/notify-enable.py`,通过删除项目根目录的 `.no-{channel}` 标志文件来启用通知。操作是幂等的 - 如果通知已启用,会显示"已处于启用状态"。

**反馈消息:**
- 成功启用: "Pushover 通知已启用"
- 已处于启用状态: "Pushover 通知已处于启用状态"
- 无效参数: 显示帮助信息

---

## /notify-disable

禁用指定的通知通道。

**用法:**
```
/notify-disable <pushover|windows>
```

**参数:**
- `pushover` - 禁用 Pushover 推送通知
- `windows` - 禁用 Windows Toast 通知

**示例:**
```bash
# 禁用 Pushover 通知
/notify-disable pushover

# 禁用 Windows 通知
/notify-disable windows
```

**工作原理:**
此命令调用 `scripts/notify-disable.py`,通过在项目根目录创建 `.no-{channel}` 标志文件来禁用通知。操作是幂等的 - 如果通知已禁用,会显示"已处于禁用状态"。

**反馈消息:**
- 成功禁用: "Pushover 通知已禁用"
- 已处于禁用状态: "Pushover 通知已处于禁用状态"
- 无效参数: 显示帮助信息

---

## /notify-status

查看所有通知通道的当前状态。

**用法:**
```
/notify-status
```

**示例:**
```bash
/notify-status
```

**输出示例:**
```
Pushover 通知: ✓ 已启用
Windows 通知: ✗ 已禁用
```

**工作原理:**
此命令调用 `scripts/notify-status.py`,检查项目根目录是否存在 `.no-pushover` 和 `.no-windows` 标志文件,并显示每个通道的当前状态。

**状态图标:**
- `✓` - 通道已启用(标志文件不存在)
- `✗` - 通道已禁用(标志文件存在)

---

## 项目级控制开关 (旧方法)

除了使用斜杠命令,您也可以手动创建标志文件来控制通知:

### 禁用特定项目的 Pushover 通知

在项目根目录创建 `.no-pushover` 文件:

```cmd
REM 命令提示符
type nul > .no-pushover

REM 或使用 PowerShell
New-Item -Path .no-pushover -ItemType file
```

**效果:**
- 该项目不会发送 Pushover 通知
- Windows Toast 通知继续正常工作
- 适用于个人项目或不需要远程通知的场景

### 禁用特定项目的 Windows 通知

在项目根目录创建 `.no-windows` 文件:

```cmd
type nul > .no-windows
```

**效果:**
- 该项目不会发送 Windows Toast 通知
- Pushover 通知继续正常工作
- 适用于在共享屏幕演示时避免干扰

### 同时禁用两种通知

创建两个文件:

```cmd
type nul > .no-pushover
type nul > .no-windows
```

**效果:** 该项目完全禁用所有通知。

**推荐:** 使用斜杠命令 (`/notify-disable`) 更便捷,效果相同。
