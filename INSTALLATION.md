# 安装和升级指南

## 📦 在新电脑上安装

### 前置要求

在运行安装器之前,请确保您的系统满足以下要求:

- ✅ **Windows 操作系统** (Windows 10/11)
- ✅ **Python 3.8+** 已安装并添加到 PATH
- ✅ **Node.js 16+** 已安装
- ✅ **Git** 已安装
- ✅ **TortoiseGit 或 PuTTY** (用于 SSH 认证,可选)

### NPX Install (Recommended)

Two equivalent commands, both pull from GitHub:

```bash
# Explicit GitHub source with branch (recommended)
npx github:allanpk716/work-skills#main

# Shorthand form
npx allanpk716/work-skills
```

This automatically downloads and runs the installer. No clone needed.

### Manual Clone Install

```bash
git clone https://github.com/allanpk716/work-skills.git
cd work-skills
node installer/src/index.js
```

安装器将自动完成以下步骤:

1. **环境检测** - 检测所有必需的依赖项
2. **依赖安装** - 自动安装缺失的 Python 库
3. **交互式配置** - 引导您配置:
   - Pushover 通知凭证 (可选)
   - Git SSH 配置 (可选)
   - Git 用户信息 (必需)
4. **插件安装** - 从市场安装 Claude Code 技能插件
5. **安装验证** - 验证所有功能正常工作

### 安装后验证

安装完成后,您可以运行:

```bash
# 进入安装目录
cd work-skills

# 验证安装是否成功
node installer/src/index.js --verify
```

这将检查以下项目:

- ✓ Python 版本和库
- ✓ 环境变量配置
- ✓ 插件文件完整性
- ✓ 斜杠命令响应

---

## 🔄 升级现有安装

### 方法 1: 重新运行 NPX (推荐)

```bash
npx github:allanpk716/work-skills#main
```

### 方法 2: Git 拉取更新

```bash
# 进入仓库目录
cd work-skills

# 拉取最新代码
git pull origin main

# 重新运行安装器
node installer/src/index.js
```

### 方法 3: 重新克隆

```bash
# 备份配置 (如果有自定义配置)
# ...

# 删除旧目录并重新克隆
rm -rf work-skills
git clone https://github.com/allanpk716/work-skills.git
cd work-skills

# 运行安装器
node installer/src/index.js
```

---

## 🛠️ 常见问题

### 1. 安装失败: Python not found

**解决方案:**
```bash
# 检查 Python 是否安装
python --version

# 如果未安装,从官网下载安装
# https://www.python.org/downloads/
```

### 2. 验证失败: PUSHOVER_TOKEN not set

这是正常的!Pushover 通知是可选功能。

**如果需要启用:**
```bash
# 设置环境变量
setx PUSHOVER_TOKEN "your-token-here"
setx PUSHOVER_USER "your-user-key-here"

# 重新运行验证
node installer/src/index.js --verify
```

### 3. Git SSH 配置问题

**解决方案:**
```bash
# 使用 TortoiseGit 的 SSH
git config --global core.sshCommand "C:/Program Files/TortoiseGit/bin/TortoisePlink.exe"

# 确保 Pageant 正在运行且已加载 PPK 密钥
```

### 4. 升级后插件不工作

**解决方案:**
```bash
# 1. 清理 Claude Code 缓存
# 2. 重启 Claude Code
# 3. 重新运行安装器
cd work-skills
node installer/src/index.js --verify
```

---

## 📋 安装检查清单

完整安装应包含:

- [ ] Python 3.8+ 已安装
- [ ] Git 已安装
- [ ] Node.js 16+ 已安装
- [ ] 至少安装了一个技能插件:
  - [ ] claude-notify (通知)
  - [ ] windows-git-commit (Git 自动化)
- [ ] 验证脚本通过 5/7 检查或更多

---

## 🎯 快速命令参考

```bash
# 克隆仓库
git clone https://github.com/allanpk716/work-skills.git

# 进入目录
cd work-skills

# 运行安装
node installer/src/index.js

# 验证安装
node installer/src/index.js --verify

# 查看帮助
node installer/src/index.js --help

# 查看版本
node installer/src/index.js --version

# 中文界面
node installer/src/index.js --lang zh
```

---

## 📚 相关文档

- [README.md](README.md) - 项目概览
- [README.zh.md](README.zh.md) - 中文项目概览
- [Claude Code 插件文档](https://claude.com/docs/plugins)

---

## 💡 提示

1. **首次安装建议:**
   - 准备好 Pushover 凭证(如果需要推送通知)
   - 确保 Git 用户信息已配置
   - 保持网络连接稳定

2. **升级建议:**
   - 定期运行 `git pull` 获取更新
   - 运行 `--verify` 检查安装状态
   - 升级前查看 [CHANGELOG.md](CHANGELOG.md)

3. **故障排查:**
   - 运行 `--verify` 查看具体失败项
   - 查看 Claude Code 日志
   - 提交 Issue: https://github.com/allanpk716/work-skills/issues

---

**需要帮助?** 在 Claude Code 中说: "帮我检查 work-skills 安装状态"
