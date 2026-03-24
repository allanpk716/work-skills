# 快速安装指南

## ✅ 最简单的安装方法 (推荐)

### 一键安装

```bash
npx github:allanpk716/work-skills#main
```

这个命令会:
1. 从 GitHub 克隆最新版本
2. 自动安装依赖
3. 运行安装器

---

## 📋 备用方法: 手动克隆安装

### 第 1 步: 克隆仓库

```bash
git clone https://github.com/allanpk716/work-skills.git
```

### 第 2 步: 进入目录

```bash
cd work-skills
```

### 第 3 步: 运行安装器

```bash
node installer/src/index.js
```

---

## 📋 完整输出示例

```bash
$ git clone https://github.com/allanpk716/work-skills.git
Cloning into 'work-skills'...
remote: Enumerating objects: 1234, done.
remote: Counting objects: 100% (1234/1234), done.
remote: Compressing objects: 100% (789/789), done.
remote: Total 1234 (delta 445), reused 1234 (delta 445), pack-reused 0
Receiving objects: 100% (1234/1234), 1.23 MiB | 1.23 MiB/s, done.
Resolving deltas: 100% (445/445), done.

$ cd work-skills

$ node installer/src/index.js

       ╭─────────────────────────────────────────────────────────╮
       │                                                         │
       │   Work Skills Setup                                     │
       │   Claude Code skills installer for Windows developers   │
       │                                                         │
       │   Version: v0.1.0                                       │
       │                                                         │
       │   Features:                                             │
       │     * Auto-configure environment                        │
       │     * Install required dependencies                     │
       │     * Setup Claude Code integration                     │
       │                                                         │
       ╰─────────────────────────────────────────────────────────╯

Checking environment dependencies...

=== Environment Detection ===

|----------------------|---------|------------------------------------------|
| Name                 | Status  | Details                                  |
|----------------------|---------|------------------------------------------|
| Python (3.8+)        | ✓ PASS  | Python 3.9.1 found                       |
| Git                  | ✓ PASS  | git version 2.30.0.windows.1            |
| ...                  | ...     | ...                                      |
|----------------------|---------|------------------------------------------|

Summary: 6/7 passed

[Interactive configuration prompts...]
[Plugin installation...]
[Verification...]

=== Installation Verification ===

|---------------------------|------------|--------------------------------------------------|
| Check                     | Status     | Details                                          |
|---------------------------|------------|--------------------------------------------------|
| Python version            | ✓ PASS     | 3.9.1 (>=3.8 required)                          |
| ...                       | ...        | ...                                              |
|---------------------------|------------|--------------------------------------------------|

Summary: 5/7 checks passed

To re-run verification: node installer/src/index.js --verify
```

---

## 🔄 后续使用

### 验证安装

```bash
cd work-skills
node installer/src/index.js --verify
```

### 更新到最新版本

```bash
cd work-skills
git pull origin main
node installer/src/index.js
```

### 使用中文界面

```bash
node installer/src/index.js --lang zh
```

---

## ❓ 常见问题

### Q: 为什么 npx 命令不工作?

A: npx 需要在仓库根目录有 package.json,但我们的安装器在 `installer/` 子目录中。直接克隆运行是最简单的方法。

### Q: 需要全局安装吗?

A: 不需要。这是一个本地安装器,在克隆的目录中运行即可。技能插件会自动安装到 Claude Code 的插件目录。

### Q: 如何卸载?

A: 只需删除克隆的目录:
```bash
cd ..
rm -rf work-skills  # Linux/Mac
rmdir /s work-skills  # Windows
```

Claude Code 插件可以通过 `/plugin remove` 命令移除。

---

## 🎯 下一步

安装完成后,您可以:

1. 在 Claude Code 中运行 `/plugin` 查看已安装的插件
2. 运行 `/windows-git-commit` 测试 Git 技能
3. 配置 Pushover 通知(如果需要)
4. 查看插件文档了解所有可用技能

---

## 📚 详细文档

- [INSTALLATION.zh.md](INSTALLATION.zh.md) - 完整安装指南
- [README.zh.md](README.zh.md) - 项目概览
- [CHANGELOG.md](CHANGELOG.md) - 更新日志

---

**遇到问题?**
1. 运行 `node installer/src/index.js --verify` 查看详细信息
2. 查看 [INSTALLATION.zh.md](INSTALLATION.zh.md) 的故障排查部分
3. 提交 Issue: https://github.com/allanpk716/work-skills/issues
