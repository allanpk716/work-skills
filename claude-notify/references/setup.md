# 配置指南

> 返回 [SKILL.md](../SKILL.md) 主文档

## 引导式安装 (推荐新用户)

若您不想手动配置 Pushover 凭据与环境,可使用 NPX 引导式安装器一步完成:

```bash
npx @allanpk716/work-skills-setup
```

安装器会自动完成:

- **环境检测**:Windows 系统、Python 3.8+、`requests` 库 (缺失时提示安装)
- **Pushover 凭据配置**:交互式收集 API Token 与 User Key,验证有效性后保存
- **通知 hooks 注册**:将 Stop/Notification hooks 写入全局 `~/.claude/settings.json`
- **安装验证**:自动运行 `--verify` 检查所有组件就绪

卸载时同样可用:`npx @allanpk716/work-skills-setup --uninstall`。

> 若您偏好手动配置,继续阅读下方"Pushover 详细配置"。

## Pushover 详细配置

### 1. 创建 Pushover 账号

1. 访问 https://pushover.net
2. 点击 "Sign Up" 创建账号
3. 使用邮箱验证完成注册

### 2. 创建应用并获取凭据

1. 登录后,访问 https://pushover.net/apps/build
2. 填写应用信息:
   - **Name**: Claude Code Notify (或任何您喜欢的名称)
   - **Type**: Application
  - **Description**: Claude Code 任务完成通知
3. 点击 "Create Application"
4. 创建后,您会看到:
   - **API Token/Key**: 这是您的 `PUSHOVER_TOKEN`
   - **User Key**: 页面右上角显示,这是您的 `PUSHOVER_USER`

### 3. 配置环境变量

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

### 4. 验证凭据

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

## 项目级控制开关

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

## 配置示例场景

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
