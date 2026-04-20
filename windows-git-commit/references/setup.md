# One-Time Setup Guide

> Back to [SKILL.md](../SKILL.md)

**推荐的一键配置(完全自动化):**

为了实现完全无人工干预的 Git 操作,建议执行以下一次性配置:

**步骤 1: 找到 TortoisePlink.exe 的完整路径**

TortoiseGit 通常自带 TortoisePlink.exe，常见位置:
```bash
# 检查 64 位系统
ls "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"

# 或 32 位系统
ls "C:\Program Files (x86)\TortoiseGit\bin\TortoisePlink.exe"
```

如果上述都不存在，可能需要单独安装 PuTTY。

**步骤 2: 配置 git 使用 TortoisePlink**

⚠️ **重要**: 路径必须使用 Windows 格式并正确转义!

```bash
# 64 位系统 (推荐)
git config --global core.sshcommand "\"C:\Program Files\TortoiseGit\bin\TortoisePlink.exe\""

# 32 位系统
git config --global core.sshcommand "\"C:\Program Files (x86)\TortoiseGit\bin\TortoisePlink.exe\""

# 如果使用单独安装的 PuTTY
git config --global core.sshcommand "\"C:\Program Files\PuTTY\plink.exe\""
```

**步骤 3: 验证配置**
```bash
# 检查 git 配置
git config --global core.sshcommand
# 应该显示完整路径，例如: "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"

# 检查 Pageant 是否运行 (使用 grep 命令)
tasklist | grep -i pageant
# 应该显示 pageant.exe 进程
```

**步骤 4: 配置 Pageant 开机自动启动并加载 PPK**

创建一个批处理文件 `start-pageant.bat`:
```batch
@echo off
REM 使用 TortoiseGit 的 Pageant
start "Pageant" "C:\Program Files\TortoiseGit\bin\pageant.exe" "%USERPROFILE%\.ssh\your_key.ppk"

REM 或者使用 PuTTY 的 Pageant
REM start "Pageant" "C:\Program Files\PuTTY\pageant.exe" "%USERPROFILE%\.ssh\your_key.ppk"
```

将此批处理文件的快捷方式放到启动文件夹:
`%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`

**完成!**
现在所有 Git 操作都会:
- 自动使用 PPK 密钥认证(无需手动输入密码)
- 不会弹出任何对话框
- 完全在后台使用命令行 git 运行
- 无需手动干预

**常见问题排查:**
详见 [troubleshooting.md](troubleshooting.md) 文件。
