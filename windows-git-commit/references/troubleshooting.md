# Troubleshooting

> Back to [SKILL.md](../SKILL.md)

**Common errors and solutions:**

**Error: "Permission denied (publickey)"**
Solution:
- 确保 Pageant 正在运行: `tasklist | find /I "pageant.exe"`
- 确保 PPK 密钥已加载到 Pageant
- 验证 git 配置: `git config --global core.sshcommand` 应该显示 "plink"
- 检查远程 URL: `git remote -v`

**Error: "Nothing to commit"**
Solution:
- 检查是否有暂存的文件: `git status`
- 暂存文件: `git add -A`
- 确认确实有更改

**Error: "Push rejected"**
Solution:
- 先拉取: `git pull --rebase`
- 解决冲突 (如果有)
- 再次尝试推送

**Error: "Failed to push some refs"**
Solution:
- 检查网络连接
- 验证远程仓库是否存在
- 确保有推送权限
- 检查分支是否受保护

**Error: "plink not found" or "cannot spawn plink"**
Solution:
- 检查 TortoisePlink.exe 是否存在: `ls "C:\Program Files\TortoiseGit\bin\TortoisePlink.exe"`
- 使用完整路径配置: `git config --global core.sshcommand "\"C:\Program Files\TortoiseGit\bin\TortoisePlink.exe\""`
- 注意路径格式: 必须使用 Windows 格式 (C:\Program Files\...) 并转义引号

**Error: Pageant 未运行**
Solution:
- 启动 Pageant: 双击 Pageant.exe 或使用启动脚本
- 加载 PPK 密钥: `pageant.exe "path\to\key.ppk"`
- 验证 Pageant 运行: `tasklist | grep -i pageant` (注意使用 grep 不是 find)

**Error: "C:/Program Files/...: line 1: C:/Program: No such file or directory"**
Solution:
- 路径格式错误，Git Bash 路径不被 Windows 程序识别
- 使用正确的 Windows 路径格式: `C:\Program Files\...` (双反斜杠)
- 必须用引号包裹并转义: `"\"C:\Program Files\...\""`
