# 常见问题 (FAQ)

> 返回 [SKILL.md](../SKILL.md) 主文档

## Q: 为什么没有收到任何通知?

**快速诊断 - 使用环境检查命令:**

**推荐第一步:** 运行环境检查命令来自动诊断问题:

```bash
/check-notify-env
```

此命令会自动检查所有可能导致通知失败的配置问题,并给出具体的修复步骤。

---

**可能原因:**
1. 环境变量未正确设置或未生效
2. Python 依赖包缺失 (requests 库未安装)
3. Pushover API 凭据无效
4. Hook 未正确注册到全局 settings.json
5. 项目根目录存在 `.no-pushover` 和 `.no-windows` 文件
6. **通知脚本未复制到 ~/.claude/hooks/ 目录**

**解决步骤:**

1. **运行环境检查命令 (推荐):**
   ```bash
   /check-notify-env
   ```

   命令会自动检查所有配置并给出修复建议。

2. **检查 Python 依赖包:**
   ```bash
   python -m pip list | grep requests
   ```

   如果没有看到 `requests`,需要安装:
   ```bash
   python -m pip install requests
   ```

3. **验证环境变量:**
   ```cmd
   REM 命令提示符
   echo %PUSHOVER_TOKEN%
   echo %PUSHOVER_USER%

   REM PowerShell
   [Environment]::GetEnvironmentVariable("PUSHOVER_TOKEN", "User")
   ```

   如果显示为空,需要重新设置并重启终端。

4. **运行验证脚本:**
   ```bash
   python scripts/verify-installation.py
   ```

   脚本会检查所有依赖项并给出明确的错误提示。

5. **检查 Hook 安装:**
   ```bash
   REM 查看 Claude Code 调试日志
   claude --debug
   ```

   在日志中查找 Hook 执行记录。

6. **检查项目控制文件:**
   ```cmd
   dir .no-*
   ```

   如果存在 `.no-pushover` 或 `.no-windows`,删除它们:
   ```cmd
   del .no-pushover
   del .no-windows
   ```

5. **重新运行安装命令（重要）:**

   如果通知功能异常，请重新运行安装命令来更新全局 hooks：

   ```bash
   npx github:allanpk716/work-skills#main
   ```

   安装命令会自动：
   - 复制最新的通知脚本到 `~/.claude/hooks/`
   - 更新 `~/.claude/settings.json` 中的 hooks 注册

   **重启 Claude Code 后生效**

## Q: 为什么会收到"等待输入"通知?

**这是正常功能。** 当 Claude 在多轮交互中等待您输入时会发送此通知。

**触发场景:**
- 使用交互式命令(如计划模式、讨论功能)
- Claude 提供选项让您选择
- Claude 需要您的确认或补充信息

**防抖机制:**
- 同一交互过程中,10秒内只通知一次
- 避免通知轰炸
- 确保您不会错过需要操作的时机

**如何禁用:**
与任务完成通知相同,使用项目级控制文件:
- `.no-pushover` - 禁用 Pushover 等待通知
- `.no-windows` - 禁用 Windows 等待通知

## Q: 等待通知和任务完成通知有什么区别?

| 特性 | 任务完成通知 | 等待输入通知 |
|------|------------|------------|
| 触发时机 | Claude 完成任务 | Claude 等待输入 |
| 消息内容 | AI 生成的任务摘要 | "Claude 正在等待您的输入" |
| Hook 事件 | Stop | UserPromptSubmit |
| 防抖 | 无 | 10秒防抖 |
| 典型场景 | 代码编写完成<br>测试通过<br>文档更新完成 | 计划确认<br>方案选择<br>信息补充 |

## Q: Pushover 通知不工作,但 Windows Toast 正常?

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

## Q: Windows Toast 通知不出现?

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

## Q: 通知发送很慢,超过 5 秒?

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

## Q: 如何为特定项目禁用通知?

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

## Q: 如何查看日志文件进行故障排查?

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

## Q: 收到的通知内容不准确或显示固定消息?

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

## Q: 多个 Claude Code 会话同时运行,通知会冲突吗?

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

## Q: 为什么 Pushover 通知有时会失败,但 Windows 通知正常?

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
