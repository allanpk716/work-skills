---
name: claude-notify
description: 当 Claude Code 任务完成时发送 Pushover 推送通知和 Windows Toast 通知。通过环境变量 PUSHOVER_TOKEN 和 PUSHOVER_USER 配置。
version: 1.0.0
---

# Claude Notify 技能

自动化通知系统,当 Claude Code 完成任务时自动触发。通过 Pushover 接收即时移动推送通知,在 Windows 系统上接收桌面 Toast 通知。

## 功能特性

- **Pushover 集成**: 向移动设备发送推送通知
- **Windows Toast 通知**: Windows 系统桌面通知
- **AI 驱动摘要**: 使用 Claude CLI 自动生成简洁的任务摘要
- **并行执行**: 同时发送通知以获得最快速度
- **优雅降级**: 即使未配置 Pushover 凭据也能工作
- **超时保护**: 在 5 秒内完成,避免阻塞 Claude Code

## 工作原理

此技能是 **Hook 触发型** - 当 Claude Code 完成任务后自动运行。无需手动调用。

1. Claude Code 在任务完成时触发 `Stop` hook
2. 通知脚本在后台运行(异步模式)
3. 脚本使用 Claude CLI 生成任务摘要
4. Pushover 和 Windows Toast 通知并行发送
5. 您在设备上即时接收通知

## 快速开始

### 前提条件

- **Python**: 3.8 或更高版本
- **操作系统**: Windows(用于 Toast 通知)
- **Pushover 账号**: 可选(仅移动通知需要)
- **Claude CLI**: 可选(用于 AI 驱动的摘要)

### 步骤 1: 安装插件

从插件市场安装:

```
/plugin install <marketplace-url>
```

将 `<marketplace-url>` 替换为包含此市场的 GitHub 仓库 URL。

### 步骤 2: 配置环境变量

设置 Pushover 凭据(移动通知必需):

**Windows (命令提示符):**
```cmd
setx PUSHOVER_TOKEN "your-pushover-app-token"
setx PUSHOVER_USER "your-pushover-user-key"
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("PUSHOVER_TOKEN", "your-pushover-app-token", "User")
[Environment]::SetEnvironmentVariable("PUSHOVER_USER", "your-pushover-user-key", "User")
```

**重要提示:** 设置环境变量后,需要**重启命令行窗口**或**重新打开终端**才能生效。

**获取 Pushover 凭据:**
1. 在 https://pushover.net 创建 Pushover 账号
2. 在 Pushover 控制面板中创建新应用
3. 复制 **API Token**(这是 `PUSHOVER_TOKEN`)
4. 从控制面板复制您的 **User Key**(这是 `PUSHOVER_USER`)

**注意:** Windows Toast 通知无需任何配置即可工作。

### 步骤 3: 验证安装

运行验证脚本检查您的设置:

```bash
python skills/claude-notify/scripts/verify-installation.py
```

此脚本将检查:
- Python 版本兼容性
- 必需的 Python 库
- 环境变量配置
- Pushover API 连接性
- Windows Toast 通知功能

**示例输出:**
```
✓ Python 版本: 3.10.0 (满足要求 >= 3.8)
✓ 环境变量 PUSHOVER_TOKEN 已设置
✓ 环境变量 PUSHOVER_USER 已设置
✓ Pushover API 连接测试成功
✓ Windows Toast 通知测试成功

所有检查通过!通知功能已准备就绪。
```

### 步骤 4: 测试

安装后 Hook 会自动激活。在 Claude Code 中完成任何任务,您应该会收到通知。

**预期行为:**
- 任务完成时,您会在手机上收到 Pushover 推送通知(如果已配置)
- 同时在 Windows 桌面收到 Toast 通知
- 通知标题显示项目名称,内容包含任务摘要

## 配置指南

### Pushover 详细配置

#### 1. 创建 Pushover 账号

1. 访问 https://pushover.net
2. 点击 "Sign Up" 创建账号
3. 使用邮箱验证完成注册

#### 2. 创建应用并获取凭据

1. 登录后,访问 https://pushover.net/apps/build
2. 填写应用信息:
   - **Name**: Claude Code Notify (或任何您喜欢的名称)
   - **Type**: Application
  - **Description**: Claude Code 任务完成通知
3. 点击 "Create Application"
4. 创建后,您会看到:
   - **API Token/Key**: 这是您的 `PUSHOVER_TOKEN`
   - **User Key**: 页面右上角显示,这是您的 `PUSHOVER_USER`

#### 3. 配置环境变量

**永久配置(推荐):**

```cmd
REM 命令提示符 - 设置用户级环境变量
setx PUSHOVER_TOKEN "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5"
setx PUSHOVER_USER "u1b2c3d4e5f6g7h8i9j0k1l2m"

REM 验证设置
echo %PUSHOVER_TOKEN%
echo %PUSHOVER_USER%
```

```powershell
# PowerShell - 设置用户级环境变量
[Environment]::SetEnvironmentVariable("PUSHOVER_TOKEN", "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5", "User")
[Environment]::SetEnvironmentVariable("PUSHOVER_USER", "u1b2c3d4e5f6g7h8i9j0k1l2m", "User")

# 验证设置
[Environment]::GetEnvironmentVariable("PUSHOVER_TOKEN", "User")
[Environment]::GetEnvironmentVariable("PUSHOVER_USER", "User")
```

**临时配置(仅当前会话):**

```cmd
REM 仅在当前命令行窗口有效
set PUSHOVER_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5
set PUSHOVER_USER=u1b2c3d4e5f6g7h8i9j0k1l2m
```

#### 4. 验证凭据

运行诊断脚本确认配置正确:

```bash
python skills/claude-notify/hooks/scripts/notify.py --diagnose
```

**诊断输出示例:**
```
=== Claude Notify 诊断报告 ===

环境检查:
✓ PUSHOVER_TOKEN: a1b2...4o5 (已设置)
✓ PUSHOVER_USER: u1b2...2m (已设置)

连接测试:
✓ Pushover API 连接: 成功
✓ 发送测试通知: 成功

配置完成!通知功能已就绪。
```

### 项目级控制开关

#### 禁用特定项目的 Pushover 通知

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

#### 禁用特定项目的 Windows 通知

在项目根目录创建 `.no-windows` 文件:

```cmd
type nul > .no-windows
```

**效果:**
- 该项目不会发送 Windows Toast 通知
- Pushover 通知继续正常工作
- 适用于在共享屏幕演示时避免干扰

#### 同时禁用两种通知

创建两个文件:

```cmd
type nul > .no-pushover
type nul > .no-windows
```

**效果:** 该项目完全禁用所有通知。

### 配置示例场景

**场景 1: 工作项目需要移动通知**

```cmd
REM 设置全局 Pushover 凭据
setx PUSHOVER_TOKEN "your-work-token"
setx PUSHOVER_USER "your-user-key"

REM 在特定个人项目中禁用 Pushover
cd C:\Projects\personal-project
type nul > .no-pushover
```

**场景 2: 演示时避免桌面通知干扰**

```cmd
REM 在演示项目中禁用 Windows Toast
cd C:\Projects\demo-project
type nul > .no-windows

REM Pushover 通知仍然会发送到手机
```

**场景 3: 测试环境不需要通知**

```cmd
REM 在测试项目中禁用所有通知
cd C:\Projects\test-project
type nul > .no-pushover
type nul > .no-windows
```

## 使用说明

无需手动操作 - 通知在 Claude Code 任务完成时自动发送。

**示例通知:**
```
标题: work-skills
消息: 完成了使用 JWT 令牌实现用户认证功能
```

**通知内容:**
- **标题**: 当前项目名称(从 `CLAUDE_PROJECT_DIR` 环境变量提取)
- **消息**: AI 生成的任务摘要(或 Claude CLI 失败时的降级消息)
- **优先级**: 正常优先级(Pushover priority 0)

## 常见问题 (FAQ)

### Q: 为什么没有收到任何通知?

**可能原因:**
1. 环境变量未正确设置或未生效
2. Pushover API 凭据无效
3. Hook 未正确安装
4. 项目根目录存在 `.no-pushover` 和 `.no-windows` 文件

**解决步骤:**

1. **验证环境变量:**
   ```cmd
   REM 命令提示符
   echo %PUSHOVER_TOKEN%
   echo %PUSHOVER_USER%

   REM PowerShell
   [Environment]::GetEnvironmentVariable("PUSHOVER_TOKEN", "User")
   ```

   如果显示为空,需要重新设置并重启终端。

2. **运行验证脚本:**
   ```bash
   python scripts/verify-installation.py
   ```

   脚本会检查所有依赖项并给出明确的错误提示。

3. **检查 Hook 安装:**
   ```bash
   REM 查看 Claude Code 调试日志
   claude --debug
   ```

   在日志中查找 Hook 执行记录。

4. **检查项目控制文件:**
   ```cmd
   dir .no-*
   ```

   如果存在 `.no-pushover` 或 `.no-windows`,删除它们:
   ```cmd
   del .no-pushover
   del .no-windows
   ```

### Q: Pushover 通知不工作,但 Windows Toast 正常?

**可能原因:**
1. Pushover 凭据错误或不完整
2. Pushover API 配额已用完
3. 网络无法访问 Pushover API (api.pushover.net)
4. 项目根目录存在 `.no-pushover` 文件

**解决步骤:**

1. **验证凭据格式:**
   - `PUSHOVER_TOKEN` 应该是 30 个字符的字符串
   - `PUSHOVER_USER` 应该是 30 个字符的字符串
   - 在 Pushover 控制面板 https://pushover.net 确认凭据

2. **运行诊断脚本:**
   ```bash
   python hooks/scripts/notify.py --diagnose
   ```

   诊断脚本会尝试发送真实的测试通知并显示详细错误。

3. **检查 API 配额:**
   - 登录 https://pushover.net
   - 查看当前月份的 API 调用次数
   - 免费账号每月限制 7,500 条消息

4. **测试网络连接:**
   ```cmd
   ping api.pushover.net
   ```

   如果无法连接,检查网络设置或防火墙。

5. **检查项目控制文件:**
   ```cmd
   dir .no-pushover
   ```

   如果文件存在,删除它:
   ```cmd
   del .no-pushover
   ```

### Q: Windows Toast 通知不出现?

**可能原因:**
1. Windows 通知设置被禁用
2. PowerShell 执行策略阻止脚本运行
3. 通知专注模式(Focus Assist)激活
4. 项目根目录存在 `.no-windows` 文件

**解决步骤:**

1. **启用 Windows 通知:**
   - 打开 **设置** → **系统** → **通知和操作**
   - 确保 **获取通知来自应用和其他发送者** 已开启
   - 向下滚动,确保 **Claude Code** 或 **PowerShell** 未被禁用

2. **检查 PowerShell 执行策略:**
   ```powershell
   Get-ExecutionPolicy
   ```

   如果返回 `Restricted`,需要修改:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **检查专注模式:**
   - 点击任务栏右下角的通知图标
   - 确保未启用 **专注模式**(Focus Assist)
   - 或在设置中添加例外

4. **手动测试 Toast 通知:**
   ```powershell
   Add-Type -AssemblyName System.Windows.Forms
   [System.Windows.Forms.MessageBox]::Show("Test notification", "Test")
   ```

   如果能看到消息框,说明基本功能正常。

5. **检查项目控制文件:**
   ```cmd
   dir .no-windows
   ```

   如果文件存在,删除它:
   ```cmd
   del .no-windows
   ```

### Q: 通知发送很慢,超过 5 秒?

**预期行为:** 通知应该在 4 秒内完成。

**可能原因:**
1. 网络延迟高,访问 Pushover API 超过 2 秒
2. Claude CLI 生成摘要超过 2 秒
3. 系统资源紧张,PowerShell 启动缓慢

**优化措施:**

1. **检查网络延迟:**
   ```cmd
   ping api.pushover.net -t
   ```

   如果延迟超过 500ms,可能影响通知速度。

2. **检查 Claude CLI 性能:**
   ```bash
   time claude summary "test message"
   ```

   如果超过 2 秒,脚本会自动降级到固定消息模板。

3. **查看日志文件:**
   ```cmd
   type %APPDATA%\claude-notify\logs\notify-*.log
   ```

   日志会显示每个步骤的耗时,帮助定位瓶颈。

4. **应用的超时保护:**
   - Claude CLI 超时: 2 秒 → 降级到固定消息
   - Pushover API 超时: 4 秒 → 跳过 Pushover,仅发送 Windows Toast
   - Windows Toast 超时: 1 秒 → 跳过 Windows,仅发送 Pushover
   - 总体超时: 5 秒 → 确保不超过 Claude Code 的 5 秒限制

### Q: 如何为特定项目禁用通知?

**禁用 Pushover 通知:**

在项目根目录创建 `.no-pushover` 文件:

```cmd
REM 命令提示符
type nul > .no-pushover

REM PowerShell
New-Item -Path .no-pushover -ItemType file
```

**禁用 Windows Toast 通知:**

在项目根目录创建 `.no-windows` 文件:

```cmd
type nul > .no-windows
```

**禁用所有通知:**

创建两个文件:

```cmd
type nul > .no-pushover
type nul > .no-windows
```

**恢复通知:**

删除对应的文件:

```cmd
del .no-pushover
del .no-windows
```

### Q: 如何查看日志文件进行故障排查?

**日志文件位置:**

```
%APPDATA%\claude-notify\logs\
```

完整路径示例: `C:\Users\YourName\AppData\Roaming\claude-notify\logs\`

**日志文件命名格式:**

```
notify-YYYYMMDD-PID.log
```

示例: `notify-20260224-12345.log`

- `YYYYMMDD`: 日期(2026年2月24日)
- `PID`: 进程 ID(用于区分并发实例)

**查看日志:**

```cmd
REM 打开日志目录
explorer %APPDATA%\claude-notify\logs\

REM 或在命令行查看最新日志
type %APPDATA%\claude-notify\logs\notify-*.log | more
```

**日志内容包括:**
- 执行时间戳
- 项目名称
- 摘要生成状态(成功/失败/降级)
- Pushover 通知状态(成功/失败/跳过)
- Windows Toast 状态(成功/失败/跳过)
- 每个步骤的耗时
- 错误详情(如果有)

**日志保留策略:**
- 自动保留最近 5 天的日志
- 超过 5 天的日志文件会被自动清理
- 每次脚本运行时执行清理

### Q: 收到的通知内容不准确或显示固定消息?

**原因:**

通知使用 Claude CLI 生成任务摘要,如果摘要生成失败,会降级到固定消息模板。

**可能的失败原因:**
1. Claude CLI 未安装或不在 PATH 中
2. Claude CLI 响应超过 2 秒
3. 项目路径包含特殊字符导致编码问题

**固定消息模板示例:**
```
标题: work-skills
消息: Claude Code task completed in work-skills
```

**解决步骤:**

1. **验证 Claude CLI 安装:**
   ```bash
   claude --version
   ```

   如果命令不存在,需要安装 Claude CLI。

2. **测试摘要生成:**
   ```bash
   claude summary "Your recent conversation with Claude"
   ```

   检查是否能正常生成摘要。

3. **检查日志文件:**
   ```cmd
   type %APPDATA%\claude-notify\logs\notify-*.log | findstr "summary"
   ```

   查看摘要生成的详细错误信息。

4. **接受降级行为:**
   - 即使使用固定消息,通知功能仍然有效
   - 固定消息仍包含项目名称,足以区分不同项目
   - 这是预期内的优雅降级行为

### Q: 多个 Claude Code 会话同时运行,通知会冲突吗?

**答案:** 不会冲突。

**设计:**
- 每个会话使用独立的日志文件(文件名包含 PID)
- 通知并行发送,互不干扰
- 即使一个会话的通知失败,不影响其他会话

**日志文件隔离:**

```
notify-20260224-12345.log  ← 会话 1 (PID 12345)
notify-20260224-67890.log  ← 会话 2 (PID 67890)
```

**并发处理:**
- 使用 `ThreadPoolExecutor` 并行发送通知
- Pushover 和 Windows Toast 互相独立
- 严格的超时控制确保不会互相阻塞

**测试并发:**
1. 在两个终端窗口中同时运行 Claude Code
2. 分别在不同项目中执行任务
3. 两个项目都应该收到独立的通知

### Q: 为什么 Pushover 通知有时会失败,但 Windows 通知正常?

**原因:** Pushover API 响应时间受网络条件影响,可能在 2-6 秒之间波动。

**诊断步骤:**

1. **查看日志文件:**
   ```cmd
   type %APPDATA%\claude-notify\logs\claude-notify-*.log | find "Pushover"
   ```

   如果看到 "Pushover API timeout",说明网络延迟导致超时。

2. **测试网络连接:**
   ```bash
   python -c "import requests, time, os
   start = time.time()
   r = requests.post('https://api.pushover.net/1/messages.json',
       data={'token': os.environ['PUSHOVER_TOKEN'],
             'user': os.environ['PUSHOVER_USER'],
             'message': 'Test', 'title': 'Test'},
       timeout=6)
   print(f'Status: {r.status_code}, Time: {time.time()-start:.2f}s')"
   ```

**解决方案:**
- **当前超时设置:** 4 秒 (已针对慢网络优化)
- **降级策略:** 如果 Pushover 超时,Windows Toast 通知仍然会正常工作
- **网络优化:** 如果持续超时,考虑检查网络代理设置或切换到更稳定的网络

**设计权衡:**
- 超时设为 4 秒而非更长,是为了确保整体脚本在 5 秒内完成
- Windows Toast 是本地通知,几乎总是能成功
- 至少保证一个通知渠道可用,比两个都因超时而失败更好

## 技术参考

### 超时策略

| 操作 | 超时时间 | 说明 |
|------|---------|------|
| Claude CLI 摘要 | 2 秒 | 生成任务摘要,失败后降级到固定消息 |
| Pushover API | 4 秒 | HTTP POST 请求到 api.pushover.net:443 (适应网络延迟) |
| Windows Toast | 1 秒 | PowerShell 调用 Windows.UI.Notifications |
| **总体执行** | **5 秒** | **小于 Claude Code 的 5 秒限制** |

### 并行执行架构

使用 Python `concurrent.futures.ThreadPoolExecutor` 实现:

```python
with ThreadPoolExecutor(max_workers=2) as executor:
    pushover_future = executor.submit(send_pushover, ...)
    windows_future = executor.submit(send_windows, ...)
```

**优势:**
- 两个通知通道完全独立
- 一个失败不影响另一个
- 总耗时等于最慢的通道,而非两者之和

### 错误码列表

脚本使用标准 Python 异常,无自定义错误码。常见错误类型:

| 异常类型 | 含义 | 处理策略 |
|---------|------|---------|
| `EnvironmentError` | 环境变量未设置 | 记录警告,跳过 Pushover 通知 |
| `requests.Timeout` | Pushover API 超时 | 记录错误,继续发送 Windows Toast |
| `subprocess.TimeoutExpired` | Claude CLI 超时 | 使用固定消息模板 |
| `OSError` | 文件或目录操作失败 | 记录错误,继续执行 |
| `UnicodeEncodeError` | 路径编码问题 | 使用 UTF-8 编码处理 |

### 日志文件

**位置:** `%APPDATA%\claude-notify\logs\`

**命名:** `notify-YYYYMMDD-PID.log`

**示例:** `notify-20260224-12345.log`

**内容格式:**
```
[2026-02-24 14:30:15] INFO: Starting notification for project: work-skills
[2026-02-24 14:30:15] INFO: Generating summary with Claude CLI
[2026-02-24 14:30:16] INFO: Summary generated: "完成了用户认证功能实现"
[2026-02-24 14:30:16] INFO: Sending Pushover notification
[2026-02-24 14:30:17] INFO: Pushover notification sent successfully (1.2s)
[2026-02-24 14:30:17] INFO: Sending Windows Toast notification
[2026-02-24 14:30:17] INFO: Windows Toast sent successfully (0.3s)
[2026-02-24 14:30:17] INFO: Total execution time: 2.1 seconds
```

**自动清理:**
- 保留最近 5 天的日志
- 每次脚本启动时执行清理
- 删除超过 5 天的 `.log` 文件

### 诊断命令

**完整诊断:**
```bash
python skills/claude-notify/hooks/scripts/notify.py --diagnose
```

**输出内容:**
- 环境变量检查(PUSHOVER_TOKEN, PUSHOVER_USER)
- Python 版本验证
- 必需文件存在性检查
- Pushover API 连接测试(发送真实测试通知)
- Windows Toast 功能测试

**仅检查环境:**
```bash
python skills/claude-notify/scripts/verify-installation.py
```

**手动测试 Pushover:**
```bash
python -c "import requests; requests.post('https://api.pushover.net/1/messages.json', data={'token': 'YOUR_TOKEN', 'user': 'YOUR_USER', 'message': 'Test'})"
```

### 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| Python | 3.6+ | 3.10+ |
| 操作系统 | Windows 10 | Windows 10 1903+ |
| 网络 | 能访问 api.pushover.net:443 | 稳定互联网连接 |
| Claude CLI | 可选 | 最新版本 |
| Pushover 账号 | 可选 | 免费 7,500 条/月 |

### 配置文件位置

| 文件/目录 | 位置 | 用途 |
|----------|------|------|
| Hook 配置 | `hooks/hooks.json` | 定义 Stop 事件触发的脚本 |
| 通知脚本 | `skills/claude-notify/hooks/scripts/notify.py` | 主通知逻辑 |
| 验证脚本 | `skills/claude-notify/scripts/verify-installation.py` | 安装验证工具 |
| 日志目录 | `%APPDATA%\claude-notify\logs\` | 调试日志 |
| Pushover 控制文件 | 项目根目录 `.no-pushover` | 禁用 Pushover |
| Windows 控制文件 | 项目根目录 `.no-windows` | 禁用 Windows Toast |

### 依赖关系

**Python 标准库(无需安装):**
- `concurrent.futures`: 并行执行
- `logging`: 日志记录
- `os`: 环境变量和文件操作
- `pathlib`: 路径处理
- `subprocess`: 调用 Claude CLI 和 PowerShell
- `time`: 计时

**第三方依赖:**
- `requests`: HTTP 请求到 Pushover API(唯一的外部依赖)

**安装依赖:**
```bash
pip install requests
```

### 性能指标

**典型执行时间(良好网络):**
- Claude CLI 摘要: 0.5-1.5 秒
- Pushover API: 0.3-1.0 秒
- Windows Toast: 0.1-0.3 秒
- **总耗时: 1.0-2.5 秒**

**最坏情况(超时降级):**
- Claude CLI 超时: 2.0 秒 → 降级到固定消息
- Pushover 超时: 2.0 秒 → 跳过
- Windows Toast 超时: 1.0 秒 → 跳过
- **总耗时: 4.0 秒**(仍在 5 秒限制内)

### 安全考虑

**凭据安全:**
- 环境变量存储在用户配置文件中(非明文文件)
- 日志文件中凭据被遮蔽(仅显示前 4 和后 4 字符)
- 不在代码中硬编码任何凭据

**网络通信:**
- Pushover API 使用 HTTPS (TLS 1.2+)
- 不发送敏感项目数据,仅项目名称和任务摘要

**执行安全:**
- Hook 脚本以当前用户权限运行
- 不执行任何提升权限的操作
- 严格的超时保护,防止资源耗尽

## 版本历史

### Version 1.0.0 (2026-02-24)

**初始发布**

**功能:**
- Pushover 推送通知集成
- Windows Toast 桌面通知
- AI 驱动的任务摘要(Claude CLI)
- 并行通知发送(ThreadPoolExecutor)
- 优雅降级策略
- 环境变量配置(PUSHOVER_TOKEN, PUSHOVER_USER)
- 项目级控制开关(.no-pushover, .no-windows)
- 自动日志清理(5 天保留)
- 诊断工具(verify-installation.py, --diagnose)

**技术特性:**
- 超时保护: Claude CLI (2s), Pushover (2s), Windows (1s), 总体 (4s)
- 并发支持: PID 隔离的日志文件
- 零外部依赖(除 requests 库)
- Python 3.6+ 兼容

**已知限制:**
- 仅支持 Windows 系统(Toast 通知)
- 不支持 Linux/macOS 系统通知
- 不支持项目级安装模式(仅全局技能)
- 需要 Claude CLI 用于 AI 摘要(可选)

## 支持

如有问题或功能请求,请检查项目仓库或文档。

## 许可证

本插件为 Claude Code 用户提供。详见仓库许可证详情。
