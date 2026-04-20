# TortoiseGit Command Reference

> Back to [SKILL.md](../SKILL.md)

**Command reference for Git operations:**

**推荐: 命令行 git (无 GUI，使用 plink + PPK)**

Commit:
```bash
git commit -m "Your commit message"
```

Push:
```bash
git push
# 推送到特定分支
git push origin feature-branch
```

一次性配置 (使用 PPK 密钥):
```bash
git config --global core.sshcommand "plink"
```

**备选: TortoiseGitProc.exe (图形界面，不推荐用于自动化)**

Commit:
```bash
TortoiseGitProc.exe /command:commit /path:"." /logmsg:"Message" /closeonend:2
```

Push:
```bash
TortoiseGitProc.exe /command:push /path:"." /closeonend:2
```

**Parameters (TortoiseGitProc):**
- `/command:commit` - Execute commit operation
- `/command:push` - Execute push operation
- `/path:"."` - Repository directory ("." for current directory)
- `/logmsg:"message"` - Commit message (must be quoted)
- `/closeonend:2` - Always auto-close (recommended for automation)
- `/silent` - Suppress all dialogs (may not always work)

**为什么优先使用命令行 git?**
- 速度更快 (无 GUI 开销)
- 完全静默 (不会弹出任何窗口)
- 更可靠 (不依赖图形界面)
- 相同的认证方式 (plink + PPK)
