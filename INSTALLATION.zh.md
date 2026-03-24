# 安装和升级指南

## 📦 在新电脑上安装

### 前置要求

在运行安装器之前,请确保您的系统满足以下要求:

- ✅ **Windows 操作系统** (Windows 10/11)
- ✅ **Python 3.8+** 已安装并添加到 PATH
- ✅ **Node.js 16+** 已安装
- ✅ **Git** 已安装
- ✅ **TortoiseGit 或 PuTTY** (用于 SSH 认证,可选)

### 一键安装

打开命令提示符或 PowerShell,运行:

```bash
npx @allanpk716/work-skills-setup
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
# 验证安装是否成功
npx @allanpk716/work-skills-setup --verify
```

这将检查以下项目:

- ✓ Python 版本和库
- ✓ 环境变量配置
- ✓ 插件文件完整性
- ✓ 斜杠命令响应

---

## 🔄 升级现有安装

### 方法 1: 使用 Claude Code 插件管理器 (推荐)

1. 在 Claude Code 中运行:
   ```
   /plugin
   ```

2. 切换到 **Marketplaces** 标签

3. 选择 **work-skills**

4. 选择 **Update marketplace**

5. 启用 **Auto-update** 以自动获取最新版本

### 方法 2: 重新运行安装器

```bash
# 重新运行安装器,会自动更新到最新版本
npx @allanpk716/work-skills-setup
```

安装器会:
- 保留您现有的配置
- 更新插件到最新版本
- 重新验证安装

### 方法 3: 手动更新特定插件

```bash
# 更新特定插件
npx skills update claude-notify@work-skills
npx skills update git-skills@work-skills
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
npx @allanpk716/work-skills-setup --verify
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
npx @allanpk716/work-skills-setup --verify
```

---

## 📋 安装检查清单

完整安装应包含:

- [ ] Python 3.8+ 已安装
- [ ] Git 已安装
- [ ] Node.js 16+ 已安装
- [ ] work-skills 插件已添加到 Claude Code
- [ ] 至少安装了一个技能插件:
  - [ ] claude-notify (通知)
  - [ ] git-skills (Git 自动化)
- [ ] 验证脚本通过 5/7 检查或更多

---

## 🎯 快速命令参考

```bash
# 首次安装
npx @allanpk716/work-skills-setup

# 验证安装
npx @allanpk716/work-skills-setup --verify

# 查看帮助
npx @allanpk716/work-skills-setup --help

# 查看版本
npx @allanpk716/work-skills-setup --version

# 中文界面
npx @allanpk716/work-skills-setup --lang zh
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
   - 定期运行 `--verify` 检查安装状态
   - 启用自动更新以获取最新功能
   - 升级前查看 [CHANGELOG.md](CHANGELOG.md)

3. **故障排查:**
   - 运行 `--verify` 查看具体失败项
   - 查看 Claude Code 日志
   - 提交 Issue: https://github.com/allanpk716/work-skills/issues

---

**需要帮助?** 在 Claude Code 中说: "帮我检查 work-skills 安装状态"
